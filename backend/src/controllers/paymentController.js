const paymentService = require('../services/paymentService');
const { successResponse, paginatedResponse } = require('../utils/response');
const { parsePagination } = require('../utils/helpers');

const paymentController = {
  /**
   * POST /payments/:bookingId/initiate
   * Initiate payment for a booking
   */
  async initiatePayment(req, res, next) {
    try {
      const { bookingId } = req.params;
      const result = await paymentService.initiatePayment(bookingId, req.user.userId);
      return successResponse(res, result, 'Payment initiated');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /payments/webhook
   * Handle payment gateway webhook
   */
  async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-payment-signature'] || 
                       req.headers['x-signature'] ||
                       req.headers['signature'];
      
      const result = await paymentService.handleWebhook(req.body, signature);
      
      // Always return 200 to acknowledge receipt
      return res.status(200).json(result);
    } catch (error) {
      console.error('Webhook error:', error);
      // Still return 200 to prevent retries
      return res.status(200).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /payments
   * Get user's payment history
   */
  async getUserPayments(req, res, next) {
    try {
      const { page, limit, offset } = parsePagination(req.query);
      
      const result = await paymentService.getUserPayments(req.user.userId, {
        page, limit, offset
      });
      
      return paginatedResponse(res, result.payments, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /payments/:paymentId
   * Get payment details
   */
  async getPaymentById(req, res, next) {
    try {
      const { paymentId } = req.params;
      const isAdmin = req.user.roles.includes('ADMIN');
      
      const result = await paymentService.getPaymentById(
        paymentId, 
        req.user.userId, 
        isAdmin
      );
      
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /admin/payments
   * Get all payments (admin)
   */
  async getAllPayments(req, res, next) {
    try {
      const { page, limit, offset } = parsePagination(req.query);
      const { status } = req.query;
      
      const result = await paymentService.getAllPayments({
        page, limit, offset, status
      });
      
      return paginatedResponse(res, result.payments, result.pagination);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = paymentController;
