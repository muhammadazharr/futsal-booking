const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');
const { authenticate, requirePermission, requireRole } = require('../middlewares/auth');
const { validate, validators, body } = require('../middlewares/validate');
const { PERMISSIONS, ROLES, DISCOUNT_TYPE } = require('../config/constants');

// Validation schemas
const createPromoValidation = [
  validators.requiredString('code', 2, 50),
  validators.enum('discountType', Object.values(DISCOUNT_TYPE)),
  validators.numeric('discountValue', true, 0),
  validators.date('startDate'),
  validators.date('endDate')
];

const validatePromoValidation = [
  body('code').trim().notEmpty().withMessage('Promo code is required')
];

// Public routes
router.get('/', promoController.getActivePromos);

// Protected routes
router.use(authenticate);

// Validate promo code
router.post(
  '/validate',
  validate(validatePromoValidation),
  promoController.validatePromoCode
);

module.exports = router;
