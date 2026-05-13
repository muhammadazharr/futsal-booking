/**
 * Database Migration Script
 * Run: npm run db:migrate
 */
require('dotenv').config();
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

const migrate = async () => {
  console.log('Starting database migration...');
  
  try {
    // Additional tables not in the base schema
    const additionalSchema = `
      -- User Roles junction table (for RBAC)
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        role_id INT REFERENCES roles(role_id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, role_id)
      );

      -- Refresh tokens table
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        revoked BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Index for faster token lookup
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

      -- Index for booking lookups
      CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
      CREATE INDEX IF NOT EXISTS idx_bookings_field_date ON bookings(field_id, booking_date);

      -- Index for payments
      CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
      CREATE INDEX IF NOT EXISTS idx_payments_gateway_ref ON payments(gateway_ref);

      -- Index for user memberships
      CREATE INDEX IF NOT EXISTS idx_user_memberships_user ON user_memberships(user_id);
      
      -- Index for promo usages
      CREATE INDEX IF NOT EXISTS idx_promo_usages_user ON promo_usages(user_id);
    `;

    await pool.query(additionalSchema);
    console.log('Additional tables and indexes created successfully');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

migrate();
