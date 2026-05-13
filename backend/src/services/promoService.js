const promoRepository = require('../repositories/promoRepository');
const membershipRepository = require('../repositories/membershipRepository');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/errors');

const promoService = {
  /**
   * Get all active promos
   */
  async getActivePromos() {
    return await promoRepository.findAll(true);
  },

  /**
   * Get all promos (admin)
   */
  async getAllPromos() {
    return await promoRepository.findAll(false);
  },

  /**
   * Get promo by ID
   */
  async getPromoById(promoId) {
    const promo = await promoRepository.findById(promoId);
    if (!promo) {
      throw new NotFoundError('Promo not found');
    }
    return promo;
  },

  /**
   * Validate promo code for user
   */
  async validatePromoCode(code, userId) {
    const promo = await promoRepository.findValidByCode(code);
    if (!promo) {
      throw new BadRequestError('Invalid or expired promo code');
    }

    // Check if user already used this promo
    const hasUsed = await promoRepository.hasUserUsedPromo(userId, promo.promo_id);
    if (hasUsed) {
      throw new BadRequestError('Promo code already used');
    }

    return {
      promoId: promo.promo_id,
      code: promo.code,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      startDate: promo.start_date,
      endDate: promo.end_date,
      isValid: true
    };
  },

  /**
   * Create new promo (admin)
   */
  async createPromo({ code, discountType, discountValue, startDate, endDate }) {
    // Check if code already exists
    const existing = await promoRepository.findByCode(code);
    if (existing) {
      throw new ConflictError('Promo code already exists');
    }

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestError('Start date must be before end date');
    }

    return await promoRepository.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      startDate,
      endDate
    });
  },

  /**
   * Update promo (admin)
   */
  async updatePromo(promoId, data) {
    const existing = await promoRepository.findById(promoId);
    if (!existing) {
      throw new NotFoundError('Promo not found');
    }

    // If changing code, check for duplicates
    if (data.code && data.code !== existing.code) {
      const duplicate = await promoRepository.findByCode(data.code);
      if (duplicate) {
        throw new ConflictError('Promo code already exists');
      }
      data.code = data.code.toUpperCase();
    }

    return await promoRepository.update(promoId, data);
  },

  /**
   * Delete promo (soft delete)
   */
  async deletePromo(promoId) {
    const existing = await promoRepository.findById(promoId);
    if (!existing) {
      throw new NotFoundError('Promo not found');
    }

    await promoRepository.delete(promoId);
    return { message: 'Promo deleted' };
  },

  /**
   * Get promo usage statistics (admin)
   */
  async getPromoStats(promoId) {
    const promo = await promoRepository.findById(promoId);
    if (!promo) {
      throw new NotFoundError('Promo not found');
    }

    const [usages, count] = await Promise.all([
      promoRepository.findUsagesByPromoId(promoId),
      promoRepository.countUsages(promoId)
    ]);

    return {
      promo,
      totalUsages: count,
      usages
    };
  }
};

module.exports = promoService;
