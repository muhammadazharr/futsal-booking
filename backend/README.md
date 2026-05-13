# Futsal Booking API
This document is the authoritative source of truth for backend API behavior.
Any generated code must strictly follow the rules defined here.

<<<<<<< HEAD
REST API for booking system futsal realtime with Express.js dan PostgreSQL.
=======
REST API for a real-time futsal booking system built with Express.js and PostgreSQL.
>>>>>>> bd3c517 (docs: translate backend README.md to English)

## Tech Stack

- **Runtime**: Node.js (LTS)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: OAuth 2.0 / OpenID Connect (self-hosted), JWT
- **Authorization**: RBAC with granular permissions
- **Real-time**: Server-Sent Events (SSE)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database configuration
```

### Database Setup

```bash
# Run DATABASE.sql to create the base schema
psql -U postgres -d futsal_booking -f DATABASE.sql

# Run migration for additional tables
npm run db:migrate

# Seed initial data (roles, permissions, admin, sample data)
npm run db:seed
```

### Run Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs at `http://localhost:3000`

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | - |
| POST | `/login` | Login with phone & password | - |
| POST | `/refresh` | Refresh access token | - |
| POST | `/logout` | Logout (revoke refresh token) | - |
| POST | `/logout-all` | Logout from all devices | ✓ |
| POST | `/change-password` | Change password | ✓ |
| GET | `/me` | Get user profile | ✓ |
| GET | `/.well-known/openid-configuration` | OpenID Connect Discovery | - |
| GET | `/userinfo` | OpenID Connect UserInfo | ✓ |

### Bookings (`/api/bookings`)

| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| GET | `/availability/:branchId?date=YYYY-MM-DD` | Check slot availability | - | - |
| POST | `/` | Create new booking | ✓ | booking:create |
| GET | `/` | List user bookings | ✓ | booking:read |
| GET | `/:bookingId` | Booking detail | ✓ | booking:read |
| DELETE | `/:bookingId` | Cancel booking (LOCKED only) | ✓ | booking:cancel |
| POST | `/:bookingId/reschedule` | Reschedule booking | ✓ | booking:reschedule |

### Payments (`/api/payments`)

| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| POST | `/:bookingId/initiate` | Initiate payment | ✓ | payment:read |
| GET | `/` | List payment history | ✓ | payment:read |
| GET | `/:paymentId` | Payment detail | ✓ | payment:read |
| POST | `/webhook` | Payment gateway webhook | - | - |

### Memberships (`/api/memberships`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List membership types | - |
| GET | `/:membershipId` | Membership type detail | - |
| GET | `/my/active` | Active user membership | ✓ |
| GET | `/my/history` | Membership history | ✓ |
| GET | `/my/payments` | Membership payment history | ✓ |
| POST | `/:membershipId/purchase` | Purchase membership | ✓ |

### Promos (`/api/promos`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List active promos | - |
| POST | `/validate` | Validate promo code | ✓ |

### Real-time (`/api/realtime`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/availability?branchId=xxx` | SSE stream for availability updates |

### Admin (`/api/admin`)

