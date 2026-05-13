import api from './api';
import type {
  AvailabilityResponse,
  Booking,
  CreateBookingRequest,
  RescheduleRequest,
} from '../types';

const BOOKING_ENDPOINTS = {
  AVAILABILITY: (branchId: string) => `/bookings/availability/${branchId}`,
  BOOKINGS: '/bookings',
  BOOKING_DETAIL: (bookingId: string) => `/bookings/${bookingId}`,
  CANCEL: (bookingId: string) => `/bookings/${bookingId}`,
  RESCHEDULE: (bookingId: string) => `/bookings/${bookingId}/reschedule`,
};

export const bookingService = {
  /**
   * Get availability for a branch on a specific date
   */
  async getAvailability(branchId: string, date: string): Promise<AvailabilityResponse> {
    const response = await api.get<{ data: AvailabilityResponse } | AvailabilityResponse>(
      BOOKING_ENDPOINTS.AVAILABILITY(branchId),
      { params: { date } }
    );
    return 'data' in response.data && response.data.data 
      ? response.data.data 
      : response.data as AvailabilityResponse;
  },

  /**
   * Create a new booking (locks the slot)
   */
  async createBooking(data: CreateBookingRequest): Promise<Booking> {
    const response = await api.post<{ data: Booking } | Booking>(
      BOOKING_ENDPOINTS.BOOKINGS,
      data
    );
    return 'data' in response.data && response.data.data 
      ? response.data.data 
      : response.data as Booking;
  },

  /**
   * Get list of user's bookings
   */
  async getBookings(): Promise<Booking[]> {
    const response = await api.get<{ data: Booking[] } | Booking[]>(
      BOOKING_ENDPOINTS.BOOKINGS
    );
    return 'data' in response.data && response.data.data 
      ? response.data.data 
      : response.data as Booking[];
  },

  /**
   * Get booking detail
   */
  async getBookingDetail(bookingId: string): Promise<Booking> {
    const response = await api.get<{ data: Booking } | Booking>(
      BOOKING_ENDPOINTS.BOOKING_DETAIL(bookingId)
    );
    return 'data' in response.data && response.data.data 
      ? response.data.data 
      : response.data as Booking;
  },

  /**
   * Cancel a booking (only LOCKED status)
   */
  async cancelBooking(bookingId: string): Promise<void> {
    await api.delete(BOOKING_ENDPOINTS.CANCEL(bookingId));
  },

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(bookingId: string, data: RescheduleRequest): Promise<Booking> {
    const response = await api.post<{ data: Booking } | Booking>(
      BOOKING_ENDPOINTS.RESCHEDULE(bookingId),
      data
    );
    return 'data' in response.data && response.data.data 
      ? response.data.data 
      : response.data as Booking;
  },
};
