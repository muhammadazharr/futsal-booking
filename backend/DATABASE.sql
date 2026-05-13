-- =============================================
-- DATABASE SCHEMA: FUTSAL REALTIME BOOKING SYSTEM
-- PostgreSQL
-- =============================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================
-- ENUM TYPES
-- ======================
CREATE TYPE booking_status AS ENUM (
  'LOCKED',
  'PENDING_PAYMENT',
  'CONFIRMED',
  'RESCHEDULED',
  'EXPIRED'
);

CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'PAID',
  'FAILED'
);

CREATE TYPE discount_type AS ENUM (
  'PERCENTAGE',
  'NOMINAL'
);

CREATE TYPE day_type AS ENUM (
  'WEEKDAY',
  'WEEKEND'
);

-- ======================
-- USERS & AUTH
-- ======================
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100),
  password_hash TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE permissions (
  permission_id SERIAL PRIMARY KEY,
  permission_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE role_permissions (
  role_id INT REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_id INT REFERENCES permissions(permission_id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ======================
-- BRANCH & FIELD
-- ======================
CREATE TABLE branches (
  branch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE fields (
  field_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(branch_id),
  name VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ======================
-- TIME SLOT & PRICING
-- ======================
CREATE TABLE time_slots (
  slot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_day BOOLEAN NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE slot_pricing (
  pricing_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id UUID NOT NULL REFERENCES fields(field_id),
  slot_id UUID NOT NULL REFERENCES time_slots(slot_id),
  day_type day_type NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  UNIQUE (field_id, slot_id, day_type)
);

-- ======================
-- MEMBERSHIP
-- ======================
CREATE TABLE memberships (
  membership_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  discount_type discount_type NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  duration_days INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE user_memberships (
  user_membership_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  membership_id UUID NOT NULL REFERENCES memberships(membership_id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL
);

CREATE UNIQUE INDEX uq_active_membership
ON user_memberships(user_id)
WHERE is_active = TRUE;

-- ======================
-- PROMO
-- ======================
CREATE TABLE promos (
  promo_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE,
  discount_type discount_type NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE promo_usages (
  promo_id UUID REFERENCES promos(promo_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (promo_id, user_id)
);

-- ======================
-- BOOKINGS
-- ======================
CREATE TABLE bookings (
  booking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id),
  branch_id UUID NOT NULL REFERENCES branches(branch_id),
  field_id UUID NOT NULL REFERENCES fields(field_id),
  slot_id UUID NOT NULL REFERENCES time_slots(slot_id),
  booking_date DATE NOT NULL,
  status booking_status NOT NULL,
  base_price NUMERIC(12,2) NOT NULL,
  membership_discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  promo_discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  final_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_prevent_double_booking
ON bookings(field_id, slot_id, booking_date)
WHERE status IN ('LOCKED', 'PENDING_PAYMENT', 'CONFIRMED');

-- ======================
-- PAYMENTS
-- ======================
CREATE TABLE payments (
  payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(booking_id),
  amount NUMERIC(12,2) NOT NULL,
  status payment_status NOT NULL,
  gateway_ref VARCHAR(100),
  paid_at TIMESTAMP
);

CREATE TABLE membership_payments (
  membership_payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_membership_id UUID NOT NULL REFERENCES user_memberships(user_membership_id),
  amount NUMERIC(12,2) NOT NULL,
  status payment_status NOT NULL,
  paid_at TIMESTAMP
);

-- ======================
-- RESCHEDULE LOG
-- ======================
CREATE TABLE booking_reschedule_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(booking_id),
  old_date DATE NOT NULL,
  old_slot_id UUID NOT NULL,
  new_date DATE NOT NULL,
  new_slot_id UUID NOT NULL,
  rescheduled_by VARCHAR(20) NOT NULL,
  rescheduled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
