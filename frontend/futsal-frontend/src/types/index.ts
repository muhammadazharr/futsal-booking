// User & Auth Types
export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  roles: Role[];
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  name: string;
  email?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Branch & Field Types
export interface Branch {
  id: string;
  name: string;
  address: string;
  phone?: string;
  fields: Field[];
}

export interface Field {
  id: string;
  branchId: string;
  name: string;
  type: string; // e.g., 'vinyl', 'rumput sintetis'
  description?: string;
}

// Slot & Availability Types
export interface TimeSlot {
  id: string;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
}

export interface SlotAvailability {
  slotId: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  basePrice: number;
  finalPrice: number;
  membershipDiscount?: number;
  status?: 'AVAILABLE' | 'LOCKED' | 'BOOKED';
}

export interface FieldAvailability {
  fieldId: string;
  fieldName: string;
  fieldType: string;
  slots: SlotAvailability[];
}

export interface AvailabilityResponse {
  branchId: string;
  branchName: string;
  date: string;
  fields: FieldAvailability[];
}

// Booking Types
export type BookingStatus = 
  | 'LOCKED' 
  | 'PENDING_PAYMENT' 
  | 'CONFIRMED' 
  | 'CANCELLED' 
  | 'EXPIRED' 
  | 'RESCHEDULED'
  | 'COMPLETED';

export interface Booking {
  id: string;
  userId: string;
  branchId: string;
  branchName: string;
  fieldId: string;
  fieldName: string;
  slotId: string;
  startTime: string;
  endTime: string;
  bookingDate: string;
  status: BookingStatus;
  basePrice: number;
  membershipDiscount: number;
  promoDiscount: number;
  finalPrice: number;
  dpAmount: number;
  promoCode?: string;
  lockExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  branchId: string;
  fieldId: string;
  slotId: string;
  bookingDate: string; // YYYY-MM-DD
  promoCode?: string;
}

export interface RescheduleRequest {
  newSlotId: string;
  newBookingDate: string;
}

// Payment Types
export type PaymentStatus = 
  | 'PENDING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'REFUNDED';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod?: string;
  paymentUrl?: string;
  paidAt?: string;
  createdAt: string;
}

export interface InitiatePaymentResponse {
  paymentId: string;
  paymentUrl: string;
  amount: number;
}

// Membership Types
export interface MembershipType {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  discountPercent: number;
  benefits: string[];
}

export interface UserMembership {
  id: string;
  membershipTypeId: string;
  membershipName: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// Promo Types
export interface Promo {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
}

export interface ValidatePromoRequest {
  code: string;
  bookingAmount: number;
}

export interface ValidatePromoResponse {
  valid: boolean;
  discountAmount: number;
  message?: string;
}

// SSE Event Types
export interface SSEAvailabilityEvent {
  type: 'SLOT_LOCKED' | 'SLOT_RELEASED' | 'BOOKING_CONFIRMED';
  fieldId: string;
  slotId: string;
  bookingDate: string;
}

export interface SSEBookingEvent {
  type: 'STATUS_CHANGED';
  bookingId: string;
  newStatus: BookingStatus;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}