All admin endpoints require the ADMIN role.

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/dashboard` | Dashboard stats | admin:dashboard |
| GET/POST/PUT/DELETE | `/branches/*` | Manage branches | admin:branches |
| GET/POST/PUT/DELETE | `/fields/*` | Manage fields | admin:fields |
| GET/POST/PUT/DELETE | `/slots/*` | Manage time slots | admin:slots |
| GET/POST/DELETE | `/pricing/*` | Manage pricing | admin:pricing |
| GET | `/users` | List users | admin:users |
| GET | `/users/:userId` | User detail | admin:users |
| POST | `/users/:userId/roles` | Assign role | admin:users |
| DELETE | `/users/:userId/roles/:roleId` | Remove role | admin:users |
| GET | `/bookings` | List all bookings | booking:read:all |
| GET | `/payments` | List all payments | payment:read:all |
| GET/POST/PUT/DELETE | `/promos/*` | Manage promos | promo:* |

## Booking Flow

```
1. User checks availability
   GET /api/bookings/availability/:branchId?date=2024-01-20

2. User selects slot & creates booking
   POST /api/bookings
   Body: { branchId, fieldId, slotId, bookingDate, promoCode? }
   → Status: LOCKED (10-minute timeout)

3. User initiates payment
   POST /api/payments/:bookingId/initiate
   → Status: PENDING_PAYMENT
   → Return: paymentUrl

4. User pays at the payment gateway
   → Gateway sends webhook

5. Webhook handler updates status
   POST /api/payments/webhook
   → Status: CONFIRMED

6. (Optional) Reschedule
   POST /api/bookings/:bookingId/reschedule
   Body: { newSlotId, newBookingDate }
   → Max 1x, 2 hours before playing
   → Status: RESCHEDULED
```

## Pricing Calculation

```
Order:
1. Base Price (from slot_pricing based on field, slot, day_type)
2. Membership Discount (if there is an active membership)
3. Promo Discount (if using a promo code)

Final Price = Base - Membership Discount - Promo Discount
Down Payment (DP) Amount = 50% × Final Price
```

## Real-time Updates (SSE)

Frontend can subscribe to SSE to get real-time updates:

```javascript
const eventSource = new EventSource('/api/realtime/availability?branchId=xxx');

eventSource.addEventListener('availability', (event) => {
  const data = JSON.parse(event.data);
  // data.type: SLOT_LOCKED, SLOT_RELEASED, BOOKING_CONFIRMED, etc.
  // data.fieldId, data.slotId, data.bookingDate
  // Update UI accordingly
});

eventSource.addEventListener('booking', (event) => {
  const data = JSON.parse(event.data);
  // Booking status changes
});
```

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=futsal_booking
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Payment Gateway
PAYMENT_GATEWAY_URL=https://api.payment-gateway.com
PAYMENT_GATEWAY_API_KEY=your-api-key
PAYMENT_WEBHOOK_SECRET=your-webhook-secret

# Booking Config
SLOT_LOCK_TIMEOUT_MINUTES=10
RESCHEDULE_DEADLINE_HOURS=2
```

## Project Structure

```
src/
├── config/
│   ├── database.js     # PostgreSQL connection & transaction helper
│   └── constants.js    # Enums, permissions, config values
├── controllers/        # Request handlers
├── middlewares/
│   ├── auth.js         # JWT & RBAC middleware
│   ├── errorHandler.js # Global error handler
│   └── validate.js     # Input validation
├── repositories/       # Data access layer
├── routes/             # API routes
├── services/
│   ├── authService.js
│   ├── bookingService.js
│   ├── paymentService.js
│   ├── membershipService.js
│   ├── promoService.js
│   └── sse/
│       └── sseManager.js # SSE client management
├── utils/
│   ├── errors.js       # Custom error classes
│   ├── helpers.js      # Utility functions
│   └── response.js     # Standard response format
├── database/
│   ├── migrate.js      # Additional migrations
│   └── seed.js         # Seed data
├── jobs/
│   └── expireBookings.js # Cron job for expired locks
└── index.js            # App entry point
```

## Test Credentials

After running `npm run db:seed`:

- **Admin**: `08001234567` / `Admin123!`

## Security Features

- JWT access + refresh token
- RBAC with permissions from database
- Webhook signature verification
- Password hashing with bcrypt
- Helmet security headers
- CORS configuration
- Input validation with express-validator
- SQL injection prevention (parameterized queries)

## Business Rules

1. **Double Booking Prevention**: Database constraint on `(field_id, slot_id, booking_date)` for statuses LOCKED, PENDING_PAYMENT, CONFIRMED

2. **Slot Locking**: Slot is locked when user clicks booking, 10-minute timeout

3. **Reschedule**: Maximum 1x, minimum 2 hours before playing time, price remains unchanged

4. **Promo**: Can only be used once per user

5. **Membership**: 1 active membership per user, discount applied before promo

6. **Payment**: 50% DP, non-refundable
