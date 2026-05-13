const { pool } = require('../config/database');

const fieldRepository = {
  async findAll(branchId = null, activeOnly = true) {
    let query = `
      SELECT f.*, b.name as branch_name 
      FROM fields f
      JOIN branches b ON f.branch_id = b.branch_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (branchId) {
      query += ` AND f.branch_id = $${paramIndex}`;
      params.push(branchId);
      paramIndex++;
    }

    if (activeOnly) {
      query += ` AND f.is_active = TRUE AND b.is_active = TRUE`;
    }

    query += ` ORDER BY b.name, f.name`;
    const result = await pool.query(query, params);
    return result.rows;
  },

  async findById(fieldId) {
    const result = await pool.query(
      `SELECT f.*, b.name as branch_name 
       FROM fields f
       JOIN branches b ON f.branch_id = b.branch_id
       WHERE f.field_id = $1`,
      [fieldId]
    );
    return result.rows[0] || null;
  },

  async findByBranchId(branchId, activeOnly = true) {
    let query = `SELECT * FROM fields WHERE branch_id = $1`;
    if (activeOnly) {
      query += ` AND is_active = TRUE`;
    }
    query += ` ORDER BY name`;
    const result = await pool.query(query, [branchId]);
    return result.rows;
  },

  async create({ branchId, name }) {
    const result = await pool.query(
      `INSERT INTO fields (branch_id, name) VALUES ($1, $2) RETURNING *`,
      [branchId, name]
    );
    return result.rows[0];
  },

  async update(fieldId, { name, isActive }) {
    const result = await pool.query(
      `UPDATE fields 
       SET name = COALESCE($2, name),
           is_active = COALESCE($3, is_active)
       WHERE field_id = $1
       RETURNING *`,
      [fieldId, name, isActive]
    );
    return result.rows[0];
  },

  async delete(fieldId) {
    await pool.query(
      `UPDATE fields SET is_active = FALSE WHERE field_id = $1`,
      [fieldId]
    );
  }
};

module.exports = fieldRepository;
