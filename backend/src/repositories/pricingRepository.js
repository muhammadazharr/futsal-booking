const { pool } = require('../config/database');

const pricingRepository = {
  async findAll(fieldId = null) {
    let query = `
      SELECT 
        sp.*,
        f.name as field_name,
        ts.start_time,
        ts.end_time,
        ts.is_day
      FROM slot_pricing sp
      JOIN fields f ON sp.field_id = f.field_id
      JOIN time_slots ts ON sp.slot_id = ts.slot_id
      WHERE f.is_active = TRUE AND ts.is_active = TRUE
    `;
    const params = [];

    if (fieldId) {
      query += ` AND sp.field_id = $1`;
      params.push(fieldId);
    }

    query += ` ORDER BY f.name, ts.start_time, sp.day_type`;
    const result = await pool.query(query, params);
    return result.rows;
  },

  async findByFieldSlotDay(fieldId, slotId, dayType) {
    const result = await pool.query(
      `SELECT * FROM slot_pricing 
       WHERE field_id = $1 AND slot_id = $2 AND day_type = $3`,
      [fieldId, slotId, dayType]
    );
    return result.rows[0] || null;
  },

  async findById(pricingId) {
    const result = await pool.query(
      `SELECT 
        sp.*,
        f.name as field_name,
        ts.start_time,
        ts.end_time,
        ts.is_day
       FROM slot_pricing sp
       JOIN fields f ON sp.field_id = f.field_id
       JOIN time_slots ts ON sp.slot_id = ts.slot_id
       WHERE sp.pricing_id = $1`,
      [pricingId]
    );
    return result.rows[0] || null;
  },

  async create({ fieldId, slotId, dayType, price }) {
    const result = await pool.query(
      `INSERT INTO slot_pricing (field_id, slot_id, day_type, price)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [fieldId, slotId, dayType, price]
    );
    return result.rows[0];
  },

  async update(pricingId, { price }) {
    const result = await pool.query(
      `UPDATE slot_pricing SET price = $2 WHERE pricing_id = $1 RETURNING *`,
      [pricingId, price]
    );
    return result.rows[0];
  },

  async upsert({ fieldId, slotId, dayType, price }) {
    const result = await pool.query(
      `INSERT INTO slot_pricing (field_id, slot_id, day_type, price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (field_id, slot_id, day_type)
       DO UPDATE SET price = $4
       RETURNING *`,
      [fieldId, slotId, dayType, price]
    );
    return result.rows[0];
  },

  async delete(pricingId) {
    await pool.query(`DELETE FROM slot_pricing WHERE pricing_id = $1`, [pricingId]);
  }
};

module.exports = pricingRepository;
