const { pool } = require('../config/database');
const { BOOKING_STATUS } = require('../config/constants');

const bookingRepository = {
  /**
   * Find booking by ID with full details
   */
  async findById(bookingId, client = pool) {
    const result = await client.query(`
      SELECT 
        b.*,
        u.name as user_name,
        u.phone as user_phone,
        br.name as branch_name,
        f.name as field_name,
        ts.start_time,
        ts.end_time,
        ts.is_day
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN branches br ON b.branch_id = br.branch_id
      JOIN fields f ON b.field_id = f.field_id
      JOIN time_slots ts ON b.slot_id = ts.slot_id
      WHERE b.booking_id = $1
    `, [bookingId]);
    return result.rows[0] || null;
  },

  /**
   * Find bookings by user
   */
  async findByUserId(userId, { limit, offset, status }) {
    let query = `
      SELECT 
        b.*,
        br.name as branch_name,
        f.name as field_name,
        ts.start_time,
        ts.end_time
      FROM bookings b
      JOIN branches br ON b.branch_id = br.branch_id
      JOIN fields f ON b.field_id = f.field_id
      JOIN time_slots ts ON b.slot_id = ts.slot_id
      WHERE b.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY b.booking_date DESC, ts.start_time DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  },

  /**
   * Count user bookings
   */
  async countByUserId(userId, status = null) {
    let query = `SELECT COUNT(*) as count FROM bookings WHERE user_id = $1`;
    const params = [userId];

    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  },

  /**
   * Check if slot is available (not booked/locked/pending)
   * Uses FOR UPDATE to lock the row during transaction
   */
  async isSlotAvailable(fieldId, slotId, bookingDate, client = pool) {
    const result = await client.query(`
      SELECT booking_id FROM bookings
      WHERE field_id = $1 
        AND slot_id = $2 
        AND booking_date = $3
        AND status IN ('LOCKED', 'PENDING_PAYMENT', 'CONFIRMED')
      FOR UPDATE
    `, [fieldId, slotId, bookingDate]);
    return result.rows.length === 0;
  },

  /**
   * Create booking with LOCKED status
   */
  async create(data, client = pool) {
    const result = await client.query(`
      INSERT INTO bookings (
        user_id, branch_id, field_id, slot_id, booking_date,
        status, base_price, membership_discount, promo_discount, final_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      data.userId,
      data.branchId,
      data.fieldId,
      data.slotId,
      data.bookingDate,
      data.status || BOOKING_STATUS.LOCKED,
      data.basePrice,
      data.membershipDiscount || 0,
      data.promoDiscount || 0,
      data.finalPrice
    ]);
    return result.rows[0];
  },

  /**
   * Update booking status
   */
  async updateStatus(bookingId, status, client = pool) {
    const result = await client.query(
      `UPDATE bookings SET status = $2 WHERE booking_id = $1 RETURNING *`,
      [bookingId, status]
    );
    return result.rows[0];
  },

  /**
   * Update booking for reschedule
   */
  async reschedule(bookingId, { slotId, bookingDate }, client = pool) {
    const result = await client.query(`
      UPDATE bookings 
      SET slot_id = $2, booking_date = $3, status = 'RESCHEDULED'
      WHERE booking_id = $1
      RETURNING *
    `, [bookingId, slotId, bookingDate]);
    return result.rows[0];
  },

  /**
   * Get availability for a date range
   */
  async getAvailability(branchId, startDate, endDate) {
    const result = await pool.query(`
      SELECT 
        b.field_id,
        b.slot_id,
        b.booking_date,
        b.status
      FROM bookings b
      JOIN fields f ON b.field_id = f.field_id
      WHERE f.branch_id = $1
        AND b.booking_date BETWEEN $2 AND $3
        AND b.status IN ('LOCKED', 'PENDING_PAYMENT', 'CONFIRMED', 'RESCHEDULED')
      ORDER BY b.booking_date, b.slot_id
    `, [branchId, startDate, endDate]);
    return result.rows;
  },

  /**
   * Get all booked slots for a specific date and branch
   */
  async getBookedSlots(branchId, bookingDate) {
    const result = await pool.query(`
      SELECT 
        b.field_id,
        b.slot_id,
        b.status
      FROM bookings b
      JOIN fields f ON b.field_id = f.field_id
      WHERE f.branch_id = $1
        AND b.booking_date = $2
        AND b.status IN ('LOCKED', 'PENDING_PAYMENT', 'CONFIRMED', 'RESCHEDULED')
    `, [branchId, bookingDate]);
    return result.rows;
  },

  /**
   * Find expired locks (older than timeout)
   */
  async findExpiredLocks(timeoutMinutes) {
    const result = await pool.query(`
      SELECT * FROM bookings
      WHERE status = 'LOCKED'
        AND created_at < NOW() - INTERVAL '${timeoutMinutes} minutes'
    `);
    return result.rows;
  },

  /**
   * Expire old locked bookings
   */
  async expireLocks(timeoutMinutes) {
    const result = await pool.query(`
      UPDATE bookings
      SET status = 'EXPIRED'
      WHERE status = 'LOCKED'
        AND created_at < NOW() - INTERVAL '${timeoutMinutes} minutes'
      RETURNING *
    `);
    return result.rows;
  },

  /**
   * Get reschedule count for a booking
   */
  async getRescheduleCount(bookingId) {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM booking_reschedule_logs WHERE booking_id = $1`,
      [bookingId]
    );
    return parseInt(result.rows[0].count);
  },

  /**
   * Create reschedule log
   */
  async createRescheduleLog(data, client = pool) {
    const result = await client.query(`
      INSERT INTO booking_reschedule_logs (
        booking_id, old_date, old_slot_id, new_date, new_slot_id, rescheduled_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      data.bookingId,
      data.oldDate,
      data.oldSlotId,
      data.newDate,
      data.newSlotId,
      data.rescheduledBy
    ]);
    return result.rows[0];
  },

  /**
   * Find all bookings (admin)
   */
  async findAll({ limit, offset, branchId, status, startDate, endDate }) {
    let query = `
      SELECT 
        b.*,
        u.name as user_name,
        u.phone as user_phone,
        br.name as branch_name,
        f.name as field_name,
        ts.start_time,
        ts.end_time
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN branches br ON b.branch_id = br.branch_id
      JOIN fields f ON b.field_id = f.field_id
      JOIN time_slots ts ON b.slot_id = ts.slot_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (branchId) {
      query += ` AND b.branch_id = $${paramIndex}`;
      params.push(branchId);
      paramIndex++;
    }

    if (status) {
      query += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND b.booking_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND b.booking_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY b.booking_date DESC, ts.start_time DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  },

  /**
   * Count all bookings (admin)
   */
  async countAll({ branchId, status, startDate, endDate }) {
    let query = `SELECT COUNT(*) as count FROM bookings b WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (branchId) {
      query += ` AND b.branch_id = $${paramIndex}`;
      params.push(branchId);
      paramIndex++;
    }

    if (status) {
      query += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND b.booking_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND b.booking_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }
};

module.exports = bookingRepository;
