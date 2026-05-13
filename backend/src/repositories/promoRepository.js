const { pool } = require('../config/database');

const promoRepository = {
  async findAll(activeOnly = true) {
    let query = `SELECT * FROM promos`;
    if (activeOnly) {
      query += ` WHERE is_active = TRUE AND end_date >= CURRENT_DATE`;
    }
    query += ` ORDER BY end_date`;
    const result = await pool.query(query);
    return result.rows;
  },

  async findById(promoId) {
    const result = await pool.query(
      `SELECT * FROM promos WHERE promo_id = $1`,
      [promoId]
    );
    return result.rows[0] || null;
  },

  async findByCode(code) {
    const result = await pool.query(
      `SELECT * FROM promos WHERE code = $1`,
      [code]
    );
    return result.rows[0] || null;
  },

  async findValidByCode(code) {
    const result = await pool.query(`
      SELECT * FROM promos 
      WHERE code = $1 
        AND is_active = TRUE
        AND start_date <= CURRENT_DATE
        AND end_date >= CURRENT_DATE
    `, [code]);
    return result.rows[0] || null;
  },

  async create(data) {
    const result = await pool.query(`
      INSERT INTO promos (code, discount_type, discount_value, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [data.code, data.discountType, data.discountValue, data.startDate, data.endDate]);
    return result.rows[0];
  },

  async update(promoId, data) {
    const result = await pool.query(`
      UPDATE promos 
      SET code = COALESCE($2, code),
          discount_type = COALESCE($3, discount_type),
          discount_value = COALESCE($4, discount_value),
          start_date = COALESCE($5, start_date),
          end_date = COALESCE($6, end_date),
          is_active = COALESCE($7, is_active)
      WHERE promo_id = $1
      RETURNING *
    `, [promoId, data.code, data.discountType, data.discountValue, data.startDate, data.endDate, data.isActive]);
    return result.rows[0];
  },

  async delete(promoId) {
    await pool.query(`UPDATE promos SET is_active = FALSE WHERE promo_id = $1`, [promoId]);
  },

  // Promo usage
  async hasUserUsedPromo(userId, promoId) {
    const result = await pool.query(
      `SELECT 1 FROM promo_usages WHERE user_id = $1 AND promo_id = $2`,
      [userId, promoId]
    );
    return result.rows.length > 0;
  },

  async recordUsage(userId, promoId, client = pool) {
    await client.query(
      `INSERT INTO promo_usages (user_id, promo_id) VALUES ($1, $2)`,
      [userId, promoId]
    );
  },

  async findUsagesByPromoId(promoId) {
    const result = await pool.query(`
      SELECT 
        pu.*,
        u.name as user_name,
        u.phone as user_phone
      FROM promo_usages pu
      JOIN users u ON pu.user_id = u.user_id
      WHERE pu.promo_id = $1
      ORDER BY pu.used_at DESC
    `, [promoId]);
    return result.rows;
  },

  async countUsages(promoId) {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM promo_usages WHERE promo_id = $1`,
      [promoId]
    );
    return parseInt(result.rows[0].count);
  }
};

module.exports = promoRepository;
