/**
 * Cron job to expire locked bookings
 * Run this periodically (e.g., every minute)
 * 
 * Can be invoked via:
 * - Cron: * * * * * node src/jobs/expireBookings.js
 * - Or integrated with node-cron in the main app
 */
require('dotenv').config();
const bookingService = require('../services/bookingService');
const membershipService = require('../services/membershipService');
const { pool } = require('../config/database');

const runJobs = async () => {
  console.log(`[${new Date().toISOString()}] Running scheduled jobs...`);
  
  try {
    // 1. Expire locked bookings
    const expiredBookings = await bookingService.expireLockedBookings();
    if (expiredBookings > 0) {
      console.log(`Expired ${expiredBookings} locked bookings`);
    }

    // 2. Deactivate expired memberships
    const expiredMemberships = await membershipService.deactivateExpiredMemberships();
    if (expiredMemberships > 0) {
      console.log(`Deactivated ${expiredMemberships} expired memberships`);
    }

    // 3. Clean up old refresh tokens
    await pool.query(
      `DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE`
    );

    console.log('Jobs completed successfully');
  } catch (error) {
    console.error('Job failed:', error);
  } finally {
    await pool.end();
  }
};

// Run if called directly
if (require.main === module) {
  runJobs();
}

module.exports = { runJobs };
