import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBooking } from '../contexts';
import { BookingCard, LoadingSpinner, ErrorMessage } from '../components';

export function BookingsPage() {
  const { bookings, fetchBookings, isLoading, error, clearError } = useBooking();

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  if (isLoading && bookings.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Saya</h1>
          <p className="text-gray-500 mt-1">
            Daftar semua booking yang telah Anda buat
          </p>
        </div>
        <Link to="/availability" className="btn-primary">
          Booking Baru
        </Link>
      </div>

      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="card text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500 mb-4">Anda belum memiliki booking.</p>
          <Link to="/availability" className="btn-primary">
            Booking Sekarang
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <Link key={booking.id} to={`/booking/${booking.id}`}>
              <BookingCard booking={booking} showActions={false} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
