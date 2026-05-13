const { pool } = require('../config/database');

const membershipRepository = {
  // Membership types
  async findAllTypes(activeOnly = true) {
    let query = `SELECT * FROM memberships`;
    if (activeOnly) {
      query += ` WHERE is_active = TRUE`;
    }
    query += ` ORDER BY name`;
    const result = await pool.query(query);
    return result.rows;
  },

  async findTypeById(membershipId) {
    const result = await pool.query(
      `SELECT * FROM memberships WHERE membership_id = $1`,
      [membershipId]
    );
    return result.rows[0] || null;
  },

  async createType(data) {
    const result = await pool.query(`
      INSERT INTO memberships (name, discount_type, discount_value, duration_days)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [data.name, data.discountType, data.discountValue, data.durationDays]);
    return result.rows[0];
  },

  async updateType(membershipId, data) {
    const result = await pool.query(`
      UPDATE memberships 
      SET name = COALESCE($2, name),
          discount_type = COALESCE($3, discount_type),
          discount_value = COALESCE($4, discount_value),
          duration_days = COALESCE($5, duration_days),
          is_active = COALESCE($6, is_active)
      WHERE membership_id = $1
      RETURNING *
    `, [membershipId, data.name, data.discountType, data.discountValue, data.durationDays, data.isActive]);
    return result.rows[0];
  },

  // User memberships
  async findActiveByUserId(userId) {
    const result = await pool.query(`
      SELECT 
        um.*,
        m.name,
        m.discount_type,
        m.discount_value
      FROM user_memberships um
      JOIN memberships m ON um.membership_id = m.membership_id
      WHERE um.user_id = $1 
        AND um.is_active = TRUE
        AND um.end_date >= CURRENT_DATE
    `, [userId]);
    return result.rows[0] || null;
  },

  async findAllByUserId(userId) {
    const result = await pool.query(`
      SELECT 
        um.*,
        m.name,
        m.discount_type,
        m.discount_value
      FROM user_memberships um
      JOIN memberships m ON um.membership_id = m.membership_id
      WHERE um.user_id = $1
      ORDER BY um.start_date DESC
    `, [userId]);
    return result.rows;
  },

  async createUserMembership(data, client = pool) {
    // Deactivate any existing active membership
    await client.query(`
      UPDATE user_memberships 
      SET is_active = FALSE
      WHERE user_id = $1 AND is_active = TRUE
    `, [data.userId]);

    const result = await client.query(`
      INSERT INTO user_memberships (user_id, membership_id, start_date, end_date, is_active)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING *
    `, [data.userId, data.membershipId, data.startDate, data.endDate]);
    return result.rows[0];
  },

  async findUserMembershipById(userMembershipId) {
    const result = await pool.query(`
      SELECT 
        um.*,
        m.name,
        m.discount_type,
        m.discount_value,
        u.name as user_name
      FROM user_memberships um
      JOIN memberships m ON um.membership_id = m.membership_id
      JOIN users u ON um.user_id = u.user_id
      WHERE um.user_membership_id = $1
    `, [userMembershipId]);
    return result.rows[0] || null;
  },

  // Membership payments
  async createPayment(data, client = pool) {
    const result = await client.query(`
      INSERT INTO membership_payments (user_membership_id, amount, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [data.userMembershipId, data.amount, data.status]);
    return result.rows[0];
  },

  async updatePaymentStatus(paymentId, status, paidAt = null, client = pool) {
    const result = await client.query(`
      UPDATE membership_payments 
      SET status = $2, paid_at = $3
      WHERE membership_payment_id = $1
      RETURNING *
    `, [paymentId, status, paidAt]);
    return result.rows[0];
  },

  async findPaymentsByUserId(userId) {
    const result = await pool.query(`
      SELECT 
        mp.*,
        m.name as membership_name
      FROM membership_payments mp
      JOIN user_memberships um ON mp.user_membership_id = um.user_membership_id
      JOIN memberships m ON um.membership_id = m.membership_id
      WHERE um.user_id = $1
      ORDER BY mp.paid_at DESC NULLS LAST
    `, [userId]);
    return result.rows;
  },

  // Check and deactivate expired memberships
  async deactivateExpired() {
    const result = await pool.query(`
      UPDATE user_memberships 
      SET is_active = FALSE
      WHERE is_active = TRUE AND end_date < CURRENT_DATE
      RETURNING *
    `);
    return result.rows;
  }
};

module.exports = membershipRepository;
