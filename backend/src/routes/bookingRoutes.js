const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, optionalAuth, requirePermission } = require('../middlewares/auth');
const { validate, validators, body, param, query } = require('../middlewares/validate');
const { PERMISSIONS } = require('../config/constants');

// Validation schemas
const createBookingValidation = [
  validators.uuid('branchId', 'body'),
  validators.uuid('fieldId', 'body'),
  validators.uuid('slotId', 'body'),
  validators.futureDate('bookingDate'),
  body('promoCode').optional().trim().isLength({ min: 1, max: 50 })
];

const rescheduleValidation = [
  validators.uuid('bookingId'),
  validators.uuid('newSlotId', 'body'),
  validators.futureDate('newBookingDate')
];

const availabilityValidation = [
  validators.uuid('branchId'),
  query('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format')
];

// Public route - get list of active branches
router.get('/branches', bookingController.getBranches);

// Public route - get availability (no auth required but optional for pricing)
router.get(
  '/availability/:branchId',
  validate(availabilityValidation),
  optionalAuth,
  bookingController.getAvailability
);

// Protected routes
router.use(authenticate);

// Create booking
router.post(
  '/',
  requirePermission(PERMISSIONS.BOOKING_CREATE),
  validate(createBookingValidation),
  bookingController.createBooking
);

// Get user's bookings
router.get(
  '/',
  requirePermission(PERMISSIONS.BOOKING_READ),
  bookingController.getUserBookings
);

// Get booking by ID
router.get(
  '/:bookingId',
  validate([validators.uuid('bookingId')]),
  requirePermission(PERMISSIONS.BOOKING_READ),
  bookingController.getBookingById
);

// Cancel booking
router.delete(
  '/:bookingId',
  validate([validators.uuid('bookingId')]),
  requirePermission(PERMISSIONS.BOOKING_CANCEL),
  bookingController.cancelBooking
);

// Reschedule booking
router.post(
  '/:bookingId/reschedule',
  validate(rescheduleValidation),
  requirePermission(PERMISSIONS.BOOKING_RESCHEDULE),
  bookingController.rescheduleBooking
);

module.exports = router;
