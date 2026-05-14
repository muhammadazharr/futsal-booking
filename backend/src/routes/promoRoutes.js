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

/**
 * @openapi
 * /api/promos:
 *   get:
 *     summary: Mendapatkan daftar promo yang sedang aktif
 *     tags: [Promo]
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar promo
 */
router.get('/', promoController.getActivePromos);

// Protected routes
router.use(authenticate);

/**
 * @openapi
 * /api/promos/validate:
 *   post:
 *     summary: Validasi kode promo
 *     tags: [Promo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kode promo valid
 *       400:
 *         description: Kode promo tidak valid atau kadaluarsa
 */
router.post(
  '/validate',
  validate(validatePromoValidation),
  promoController.validatePromoCode
);

module.exports = router;
