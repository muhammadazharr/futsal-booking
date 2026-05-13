const membershipService = require('../services/membershipService');
const { successResponse, createdResponse } = require('../utils/response');

const membershipController = {
  /**
   * GET /memberships
   * Get all available membership types
   */
  async getMembershipTypes(req, res, next) {
    try {
      const result = await membershipService.getMembershipTypes();
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /memberships/:membershipId
   * Get membership type details
   */
  async getMembershipTypeById(req, res, next) {
    try {
      const { membershipId } = req.params;
      const result = await membershipService.getMembershipTypeById(membershipId);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /memberships
   * Create new membership type (admin)
   */
  async createMembershipType(req, res, next) {
    try {
      const result = await membershipService.createMembershipType(req.body);
      return createdResponse(res, result, 'Membership type created');
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /memberships/:membershipId
   * Update membership type (admin)
   */
  async updateMembershipType(req, res, next) {
    try {
      const { membershipId } = req.params;
      const result = await membershipService.updateMembershipType(membershipId, req.body);
      return successResponse(res, result, 'Membership type updated');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /memberships/my
   * Get user's active membership
   */
  async getMyMembership(req, res, next) {
    try {
      const result = await membershipService.getUserActiveMembership(req.user.userId);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /memberships/my/history
   * Get user's membership history
   */
  async getMyMembershipHistory(req, res, next) {
    try {
      const result = await membershipService.getUserMembershipHistory(req.user.userId);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /memberships/:membershipId/purchase
   * Purchase a membership
   */
  async purchaseMembership(req, res, next) {
    try {
      const { membershipId } = req.params;
      const result = await membershipService.purchaseMembership(req.user.userId, membershipId);
      return createdResponse(res, result, 'Membership purchase initiated');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /memberships/my/payments
   * Get user's membership payment history
   */
  async getMyMembershipPayments(req, res, next) {
    try {
      const result = await membershipService.getUserMembershipPayments(req.user.userId);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = membershipController;
