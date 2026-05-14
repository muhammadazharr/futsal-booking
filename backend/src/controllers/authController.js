const authService = require('../services/authService');
const { successResponse, createdResponse } = require('../utils/response');

const authController = {
  /**
   * POST /auth/register
   */
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return createdResponse(res, result, 'Registration successful');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/login
   */
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/refresh
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      return successResponse(res, result, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/logout
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      return successResponse(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/logout-all
   */
  async logoutAll(req, res, next) {
    try {
      await authService.logoutAll(req.user.userId);
      return successResponse(res, null, 'Logged out from all devices');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      await authService.changePassword(req.user.userId, req.body);
      return successResponse(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/me
   */
  async getProfile(req, res, next) {
    try {
      return successResponse(res, {
        userId: req.user.userId,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        roles: req.user.roles,
        permissions: req.user.permissions
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/.well-known/openid-configuration
   * OpenID Connect Discovery
   */
  async openidConfiguration(req, res, next) {
    try {
      const config = authService.getOpenIDConfiguration();
      return res.json(config);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/userinfo
   * OpenID Connect UserInfo endpoint
   */
  async userInfo(req, res, next) {
    try {
      const userInfo = await authService.getUserInfo(req.user.userId);
      return res.json(userInfo);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
