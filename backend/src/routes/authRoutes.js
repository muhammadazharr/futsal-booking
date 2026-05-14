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

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registrasi user baru
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, password]
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User berhasil terdaftar
 *       400:
 *         description: Validasi gagal
 */
router.post('/register', validate(registerValidation), authController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password]
 *             properties:
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login berhasil
 *       401:
 *         description: Phone atau password salah
 */
router.post('/login', validate(loginValidation), authController.login);
/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token berhasil diperbarui
 */
router.post('/refresh', validate(refreshValidation), authController.refreshToken);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout dari sesi saat ini
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout berhasil
 */
router.post('/logout', authController.logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Mendapatkan profil user yang sedang login
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data profil berhasil diambil
 */
router.get('/me', authenticate, authController.getProfile);
router.get('/userinfo', authenticate, authController.userInfo);

module.exports = router;
