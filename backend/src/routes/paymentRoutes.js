const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { validate, validators } = require('../middlewares/validate');
const { PERMISSIONS } = require('../config/constants');

// Webhook route (no auth - verified by signature)
// Note: This must use raw body parser, configured in index.js
router.post('/webhook', paymentController.handleWebhook);

// Protected routes
router.use(authenticate);

// Initiate payment
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
