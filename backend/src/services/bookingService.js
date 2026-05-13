const { withTransaction, pool } = require('../config/database');
const bookingRepository = require('../repositories/bookingRepository');
const fieldRepository = require('../repositories/fieldRepository');
const slotRepository = require('../repositories/slotRepository');
const pricingRepository = require('../repositories/pricingRepository');
const membershipRepository = require('../repositories/membershipRepository');
const promoRepository = require('../repositories/promoRepository');
const paymentRepository = require('../repositories/paymentRepository');
const { sseManager } = require('./sse/sseManager');
const {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError
} = require('../utils/errors');
const {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  SLOT_LOCK_TIMEOUT_MINUTES,
  RESCHEDULE_DEADLINE_HOURS
} = require('../config/constants');
const {
  getDayType,
  calculateFinalPrice,
  calculateDP,
  isRescheduleAllowed
} = require('../utils/helpers');

const bookingService = {
  /**
   * Create booking with slot locking
   * Uses database transaction to prevent double booking
   */
  async createBooking(userId, { branchId, fieldId, slotId, bookingDate, promoCode }) {
    return await withTransaction(async (client) => {
      // 1. Validate field exists and belongs to branch
      const field = await fieldRepository.findById(fieldId);
      if (!field || field.branch_id !== branchId) {
        throw new NotFoundError('Field not found in specified branch');
      }

      // 2. Validate slot exists
      const slot = await slotRepository.findById(slotId);
      if (!slot || !slot.is_active) {
        throw new NotFoundError('Time slot not found');
      }

      // 3. Validate booking date is in the future
      const bookingDateObj = new Date(bookingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (bookingDateObj < today) {
        throw new BadRequestError('Cannot book for past dates');
      }

      // 4. Check slot availability with row lock (FOR UPDATE)
      const isAvailable = await bookingRepository.isSlotAvailable(
        fieldId, slotId, bookingDate, client
      );
      if (!isAvailable) {
        throw new ConflictError('Slot is no longer available', 'SLOT_UNAVAILABLE');
      }

      // 5. Get base price
      const dayType = getDayType(bookingDate);
      const pricing = await pricingRepository.findByFieldSlotDay(fieldId, slotId, dayType);
      if (!pricing) {
        throw new NotFoundError('Pricing not found for this slot');
      }

      // 6. Get membership discount if active
      const activeMembership = await membershipRepository.findActiveByUserId(userId);

      // 7. Validate and get promo discount if provided
      let promo = null;
      if (promoCode) {
        promo = await promoRepository.findValidByCode(promoCode);
        if (!promo) {
          throw new BadRequestError('Invalid or expired promo code');
        }

        // Check if user already used this promo
        const hasUsed = await promoRepository.hasUserUsedPromo(userId, promo.promo_id);
        if (hasUsed) {
          throw new BadRequestError('Promo code already used');
        }
      }

      // 8. Calculate final price (base → membership → promo)
      const priceCalc = calculateFinalPrice(
        parseFloat(pricing.price),
        activeMembership,
        promo
      );

      // 9. Create booking with LOCKED status
      const booking = await bookingRepository.create({
        userId,
        branchId,
        fieldId,
        slotId,
        bookingDate,
        status: BOOKING_STATUS.LOCKED,
        basePrice: priceCalc.basePrice,
        membershipDiscount: priceCalc.membershipDiscountAmount,
        promoDiscount: priceCalc.promoDiscountAmount,
        finalPrice: priceCalc.finalPrice
      }, client);

      // 10. Record promo usage if used
      if (promo) {
        await promoRepository.recordUsage(userId, promo.promo_id, client);
      }

      // 11. Broadcast availability update
      sseManager.broadcastAvailabilityUpdate({
        type: 'SLOT_LOCKED',
        branchId,
        fieldId,
        slotId,
        bookingDate,
        status: BOOKING_STATUS.LOCKED
      });

      return {
        bookingId: booking.booking_id,
        fieldName: field.name,
        branchName: field.branch_name,
        bookingDate: booking.booking_date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        basePrice: priceCalc.basePrice,
        membershipDiscount: priceCalc.membershipDiscountAmount,
        promoDiscount: priceCalc.promoDiscountAmount,
        finalPrice: priceCalc.finalPrice,
        dpAmount: calculateDP(priceCalc.finalPrice),
        status: booking.status,
        expiresIn: SLOT_LOCK_TIMEOUT_MINUTES * 60, // seconds
        createdAt: booking.created_at
      };
    });
  },

  /**
   * Get user's bookings
   */
  async getUserBookings(userId, { page, limit, offset, status }) {
    const [bookings, total] = await Promise.all([
      bookingRepository.findByUserId(userId, { limit, offset, status }),
      bookingRepository.countByUserId(userId, status)
    ]);

    return {
      bookings: bookings.map(b => ({
        bookingId: b.booking_id,
        branchName: b.branch_name,
        fieldName: b.field_name,
        bookingDate: b.booking_date,
        startTime: b.start_time,
        endTime: b.end_time,
        finalPrice: b.final_price,
        status: b.status,
        createdAt: b.created_at
      })),
      pagination: { page, limit, total }
    };
  },

  /**
   * Get booking details
   */
  async getBookingById(bookingId, userId = null, isAdmin = false) {
    const booking = await bookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check ownership if not admin
    if (!isAdmin && userId && booking.user_id !== userId) {
      throw new ForbiddenError('Access denied');
    }

    // Get payment info
    const payments = await paymentRepository.findByBookingId(bookingId);

    return {
      bookingId: booking.booking_id,
      userId: booking.user_id,
      userName: booking.user_name,
      userPhone: booking.user_phone,
      branchId: booking.branch_id,
      branchName: booking.branch_name,
      fieldId: booking.field_id,
      fieldName: booking.field_name,
      slotId: booking.slot_id,
      startTime: booking.start_time,
      endTime: booking.end_time,
      bookingDate: booking.booking_date,
      basePrice: booking.base_price,
      membershipDiscount: booking.membership_discount,
      promoDiscount: booking.promo_discount,
      finalPrice: booking.final_price,
      dpAmount: calculateDP(parseFloat(booking.final_price)),
      status: booking.status,
      createdAt: booking.created_at,
      payments: payments.map(p => ({
        paymentId: p.payment_id,
        amount: p.amount,
        status: p.status,
        paidAt: p.paid_at
      }))
    };
  },

  /**
   * Cancel booking (only LOCKED status)
   */
  async cancelBooking(bookingId, userId, isAdmin = false) {
    const booking = await bookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (!isAdmin && booking.user_id !== userId) {
      throw new ForbiddenError('Access denied');
    }

    if (booking.status !== BOOKING_STATUS.LOCKED) {
      throw new BadRequestError('Only locked bookings can be cancelled');
    }

    await bookingRepository.updateStatus(bookingId, BOOKING_STATUS.EXPIRED);

    // Broadcast availability update
    sseManager.broadcastAvailabilityUpdate({
      type: 'SLOT_RELEASED',
      branchId: booking.branch_id,
      fieldId: booking.field_id,
      slotId: booking.slot_id,
      bookingDate: booking.booking_date
    });

    return { message: 'Booking cancelled' };
  },

  /**
   * Reschedule booking
   */
  async rescheduleBooking(bookingId, userId, { newSlotId, newBookingDate }, isAdmin = false) {
    return await withTransaction(async (client) => {
      const booking = await bookingRepository.findById(bookingId, client);

      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      if (!isAdmin && booking.user_id !== userId) {
        throw new ForbiddenError('Access denied');
      }

      // Check if booking is confirmed or rescheduled
      if (![BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.RESCHEDULED].includes(booking.status)) {
        throw new BadRequestError('Only confirmed bookings can be rescheduled');
      }

      // Check reschedule count (max 1)
      const rescheduleCount = await bookingRepository.getRescheduleCount(bookingId);
      if (rescheduleCount >= 1) {
        throw new BadRequestError('Maximum reschedule limit reached');
      }

      // Check reschedule deadline (2 hours before play time)
      if (!isRescheduleAllowed(booking.booking_date, booking.start_time, RESCHEDULE_DEADLINE_HOURS)) {
        throw new BadRequestError(`Reschedule must be done at least ${RESCHEDULE_DEADLINE_HOURS} hours before play time`);
      }

      // Validate new slot
      const newSlot = await slotRepository.findById(newSlotId);
      if (!newSlot || !newSlot.is_active) {
        throw new NotFoundError('New time slot not found');
      }

      // Check new slot availability
      const isAvailable = await bookingRepository.isSlotAvailable(
        booking.field_id, newSlotId, newBookingDate, client
      );
      if (!isAvailable) {
        throw new ConflictError('New slot is not available');
      }

      // Create reschedule log
      await bookingRepository.createRescheduleLog({
        bookingId,
        oldDate: booking.booking_date,
        oldSlotId: booking.slot_id,
        newDate: newBookingDate,
        newSlotId,
        rescheduledBy: isAdmin ? 'ADMIN' : 'USER'
      }, client);

      // Update booking (price stays the same)
      const updatedBooking = await bookingRepository.reschedule(bookingId, {
        slotId: newSlotId,
        bookingDate: newBookingDate
      }, client);

      // Broadcast availability updates
      sseManager.broadcastAvailabilityUpdate({
        type: 'SLOT_RELEASED',
        branchId: booking.branch_id,
        fieldId: booking.field_id,
        slotId: booking.slot_id,
        bookingDate: booking.booking_date
      });

      sseManager.broadcastAvailabilityUpdate({
        type: 'SLOT_BOOKED',
        branchId: booking.branch_id,
        fieldId: booking.field_id,
        slotId: newSlotId,
        bookingDate: newBookingDate,
        status: BOOKING_STATUS.RESCHEDULED
      });

      return {
        bookingId: updatedBooking.booking_id,
        oldDate: booking.booking_date,
        oldSlotId: booking.slot_id,
        newDate: newBookingDate,
        newSlotId,
        status: updatedBooking.status,
        message: 'Booking rescheduled successfully'
      };
    });
  },

  /**
   * Get availability for a branch on a specific date
   */
  async getAvailability(branchId, date) {
    // Get all fields in branch
    const fields = await fieldRepository.findByBranchId(branchId);

    // Get all time slots
    const slots = await slotRepository.findAll();

    // Get booked slots for the date
    const bookedSlots = await bookingRepository.getBookedSlots(branchId, date);

    // Build availability map
    const bookedMap = new Map();
    bookedSlots.forEach(b => {
      bookedMap.set(`${b.field_id}-${b.slot_id}`, b.status);
    });

    // Get pricing for the day type
    const dayType = getDayType(date);

    const availability = await Promise.all(fields.map(async (field) => {
      const fieldSlots = await Promise.all(slots.map(async (slot) => {
        const key = `${field.field_id}-${slot.slot_id}`;
        const status = bookedMap.get(key);
        const isBooked = !!status;

        // Get price
        const pricing = await pricingRepository.findByFieldSlotDay(
          field.field_id, slot.slot_id, dayType
        );

        return {
          slotId: slot.slot_id,
          startTime: slot.start_time,
          endTime: slot.end_time,
          isDay: slot.is_day,
          isAvailable: !isBooked,
          status: status || null,
          price: pricing ? pricing.price : null
        };
      }));

      return {
        fieldId: field.field_id,
        fieldName: field.name,
        slots: fieldSlots
      };
    }));

    return {
      branchId,
      date,
      dayType,
      fields: availability
    };
  },

  /**
   * Expire locked bookings that exceeded timeout
   */
  async expireLockedBookings() {
    const expiredBookings = await bookingRepository.expireLocks(SLOT_LOCK_TIMEOUT_MINUTES);

    // Broadcast updates for each expired booking
    expiredBookings.forEach(booking => {
      sseManager.broadcastAvailabilityUpdate({
        type: 'SLOT_RELEASED',
        branchId: booking.branch_id,
        fieldId: booking.field_id,
        slotId: booking.slot_id,
        bookingDate: booking.booking_date
      });
    });

    return expiredBookings.length;
  },

  /**
   * Get all bookings (admin)
   */
  async getAllBookings({ page, limit, offset, branchId, status, startDate, endDate }) {
    const [bookings, total] = await Promise.all([
      bookingRepository.findAll({ limit, offset, branchId, status, startDate, endDate }),
      bookingRepository.countAll({ branchId, status, startDate, endDate })
    ]);

    return {
      bookings: bookings.map(b => ({
        bookingId: b.booking_id,
        userId: b.user_id,
        userName: b.user_name,
        userPhone: b.user_phone,
        branchName: b.branch_name,
        fieldName: b.field_name,
        bookingDate: b.booking_date,
        startTime: b.start_time,
        endTime: b.end_time,
        finalPrice: b.final_price,
        status: b.status,
        createdAt: b.created_at
      })),
      pagination: { page, limit, total }
    };
  },

  /**
   * Get all active branches (public)
   */
  async getBranches() {
    const result = await pool.query(
      `SELECT branch_id AS "branchId", name, address FROM branches WHERE is_active = TRUE ORDER BY name`
    );
    return result.rows;
  }
};

module.exports = bookingService;
