const { pool } = require('../config/database');

const userRepository = {
  async findById(userId) {
    const result = await pool.query(
      `SELECT user_id, name, phone, email, created_at FROM users WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  async findByPhone(phone) {
    const result = await pool.query(
      `SELECT * FROM users WHERE phone = $1`,
      [phone]
    );
    return result.rows[0] || null;
  },

  async findByEmail(email) {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  },

  async create({ name, phone, email, passwordHash }) {
    const result = await pool.query(
      `INSERT INTO users (name, phone, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, name, phone, email, created_at`,
      [name, phone, email, passwordHash]
    );
    return result.rows[0];
  },

  async update(userId, { name, email }) {
    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($2, name), email = COALESCE($3, email)
       WHERE user_id = $1
       RETURNING user_id, name, phone, email, created_at`,
      [userId, name, email]
    );
    return result.rows[0];
  },

  async updatePassword(userId, passwordHash) {
    await pool.query(
      `UPDATE users SET password_hash = $2 WHERE user_id = $1`,
      [userId, passwordHash]
    );
  },

  async findWithRoles(userId) {
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.phone,
        u.password_hash,
        COALESCE(
          json_agg(DISTINCT r.role_name) FILTER (WHERE r.role_name IS NOT NULL),
          '[]'
        ) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      WHERE u.user_id = $1
      GROUP BY u.user_id
    `, [userId]);
    return result.rows[0] || null;
  },

  async findByPhoneWithRoles(phone) {
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.phone,
        u.password_hash,
        COALESCE(
          json_agg(DISTINCT r.role_name) FILTER (WHERE r.role_name IS NOT NULL),
          '[]'
        ) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      WHERE u.phone = $1
      GROUP BY u.user_id
    `, [phone]);
    return result.rows[0] || null;
  },

  async assignRole(userId, roleId, client = pool) {
    await client.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId]
    );
  },

  async removeRole(userId, roleId) {
    await pool.query(
      `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`,
      [userId, roleId]
    );
  },

  async findAll({ limit, offset }) {
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.phone,
        u.created_at,
        COALESCE(
          json_agg(DISTINCT r.role_name) FILTER (WHERE r.role_name IS NOT NULL),
          '[]'
        ) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      GROUP BY u.user_id
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows;
  },

  async count() {
    const result = await pool.query(`SELECT COUNT(*) as count FROM users`);
    return parseInt(result.rows[0].count);
  }
};

module.exports = userRepository;
