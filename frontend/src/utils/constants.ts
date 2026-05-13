// API Configuration
export const API_BASE_URL = '/api';

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
} as const;

// Booking Status Labels
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  LOCKED: 'Terkunci',
  PENDING_PAYMENT: 'Menunggu Pembayaran',
  CONFIRMED: 'Dikonfirmasi',
  CANCELLED: 'Dibatalkan',
  EXPIRED: 'Kedaluwarsa',
  RESCHEDULED: 'Dijadwalkan Ulang',
  COMPLETED: 'Selesai',
};

// Booking Status Colors (Tailwind classes)
export const BOOKING_STATUS_COLORS: Record<string, string> = {
  LOCKED: 'bg-yellow-100 text-yellow-800',
  PENDING_PAYMENT: 'bg-orange-100 text-orange-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  RESCHEDULED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
};

// Lock timeout in minutes
export const SLOT_LOCK_TIMEOUT_MINUTES = 10;

// Date format
export const DATE_FORMAT = 'YYYY-MM-DD';
