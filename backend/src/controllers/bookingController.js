const bookingService = require('../services/bookingService');
const { successResponse, createdResponse, paginatedResponse } = require('../utils/response');
const { parsePagination } = require('../utils/helpers');

const bookingController = {
  /**
   * POST /bookings
   * Create new booking with slot locking
   */
  async createBooking(req, res, next) {
    try {
      const result = await bookingService.createBooking(req.user.userId, req.body);
      return createdResponse(res, result, 'Booking created successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /bookings
   * Get user's bookings
   */
  async getUserBookings(req, res, next) {
    try {
      const { page, limit, offset } = parsePagination(req.query);
      const { status } = req.query;

      const result = await bookingService.getUserBookings(req.user.userId, {
        page, limit, offset, status
      });

      return paginatedResponse(res, result.bookings, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /bookings/:bookingId
   * Get booking details
   */
  async getBookingById(req, res, next) {
    try {
      const { bookingId } = req.params;
      const isAdmin = req.user.roles.includes('ADMIN');

      const result = await bookingService.getBookingById(
        bookingId,
        req.user.userId,
        isAdmin
      );

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /bookings/:bookingId
   * Cancel booking (only LOCKED status)
   */
  async cancelBooking(req, res, next) {
    try {
      const { bookingId } = req.params;
      const isAdmin = req.user.roles.includes('ADMIN');

      const result = await bookingService.cancelBooking(
        bookingId,
        req.user.userId,
        isAdmin
      );

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /bookings/:bookingId/reschedule
   * Reschedule booking
   */
  async rescheduleBooking(req, res, next) {
    try {
      const { bookingId } = req.params;
      const { newSlotId, newBookingDate } = req.body;
      const isAdmin = req.user.roles.includes('ADMIN');

      const result = await bookingService.rescheduleBooking(
        bookingId,
        req.user.userId,
        { newSlotId, newBookingDate },
        isAdmin
      );

      return successResponse(res, result, 'Booking rescheduled successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /bookings/availability/:branchId
   * Get slot availability for a branch
   */
  async getAvailability(req, res, next) {
    try {
      const { branchId } = req.params;
      const { date } = req.query;

      const result = await bookingService.getAvailability(branchId, date);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /admin/bookings
   * Get all bookings (admin)
   */
  async getAllBookings(req, res, next) {
    try {
      const { page, limit, offset } = parsePagination(req.query);
      const { branchId, status, startDate, endDate } = req.query;

      const result = await bookingService.getAllBookings({
        page, limit, offset, branchId, status, startDate, endDate
      });

      return paginatedResponse(res, result.bookings, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /bookings/branches
   * Get list of active branches (public)
   */
  async getBranches(req, res, next) {
    try {
      const result = await bookingService.getBranches();
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = bookingController;
