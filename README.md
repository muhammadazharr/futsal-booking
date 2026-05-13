# Futsal Booking System

A comprehensive Realtime Futsal Booking System designed for managing field availability, bookings, memberships, and payments.

## Project Structure

This project is organized as a monorepo containing both the backend and frontend:

- `backend/`: Node.js Express API with PostgreSQL.
- `frontend/`: React + TypeScript + Vite frontend application.

## Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens) & Bcrypt
- **Realtime:** SSE (Server-Sent Events) for live availability updates

### Frontend
- **Framework:** React 19 (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS 4.0
- **Icons:** Lucide React
- **Routing:** React Router 7

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd futsal-booking
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   - Create a `.env` file in the `backend` directory based on `.env.example`.
   - Setup your PostgreSQL database and update the credentials in `.env`.
   - Run migrations and seed data:
     ```bash
     npm run db:migrate
     npm run db:seed
     ```
   - Start the backend in development mode:
     ```bash
     npm run dev
     ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```
   - Start the frontend development server:
     ```bash
     npm run dev
     ```

## Key Features

- **Realtime Availability:** Field slots update in realtime using SSE.
- **Booking Management:** Users can book slots, view history, and receive confirmations.
- **Admin Dashboard:** Manage branches, fields, pricing, and user bookings.
- **Membership System:** Support for member-only pricing and discounts.
- **Payment Integration:** Ready for payment gateway integration (Midtrans/Stripe).
- **Responsive Design:** Fully optimized for mobile and desktop views.

## License

This project is licensed under the ISC License.
