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

/**
 * @openapi
 * /api/bookings/branches:
 *   get:
 *     summary: Mendapatkan daftar cabang futsal
 *     tags: [Booking]
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar cabang
 */
router.get('/branches', bookingController.getBranches);

/**
 * @openapi
 * /api/bookings/availability/{branchId}:
 *   get:
 *     summary: Cek ketersediaan lapangan berdasarkan cabang dan tanggal
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Berhasil mengambil data ketersediaan
 */
router.get(
  '/availability/:branchId',
  validate(availabilityValidation),
  optionalAuth,
  bookingController.getAvailability
);

// Protected routes
router.use(authenticate);

/**
 * @openapi
 * /api/bookings:
 *   post:
 *     summary: Membuat pesanan (booking) lapangan baru
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [branchId, fieldId, slotId, bookingDate]
 *             properties:
 *               branchId: { type: string, format: uuid }
 *               fieldId: { type: string, format: uuid }
 *               slotId: { type: string, format: uuid }
 *               bookingDate: { type: string, format: date }
 *               promoCode: { type: string }
 *     responses:
 *       201:
 *         description: Booking berhasil dibuat
 */
router.post(
  '/',
  requirePermission(PERMISSIONS.BOOKING_CREATE),
  validate(createBookingValidation),
  bookingController.createBooking
);

/**
 * @openapi
 * /api/bookings:
 *   get:
 *     summary: Mendapatkan daftar booking user saat ini
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar booking
 */
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
