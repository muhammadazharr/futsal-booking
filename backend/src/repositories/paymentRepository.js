const { pool } = require('../config/database');

const paymentRepository = {
  async findById(paymentId) {
    const result = await pool.query(`
      SELECT 
        p.*,
        b.booking_date,
        b.status as booking_status,
        f.name as field_name,
        ts.start_time,
        ts.end_time
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      JOIN fields f ON b.field_id = f.field_id
      JOIN time_slots ts ON b.slot_id = ts.slot_id
      WHERE p.payment_id = $1
    `, [paymentId]);
    return result.rows[0] || null;
  },

  async findByBookingId(bookingId) {
    const result = await pool.query(
      `SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC`,
      [bookingId]
    );
    return result.rows;
  },

  async findByGatewayRef(gatewayRef) {
    const result = await pool.query(
      `SELECT * FROM payments WHERE gateway_ref = $1`,
      [gatewayRef]
    );
    return result.rows[0] || null;
  },

  async create(data, client = pool) {
    const result = await client.query(`
      INSERT INTO payments (booking_id, amount, status, gateway_ref)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [data.bookingId, data.amount, data.status, data.gatewayRef]);
    return result.rows[0];
  },

  async updateStatus(paymentId, status, paidAt = null, client = pool) {
    const result = await client.query(`
      UPDATE payments 
      SET status = $2, paid_at = $3
      WHERE payment_id = $1
      RETURNING *
    `, [paymentId, status, paidAt]);
    return result.rows[0];
  },

  async updateByGatewayRef(gatewayRef, { status, paidAt }, client = pool) {
    const result = await client.query(`
      UPDATE payments 
      SET status = $2, paid_at = $3
      WHERE gateway_ref = $1
      RETURNING *
    `, [gatewayRef, status, paidAt]);
    return result.rows[0];
  },

  async findByUserId(userId, { limit, offset }) {
    const result = await pool.query(`
      SELECT 
        p.*,
        b.booking_date,
        f.name as field_name,
        ts.start_time
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      JOIN fields f ON b.field_id = f.field_id
      JOIN time_slots ts ON b.slot_id = ts.slot_id
      WHERE b.user_id = $1
      ORDER BY p.paid_at DESC NULLS LAST
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    return result.rows;
  },

  async countByUserId(userId) {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      WHERE b.user_id = $1
    `, [userId]);
    return parseInt(result.rows[0].count);
  },

  async findAll({ limit, offset, status }) {
    let query = `
      SELECT 
        p.*,
        b.booking_date,
        b.user_id,
        u.name as user_name,
        f.name as field_name
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      JOIN users u ON b.user_id = u.user_id
      JOIN fields f ON b.field_id = f.field_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY p.paid_at DESC NULLS LAST`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  },

  async countAll(status = null) {
    let query = `SELECT COUNT(*) as count FROM payments`;
    const params = [];

    if (status) {
      query += ` WHERE status = $1`;
      params.push(status);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }
};

module.exports = paymentRepository;
