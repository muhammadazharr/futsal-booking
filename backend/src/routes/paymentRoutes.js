const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { validate, validators } = require('../middlewares/validate');
const { PERMISSIONS } = require('../config/constants');

/**
 * @openapi
 * /api/payments/webhook:
 *   post:
 *     summary: Webhook untuk menerima notifikasi pembayaran dari provider
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Webhook berhasil diproses
 */
router.post('/webhook', paymentController.handleWebhook);

// Protected routes
router.use(authenticate);

/**
 * @openapi
 * /api/payments/{bookingId}/initiate:
 *   post:
 *     summary: Inisiasi pembayaran untuk pesanan tertentu
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pembayaran berhasil diinisiasi
 */
router.post(
  '/:bookingId/initiate',
  validate([validators.uuid('bookingId')]),
  requirePermission(PERMISSIONS.PAYMENT_READ),
  paymentController.initiatePayment
);

// Get user's payment history
router.get(
  '/',
  requirePermission(PERMISSIONS.PAYMENT_READ),
  paymentController.getUserPayments
);

// Get payment details
router.get(
  '/:paymentId',
  validate([validators.uuid('paymentId')]),
  requirePermission(PERMISSIONS.PAYMENT_READ),
  paymentController.getPaymentById
);

module.exports = router;
