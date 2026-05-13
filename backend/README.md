# Futsal Booking API
This document is the authoritative source of truth for backend API behavior.
Any generated code must strictly follow the rules defined here.

REST API untuk sistem booking futsal realtime dengan Express.js dan PostgreSQL.

## Tech Stack

- **Runtime**: Node.js (LTS)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: OAuth 2.0 / OpenID Connect (self-hosted), JWT
- **Authorization**: RBAC dengan granular permissions
- **Realtime**: Server-Sent Events (SSE)

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

# Edit .env dengan konfigurasi database Anda
```

### Database Setup

```bash
# Jalankan DATABASE.sql untuk membuat schema dasar
psql -U postgres -d futsal_booking -f DATABASE.sql

# Jalankan migration untuk tabel tambahan
npm run db:migrate

# Seed data awal (roles, permissions, admin, sample data)
npm run db:seed
```

### Run Server

```bash
# Development
npm run dev

# Production
npm start
```

Server berjalan di `http://localhost:3000`

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register user baru | - |
| POST | `/login` | Login dengan phone & password | - |
| POST | `/refresh` | Refresh access token | - |
| POST | `/logout` | Logout (revoke refresh token) | - |
| POST | `/logout-all` | Logout dari semua device | ✓ |
| POST | `/change-password` | Ganti password | ✓ |
| GET | `/me` | Get profile user | ✓ |
| GET | `/.well-known/openid-configuration` | OpenID Connect Discovery | - |
| GET | `/userinfo` | OpenID Connect UserInfo | ✓ |

### Bookings (`/api/bookings`)

| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| GET | `/availability/:branchId?date=YYYY-MM-DD` | Cek ketersediaan slot | - | - |
| POST | `/` | Buat booking baru | ✓ | booking:create |
| GET | `/` | List booking user | ✓ | booking:read |
| GET | `/:bookingId` | Detail booking | ✓ | booking:read |
| DELETE | `/:bookingId` | Cancel booking (LOCKED only) | ✓ | booking:cancel |
| POST | `/:bookingId/reschedule` | Reschedule booking | ✓ | booking:reschedule |

### Payments (`/api/payments`)

| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| POST | `/:bookingId/initiate` | Initiate payment | ✓ | payment:read |
| GET | `/` | List payment history | ✓ | payment:read |
| GET | `/:paymentId` | Detail payment | ✓ | payment:read |
| POST | `/webhook` | Payment gateway webhook | - | - |

### Memberships (`/api/memberships`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List membership types | - |
| GET | `/:membershipId` | Detail membership type | - |
| GET | `/my/active` | Membership aktif user | ✓ |
| GET | `/my/history` | Histori membership | ✓ |
| GET | `/my/payments` | Histori pembayaran membership | ✓ |
| POST | `/:membershipId/purchase` | Beli membership | ✓ |

### Promos (`/api/promos`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List promo aktif | - |
| POST | `/validate` | Validasi kode promo | ✓ |

### Realtime (`/api/realtime`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/availability?branchId=xxx` | SSE stream untuk update ketersediaan |

### Admin (`/api/admin`)

Semua endpoint admin memerlukan role ADMIN.

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
| GET | `/bookings` | List semua booking | booking:read:all |
| GET | `/payments` | List semua payment | payment:read:all |
| GET/POST/PUT/DELETE | `/promos/*` | Manage promos | promo:* |

## Booking Flow

```
1. User cek availability
   GET /api/bookings/availability/:branchId?date=2024-01-20

2. User pilih slot & create booking
   POST /api/bookings
   Body: { branchId, fieldId, slotId, bookingDate, promoCode? }
   → Status: LOCKED (10 menit timeout)

3. User initiate payment
   POST /api/payments/:bookingId/initiate
   → Status: PENDING_PAYMENT
   → Return: paymentUrl

4. User bayar di payment gateway
   → Gateway kirim webhook

5. Webhook handler update status
   POST /api/payments/webhook
   → Status: CONFIRMED

6. (Optional) Reschedule
   POST /api/bookings/:bookingId/reschedule
   Body: { newSlotId, newBookingDate }
   → Max 1x, 2 jam sebelum main
   → Status: RESCHEDULED
```

## Pricing Calculation

```
Urutan:
1. Base Price (dari slot_pricing berdasarkan field, slot, day_type)
2. Membership Discount (jika ada membership aktif)
3. Promo Discount (jika pakai kode promo)

Final Price = Base - Membership Discount - Promo Discount
DP Amount = 50% × Final Price
```

## Realtime Updates (SSE)

Frontend dapat subscribe ke SSE untuk mendapatkan update realtime:

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

Setelah menjalankan `npm run db:seed`:

- **Admin**: `08001234567` / `Admin123!`

## Security Features

- JWT access + refresh token
- RBAC dengan permissions dari database
- Webhook signature verification
- Password hashing dengan bcrypt
- Helmet security headers
- CORS configuration
- Input validation dengan express-validator
- SQL injection prevention (parameterized queries)

## Business Rules

1. **Double Booking Prevention**: Database constraint pada `(field_id, slot_id, booking_date)` untuk status LOCKED, PENDING_PAYMENT, CONFIRMED

2. **Slot Locking**: Slot di-lock saat user klik booking, timeout 10 menit

3. **Reschedule**: Maksimal 1x, minimal 2 jam sebelum jadwal main, harga tidak berubah

4. **Promo**: Hanya bisa dipakai 1x per user

5. **Membership**: 1 membership aktif per user, discount applied sebelum promo

6. **Payment**: DP 50%, non-refundable
