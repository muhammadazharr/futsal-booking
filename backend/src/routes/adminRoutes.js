const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const bookingController = require('../controllers/bookingController');
const paymentController = require('../controllers/paymentController');
const promoController = require('../controllers/promoController');
const { authenticate, requireRole, requirePermission } = require('../middlewares/auth');
const { validate, validators, body } = require('../middlewares/validate');
const { ROLES, PERMISSIONS, DISCOUNT_TYPE, DAY_TYPE } = require('../config/constants');

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole(ROLES.ADMIN));

// ============ DASHBOARD ============
router.get('/dashboard', 
  requirePermission(PERMISSIONS.ADMIN_DASHBOARD),
  adminController.getDashboard
);

// ============ BRANCHES ============
router.get('/branches', 
  requirePermission(PERMISSIONS.ADMIN_BRANCHES),
  adminController.getBranches
);

router.get('/branches/:branchId', 
  requirePermission(PERMISSIONS.ADMIN_BRANCHES),
  validate([validators.uuid('branchId')]),
  adminController.getBranchById
);

router.post('/branches', 
  requirePermission(PERMISSIONS.ADMIN_BRANCHES),
  validate([
    validators.requiredString('name', 2, 100),
    validators.optionalString('address', 500)
  ]),
  adminController.createBranch
);

router.put('/branches/:branchId', 
  requirePermission(PERMISSIONS.ADMIN_BRANCHES),
  validate([validators.uuid('branchId')]),
  adminController.updateBranch
);

router.delete('/branches/:branchId', 
  requirePermission(PERMISSIONS.ADMIN_BRANCHES),
  validate([validators.uuid('branchId')]),
  adminController.deleteBranch
);

// ============ FIELDS ============
router.get('/fields', 
  requirePermission(PERMISSIONS.ADMIN_FIELDS),
  adminController.getFields
);

router.get('/fields/:fieldId', 
  requirePermission(PERMISSIONS.ADMIN_FIELDS),
  validate([validators.uuid('fieldId')]),
  adminController.getFieldById
);

router.post('/fields', 
  requirePermission(PERMISSIONS.ADMIN_FIELDS),
  validate([
    validators.uuid('branchId', 'body'),
    validators.requiredString('name', 1, 50)
  ]),
  adminController.createField
);

router.put('/fields/:fieldId', 
  requirePermission(PERMISSIONS.ADMIN_FIELDS),
  validate([validators.uuid('fieldId')]),
  adminController.updateField
);

router.delete('/fields/:fieldId', 
  requirePermission(PERMISSIONS.ADMIN_FIELDS),
  validate([validators.uuid('fieldId')]),
  adminController.deleteField
);

// ============ TIME SLOTS ============
router.get('/slots', 
  requirePermission(PERMISSIONS.ADMIN_SLOTS),
  adminController.getSlots
);

router.get('/slots/:slotId', 
  requirePermission(PERMISSIONS.ADMIN_SLOTS),
  validate([validators.uuid('slotId')]),
  adminController.getSlotById
);

router.post('/slots', 
  requirePermission(PERMISSIONS.ADMIN_SLOTS),
  validate([
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
      .withMessage('Invalid start time format (HH:MM or HH:MM:SS)'),
    body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
      .withMessage('Invalid end time format (HH:MM or HH:MM:SS)'),
    validators.boolean('isDay')
  ]),
  adminController.createSlot
);

router.put('/slots/:slotId', 
  requirePermission(PERMISSIONS.ADMIN_SLOTS),
  validate([validators.uuid('slotId')]),
  adminController.updateSlot
);

router.delete('/slots/:slotId', 
  requirePermission(PERMISSIONS.ADMIN_SLOTS),
  validate([validators.uuid('slotId')]),
  adminController.deleteSlot
);

// ============ PRICING ============
router.get('/pricing', 
  requirePermission(PERMISSIONS.ADMIN_PRICING),
  adminController.getPricing
);

router.get('/pricing/:pricingId', 
  requirePermission(PERMISSIONS.ADMIN_PRICING),
  validate([validators.uuid('pricingId')]),
  adminController.getPricingById
);

router.post('/pricing', 
  requirePermission(PERMISSIONS.ADMIN_PRICING),
  validate([
    validators.uuid('fieldId', 'body'),
    validators.uuid('slotId', 'body'),
    validators.enum('dayType', Object.values(DAY_TYPE)),
    validators.numeric('price', true, 0)
  ]),
  adminController.upsertPricing
);

router.delete('/pricing/:pricingId', 
  requirePermission(PERMISSIONS.ADMIN_PRICING),
  validate([validators.uuid('pricingId')]),
  adminController.deletePricing
);

// ============ USERS ============
router.get('/users', 
  requirePermission(PERMISSIONS.ADMIN_USERS),
  adminController.getUsers
);

router.get('/users/:userId', 
  requirePermission(PERMISSIONS.ADMIN_USERS),
  validate([validators.uuid('userId')]),
  adminController.getUserById
);

router.post('/users/:userId/roles', 
  requirePermission(PERMISSIONS.ADMIN_USERS),
  validate([
    validators.uuid('userId'),
    body('roleId').isInt().withMessage('Role ID must be an integer')
  ]),
  adminController.assignUserRole
);

router.delete('/users/:userId/roles/:roleId', 
  requirePermission(PERMISSIONS.ADMIN_USERS),
  validate([validators.uuid('userId')]),
  adminController.removeUserRole
);

// ============ ROLES & PERMISSIONS ============
router.get('/roles', 
  requirePermission(PERMISSIONS.ADMIN_USERS),
  adminController.getRoles
);

router.get('/permissions', 
  requirePermission(PERMISSIONS.ADMIN_USERS),
  adminController.getPermissions
);

// ============ BOOKINGS (Admin View) ============
router.get('/bookings', 
  requirePermission(PERMISSIONS.BOOKING_READ_ALL),
  bookingController.getAllBookings
);

// ============ PAYMENTS (Admin View) ============
router.get('/payments', 
  requirePermission(PERMISSIONS.PAYMENT_READ_ALL),
  paymentController.getAllPayments
);

// ============ PROMOS ============
router.get('/promos', 
  requirePermission(PERMISSIONS.PROMO_READ),
  promoController.getAllPromos
);

router.get('/promos/:promoId', 
  requirePermission(PERMISSIONS.PROMO_READ),
  validate([validators.uuid('promoId')]),
  promoController.getPromoById
);

router.get('/promos/:promoId/stats', 
  requirePermission(PERMISSIONS.PROMO_READ),
  validate([validators.uuid('promoId')]),
  promoController.getPromoStats
);

router.post('/promos', 
  requirePermission(PERMISSIONS.PROMO_CREATE),
  validate([
    validators.requiredString('code', 2, 50),
    validators.enum('discountType', Object.values(DISCOUNT_TYPE)),
    validators.numeric('discountValue', true, 0),
    validators.date('startDate'),
    validators.date('endDate')
  ]),
  promoController.createPromo
);

router.put('/promos/:promoId', 
  requirePermission(PERMISSIONS.PROMO_UPDATE),
  validate([validators.uuid('promoId')]),
  promoController.updatePromo
);

router.delete('/promos/:promoId', 
  requirePermission(PERMISSIONS.PROMO_DELETE),
  validate([validators.uuid('promoId')]),
  promoController.deletePromo
);

// ============ SSE DEBUG ============
router.get('/sse/clients', 
  requirePermission(PERMISSIONS.ADMIN_DASHBOARD),
  adminController.getSseClients
);

module.exports = router;
