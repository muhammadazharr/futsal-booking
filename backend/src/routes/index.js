const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const bookingRoutes = require('./bookingRoutes');
const paymentRoutes = require('./paymentRoutes');
const membershipRoutes = require('./membershipRoutes');
const promoRoutes = require('./promoRoutes');
const adminRoutes = require('./adminRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/memberships', membershipRoutes);
router.use('/promos', promoRoutes);
router.use('/admin', adminRoutes);

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'Futsal Booking API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      bookings: '/api/bookings',
      payments: '/api/payments',
      memberships: '/api/memberships',
      promos: '/api/promos',
      admin: '/api/admin',
      realtime: '/api/realtime/availability'
    }
  });
});

module.exports = router;
