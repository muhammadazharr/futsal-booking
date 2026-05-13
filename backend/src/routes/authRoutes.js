const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { validate, validators, body } = require('../middlewares/validate');

// Validation schemas
const registerValidation = [
  validators.requiredString('name', 2, 100),
  validators.phone('phone'),
  validators.email('email', false),
  validators.password('password')
];

const loginValidation = [
  validators.phone('phone'),
  body('password').notEmpty().withMessage('Password is required')
];

const refreshValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  validators.password('newPassword')
];

// Public routes
router.post('/register', validate(registerValidation), authController.register);
router.post('/login', validate(loginValidation), authController.login);
router.post('/refresh', validate(refreshValidation), authController.refreshToken);

// OpenID Connect endpoints
router.get('/.well-known/openid-configuration', authController.openidConfiguration);

// Protected routes
router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/change-password', authenticate, validate(changePasswordValidation), authController.changePassword);
router.get('/me', authenticate, authController.getProfile);
router.get('/userinfo', authenticate, authController.userInfo);

module.exports = router;
