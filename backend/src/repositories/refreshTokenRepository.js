const { pool } = require('../config/database');

const refreshTokenRepository = {
  async create(data, client = pool) {
    const result = await client.query(`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [data.userId, data.token, data.expiresAt]);
    return result.rows[0];
  },

  async findByToken(token) {
    const result = await pool.query(
      `SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = FALSE`,
      [token]
    );
    return result.rows[0] || null;
  },

  async revoke(token) {
    await pool.query(
      `UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1`,
      [token]
    );
  },

  async revokeAllByUserId(userId) {
    await pool.query(
      `UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`,
      [userId]
    );
  },

  async deleteExpired() {
    await pool.query(
      `DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE`
    );
  }
};

module.exports = refreshTokenRepository;
