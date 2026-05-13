import {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import type {
  Booking,
  CreateBookingRequest,
  SlotAvailability,
  FieldAvailability,
} from '../types';
import { bookingService, getErrorMessage } from '../services';

interface SelectedSlot {
  field: FieldAvailability;
  slot: SlotAvailability;
  date: string;
  branchId: string;
}

interface BookingContextType {
  selectedSlot: SelectedSlot | null;
  currentBooking: Booking | null;
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  selectSlot: (slot: SelectedSlot | null) => void;
  createBooking: (data: CreateBookingRequest) => Promise<Booking>;
  cancelBooking: (bookingId: string) => Promise<void>;
  fetchBookings: () => Promise<void>;
  fetchBookingDetail: (bookingId: string) => Promise<Booking>;
  clearError: () => void;
  clearCurrentBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

interface BookingProviderProps {
  children: ReactNode;
}

export function BookingProvider({ children }: BookingProviderProps) {
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectSlot = useCallback((slot: SelectedSlot | null) => {
    setSelectedSlot(slot);
    setError(null);
  }, []);

  const createBooking = useCallback(async (data: CreateBookingRequest): Promise<Booking> => {
    setIsLoading(true);
    setError(null);

    try {
      const booking = await bookingService.createBooking(data);
      setCurrentBooking(booking);
      setSelectedSlot(null);
      return booking;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelBooking = useCallback(async (bookingId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await bookingService.cancelBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      if (currentBooking?.id === bookingId) {
        setCurrentBooking(null);
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [currentBooking]);

  const fetchBookings = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await bookingService.getBookings();
      setBookings(data);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBookingDetail = useCallback(async (bookingId: string): Promise<Booking> => {
    setIsLoading(true);
    setError(null);

    try {
      const booking = await bookingService.getBookingDetail(bookingId);
      setCurrentBooking(booking);
      return booking;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearCurrentBooking = useCallback(() => {
    setCurrentBooking(null);
  }, []);

  const value: BookingContextType = {
    selectedSlot,
    currentBooking,
    bookings,
    isLoading,
    error,
    selectSlot,
    createBooking,
    cancelBooking,
    fetchBookings,
    fetchBookingDetail,
    clearError,
    clearCurrentBooking,
  };

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBooking(): BookingContextType {
  const context = useContext(BookingContext);

  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }

  return context;
}
