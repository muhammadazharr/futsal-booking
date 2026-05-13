const { pool } = require('../config/database');

const slotRepository = {
  async findAll(activeOnly = true) {
    let query = `SELECT * FROM time_slots`;
    if (activeOnly) {
      query += ` WHERE is_active = TRUE`;
    }
    query += ` ORDER BY start_time`;
    const result = await pool.query(query);
    return result.rows;
  },

  async findById(slotId) {
    const result = await pool.query(
      `SELECT * FROM time_slots WHERE slot_id = $1`,
      [slotId]
    );
    return result.rows[0] || null;
  },

  async create({ startTime, endTime, isDay }) {
    const result = await pool.query(
      `INSERT INTO time_slots (start_time, end_time, is_day) 
       VALUES ($1, $2, $3) RETURNING *`,
      [startTime, endTime, isDay]
    );
    return result.rows[0];
  },

  async update(slotId, { startTime, endTime, isDay, isActive }) {
    const result = await pool.query(
      `UPDATE time_slots 
       SET start_time = COALESCE($2, start_time),
           end_time = COALESCE($3, end_time),
           is_day = COALESCE($4, is_day),
           is_active = COALESCE($5, is_active)
       WHERE slot_id = $1
       RETURNING *`,
      [slotId, startTime, endTime, isDay, isActive]
    );
    return result.rows[0];
  },

  async delete(slotId) {
    await pool.query(
      `UPDATE time_slots SET is_active = FALSE WHERE slot_id = $1`,
      [slotId]
    );
  }
};

module.exports = slotRepository;
