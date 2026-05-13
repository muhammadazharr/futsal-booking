const { withTransaction } = require('../config/database');
const membershipRepository = require('../repositories/membershipRepository');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/errors');
const { PAYMENT_STATUS } = require('../config/constants');

const membershipService = {
  /**
   * Get all available membership types
   */
  async getMembershipTypes() {
    return await membershipRepository.findAllTypes();
  },

  /**
   * Get membership type by ID
   */
  async getMembershipTypeById(membershipId) {
    const membership = await membershipRepository.findTypeById(membershipId);
    if (!membership) {
      throw new NotFoundError('Membership type not found');
    }
    return membership;
  },

  /**
   * Create new membership type (admin)
   */
  async createMembershipType({ name, discountType, discountValue, durationDays }) {
    return await membershipRepository.createType({
      name,
      discountType,
      discountValue,
      durationDays
    });
  },

  /**
   * Update membership type (admin)
   */
  async updateMembershipType(membershipId, data) {
    const existing = await membershipRepository.findTypeById(membershipId);
    if (!existing) {
      throw new NotFoundError('Membership type not found');
    }

    return await membershipRepository.updateType(membershipId, data);
  },

  /**
   * Get user's active membership
   */
  async getUserActiveMembership(userId) {
    return await membershipRepository.findActiveByUserId(userId);
  },

  /**
   * Get user's membership history
   */
  async getUserMembershipHistory(userId) {
    return await membershipRepository.findAllByUserId(userId);
  },

  /**
   * Purchase membership
   */
  async purchaseMembership(userId, membershipId) {
    const membershipType = await membershipRepository.findTypeById(membershipId);
    if (!membershipType || !membershipType.is_active) {
      throw new NotFoundError('Membership type not found or inactive');
    }

    // Check if user already has an active membership
    const activeMembership = await membershipRepository.findActiveByUserId(userId);
    if (activeMembership) {
      throw new ConflictError('User already has an active membership');
    }

    return await withTransaction(async (client) => {
      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + membershipType.duration_days);

      // Create user membership (not active until payment)
      const userMembership = await membershipRepository.createUserMembership({
        userId,
        membershipId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }, client);

      // Create payment record (in real implementation, integrate with payment gateway)
      const payment = await membershipRepository.createPayment({
        userMembershipId: userMembership.user_membership_id,
        amount: membershipType.discount_value, // This should be the membership price, not discount
        status: PAYMENT_STATUS.PENDING
      }, client);

      return {
        userMembershipId: userMembership.user_membership_id,
        membershipName: membershipType.name,
        startDate: userMembership.start_date,
        endDate: userMembership.end_date,
        paymentId: payment.membership_payment_id,
        amount: payment.amount,
        paymentStatus: payment.status
      };
    });
  },

  /**
   * Confirm membership payment (called by webhook or admin)
   */
  async confirmMembershipPayment(paymentId) {
    return await withTransaction(async (client) => {
      const payment = await membershipRepository.updatePaymentStatus(
        paymentId, 
        PAYMENT_STATUS.PAID, 
        new Date(),
        client
      );

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      return { message: 'Membership activated successfully' };
    });
  },

  /**
   * Get user's membership payment history
   */
  async getUserMembershipPayments(userId) {
    return await membershipRepository.findPaymentsByUserId(userId);
  },

  /**
   * Deactivate expired memberships (cron job)
   */
  async deactivateExpiredMemberships() {
    const expired = await membershipRepository.deactivateExpired();
    return expired.length;
  }
};

module.exports = membershipService;
