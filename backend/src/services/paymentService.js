const crypto = require('crypto');
const { withTransaction } = require('../config/database');
const bookingRepository = require('../repositories/bookingRepository');
const paymentRepository = require('../repositories/paymentRepository');
const { sseManager } = require('./sse/sseManager');
const { 
  BadRequestError, 
  NotFoundError, 
  ForbiddenError,
  UnauthorizedError 
} = require('../utils/errors');
const { 
  BOOKING_STATUS, 
  PAYMENT_STATUS,
  DP_PERCENTAGE 
} = require('../config/constants');
const { calculateDP, generateRandomString } = require('../utils/helpers');

const paymentService = {
  /**
   * Initiate payment for a booking
   */
  async initiatePayment(bookingId, userId) {
    const booking = await bookingRepository.findById(bookingId);
    
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.user_id !== userId) {
      throw new ForbiddenError('Access denied');
    }

    // Only LOCKED bookings can be paid
    if (booking.status !== BOOKING_STATUS.LOCKED) {
      throw new BadRequestError('Booking is not in payable state');
    }

    // Calculate DP amount (50%)
    const dpAmount = calculateDP(parseFloat(booking.final_price));

    // Generate unique reference for payment gateway
    const gatewayRef = `FSL-${Date.now()}-${generateRandomString(8)}`;

    // Create payment record
    const payment = await paymentRepository.create({
      bookingId,
      amount: dpAmount,
      status: PAYMENT_STATUS.PENDING,
      gatewayRef
    });

    // Update booking status to PENDING_PAYMENT
    await bookingRepository.updateStatus(bookingId, BOOKING_STATUS.PENDING_PAYMENT);

    // Create payment gateway request (mock implementation)
    const paymentUrl = await this.createPaymentGatewayRequest({
      reference: gatewayRef,
      amount: dpAmount,
      description: `Futsal Booking - ${booking.field_name} - ${booking.booking_date}`,
      customerName: booking.user_name,
      customerPhone: booking.user_phone
    });

    // Broadcast status update
    sseManager.broadcastAvailabilityUpdate({
      type: 'BOOKING_STATUS_CHANGED',
      bookingId,
      branchId: booking.branch_id,
      fieldId: booking.field_id,
      slotId: booking.slot_id,
      bookingDate: booking.booking_date,
      status: BOOKING_STATUS.PENDING_PAYMENT
    });

    return {
      paymentId: payment.payment_id,
      bookingId,
      amount: dpAmount,
      gatewayRef,
      paymentUrl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    };
  },

  /**
   * Create payment gateway request (mock implementation)
   * Replace with actual payment gateway integration
   */
  async createPaymentGatewayRequest({ reference, amount, description, customerName, customerPhone }) {
    const gatewayUrl = process.env.PAYMENT_GATEWAY_URL || 'https://payment.example.com';
    
    // In production, this would make an actual API call to the payment gateway
    // For now, return a mock URL
    const params = new URLSearchParams({
      ref: reference,
      amount: amount.toString(),
      callback: `${process.env.OAUTH_ISSUER || 'http://localhost:3000'}/api/payments/webhook`
    });

    return `${gatewayUrl}/pay?${params.toString()}`;
  },

  /**
   * Handle payment webhook from gateway
   */
  async handleWebhook(rawBody, signature) {
    // Verify webhook signature
    const isValid = this.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new UnauthorizedError('Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody.toString());
    const { reference, status, paid_at } = payload;

    return await withTransaction(async (client) => {
      // Find payment by gateway reference
      const payment = await paymentRepository.findByGatewayRef(reference);
      if (!payment) {
        console.error(`Payment not found for reference: ${reference}`);
        return { success: false, message: 'Payment not found' };
      }

      // Already processed
      if (payment.status !== PAYMENT_STATUS.PENDING) {
        return { success: true, message: 'Already processed' };
      }

      const booking = await bookingRepository.findById(payment.booking_id, client);
      if (!booking) {
        return { success: false, message: 'Booking not found' };
      }

      if (status === 'SUCCESS' || status === 'PAID') {
        // Update payment status
        await paymentRepository.updateByGatewayRef(reference, {
          status: PAYMENT_STATUS.PAID,
          paidAt: paid_at || new Date()
        }, client);

        // Update booking status to CONFIRMED
        await bookingRepository.updateStatus(
          payment.booking_id, 
          BOOKING_STATUS.CONFIRMED, 
          client
        );

        // Broadcast update
        sseManager.broadcastAvailabilityUpdate({
          type: 'BOOKING_CONFIRMED',
          bookingId: payment.booking_id,
          branchId: booking.branch_id,
          fieldId: booking.field_id,
          slotId: booking.slot_id,
          bookingDate: booking.booking_date,
          status: BOOKING_STATUS.CONFIRMED
        });

        return { success: true, message: 'Payment confirmed' };
      } else if (status === 'FAILED' || status === 'EXPIRED') {
        // Update payment status
        await paymentRepository.updateByGatewayRef(reference, {
          status: PAYMENT_STATUS.FAILED,
          paidAt: null
        }, client);

        // Update booking status to EXPIRED
        await bookingRepository.updateStatus(
          payment.booking_id, 
          BOOKING_STATUS.EXPIRED, 
          client
        );

        // Broadcast update
        sseManager.broadcastAvailabilityUpdate({
          type: 'SLOT_RELEASED',
          branchId: booking.branch_id,
          fieldId: booking.field_id,
          slotId: booking.slot_id,
          bookingDate: booking.booking_date
        });

        return { success: true, message: 'Payment failed, booking expired' };
      }

      return { success: false, message: 'Unknown status' };
    });
  },

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(rawBody, signature) {
    if (!signature) {
      return false;
    }

    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret) {
      console.warn('PAYMENT_WEBHOOK_SECRET not configured');
      return true; // Allow in development
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  },

  /**
   * Get user's payment history
   */
  async getUserPayments(userId, { page, limit, offset }) {
    const [payments, total] = await Promise.all([
      paymentRepository.findByUserId(userId, { limit, offset }),
      paymentRepository.countByUserId(userId)
    ]);

    return {
      payments: payments.map(p => ({
        paymentId: p.payment_id,
        bookingId: p.booking_id,
        amount: p.amount,
        status: p.status,
        fieldName: p.field_name,
        bookingDate: p.booking_date,
        startTime: p.start_time,
        paidAt: p.paid_at
      })),
      pagination: { page, limit, total }
    };
  },

  /**
   * Get payment details
   */
  async getPaymentById(paymentId, userId = null, isAdmin = false) {
    const payment = await paymentRepository.findById(paymentId);
    
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Get booking to check ownership
    const booking = await bookingRepository.findById(payment.booking_id);
    if (!isAdmin && userId && booking.user_id !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return {
      paymentId: payment.payment_id,
      bookingId: payment.booking_id,
      amount: payment.amount,
      status: payment.status,
      gatewayRef: payment.gateway_ref,
      paidAt: payment.paid_at,
      fieldName: payment.field_name,
      bookingDate: payment.booking_date,
      bookingStatus: payment.booking_status
    };
  },

  /**
   * Get all payments (admin)
   */
  async getAllPayments({ page, limit, offset, status }) {
    const [payments, total] = await Promise.all([
      paymentRepository.findAll({ limit, offset, status }),
      paymentRepository.countAll(status)
    ]);

    return {
      payments: payments.map(p => ({
        paymentId: p.payment_id,
        bookingId: p.booking_id,
        userId: p.user_id,
        userName: p.user_name,
        amount: p.amount,
        status: p.status,
        fieldName: p.field_name,
        bookingDate: p.booking_date,
        paidAt: p.paid_at
      })),
      pagination: { page, limit, total }
    };
  }
};

module.exports = paymentService;
