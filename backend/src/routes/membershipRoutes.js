const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const { authenticate, requirePermission, requireRole } = require('../middlewares/auth');
const { validate, validators, body } = require('../middlewares/validate');
const { PERMISSIONS, ROLES, DISCOUNT_TYPE } = require('../config/constants');

// Validation schemas
const createMembershipValidation = [
  validators.requiredString('name', 2, 50),
  validators.enum('discountType', Object.values(DISCOUNT_TYPE)),
  validators.numeric('discountValue', true, 0),
  body('durationDays')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 day')
];

// Public routes
router.get('/', membershipController.getMembershipTypes);
router.get('/:membershipId', 
  validate([validators.uuid('membershipId')]),
  membershipController.getMembershipTypeById
);

// Protected routes
router.use(authenticate);

// User membership routes
router.get('/my/active', membershipController.getMyMembership);
router.get('/my/history', membershipController.getMyMembershipHistory);
router.get('/my/payments', membershipController.getMyMembershipPayments);
router.post(
  '/:membershipId/purchase',
  validate([validators.uuid('membershipId')]),
  membershipController.purchaseMembership
);

// Admin routes
router.post(
  '/',
  requireRole(ROLES.ADMIN),
  requirePermission(PERMISSIONS.MEMBERSHIP_CREATE),
  validate(createMembershipValidation),
  membershipController.createMembershipType
);

router.put(
  '/:membershipId',
  requireRole(ROLES.ADMIN),
  requirePermission(PERMISSIONS.MEMBERSHIP_UPDATE),
  validate([validators.uuid('membershipId')]),
  membershipController.updateMembershipType
);

module.exports = router;
