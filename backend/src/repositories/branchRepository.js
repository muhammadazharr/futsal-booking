const { pool } = require('../config/database');

const branchRepository = {
  async findAll(activeOnly = true) {
    let query = `SELECT * FROM branches`;
    if (activeOnly) {
      query += ` WHERE is_active = TRUE`;
    }
    query += ` ORDER BY name`;
    const result = await pool.query(query);
    return result.rows;
  },

  async findById(branchId) {
    const result = await pool.query(
      `SELECT * FROM branches WHERE branch_id = $1`,
      [branchId]
    );
    return result.rows[0] || null;
  },

  async create({ name, address }) {
    const result = await pool.query(
      `INSERT INTO branches (name, address) VALUES ($1, $2) RETURNING *`,
      [name, address]
    );
    return result.rows[0];
  },

  async update(branchId, { name, address, isActive }) {
    const result = await pool.query(
      `UPDATE branches 
       SET name = COALESCE($2, name),
           address = COALESCE($3, address),
           is_active = COALESCE($4, is_active)
       WHERE branch_id = $1
       RETURNING *`,
      [branchId, name, address, isActive]
    );
    return result.rows[0];
  },

  async delete(branchId) {
    await pool.query(
      `UPDATE branches SET is_active = FALSE WHERE branch_id = $1`,
      [branchId]
    );
  }
};

module.exports = branchRepository;
