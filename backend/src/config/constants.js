module.exports = {
  // Booking statuses
  BOOKING_STATUS: {
    LOCKED: 'LOCKED',
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    CONFIRMED: 'CONFIRMED',
    RESCHEDULED: 'RESCHEDULED',
    EXPIRED: 'EXPIRED'
  },

  // Payment statuses
  PAYMENT_STATUS: {
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED'
  },

  // Discount types
  DISCOUNT_TYPE: {
    PERCENTAGE: 'PERCENTAGE',
    NOMINAL: 'NOMINAL'
  },

  // Day types
  DAY_TYPE: {
    WEEKDAY: 'WEEKDAY',
    WEEKEND: 'WEEKEND'
  },

  // Roles
  ROLES: {
    USER: 'USER',
    ADMIN: 'ADMIN'
  },

  // Permissions
  PERMISSIONS: {
    // Booking
    BOOKING_CREATE: 'booking:create',
    BOOKING_READ: 'booking:read',
    BOOKING_READ_ALL: 'booking:read:all',
    BOOKING_UPDATE: 'booking:update',
    BOOKING_CANCEL: 'booking:cancel',
    BOOKING_RESCHEDULE: 'booking:reschedule',

    // Payment
    PAYMENT_READ: 'payment:read',
    PAYMENT_READ_ALL: 'payment:read:all',

    // Membership
    MEMBERSHIP_CREATE: 'membership:create',
    MEMBERSHIP_READ: 'membership:read',
    MEMBERSHIP_UPDATE: 'membership:update',

    // Promo
    PROMO_CREATE: 'promo:create',
    PROMO_READ: 'promo:read',
    PROMO_UPDATE: 'promo:update',
    PROMO_DELETE: 'promo:delete',

    // Admin
    ADMIN_DASHBOARD: 'admin:dashboard',
    ADMIN_USERS: 'admin:users',
    ADMIN_FIELDS: 'admin:fields',
    ADMIN_BRANCHES: 'admin:branches',
    ADMIN_SLOTS: 'admin:slots',
    ADMIN_PRICING: 'admin:pricing'
  },

  // Timing
  SLOT_LOCK_TIMEOUT_MINUTES: parseInt(process.env.SLOT_LOCK_TIMEOUT_MINUTES) || 10,
  RESCHEDULE_DEADLINE_HOURS: parseInt(process.env.RESCHEDULE_DEADLINE_HOURS) || 2,

  // Payment
  DP_PERCENTAGE: 0.5 // 50%
};
