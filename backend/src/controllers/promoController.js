const promoService = require('../services/promoService');
const { successResponse, createdResponse } = require('../utils/response');

const promoController = {
  /**
   * GET /promos
   * Get all active promos
   */
  async getActivePromos(req, res, next) {
    try {
      const result = await promoService.getActivePromos();
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /promos/validate
   * Validate a promo code
   */
  async validatePromoCode(req, res, next) {
    try {
      const { code } = req.body;
      const result = await promoService.validatePromoCode(code, req.user.userId);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /admin/promos
   * Get all promos (admin)
   */
  async getAllPromos(req, res, next) {
    try {
      const result = await promoService.getAllPromos();
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /admin/promos/:promoId
   * Get promo details (admin)
   */
  async getPromoById(req, res, next) {
    try {
      const { promoId } = req.params;
      const result = await promoService.getPromoById(promoId);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /admin/promos
   * Create new promo (admin)
   */
  async createPromo(req, res, next) {
    try {
      const result = await promoService.createPromo(req.body);
      return createdResponse(res, result, 'Promo created');
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /admin/promos/:promoId
   * Update promo (admin)
   */
  async updatePromo(req, res, next) {
    try {
      const { promoId } = req.params;
      const result = await promoService.updatePromo(promoId, req.body);
      return successResponse(res, result, 'Promo updated');
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /admin/promos/:promoId
   * Delete promo (admin)
   */
  async deletePromo(req, res, next) {
    try {
      const { promoId } = req.params;
      const result = await promoService.deletePromo(promoId);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /admin/promos/:promoId/stats
   * Get promo usage stats (admin)
   */
  async getPromoStats(req, res, next) {
    try {
      const { promoId } = req.params;
      const result = await promoService.getPromoStats(promoId);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = promoController;
