import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooking } from '../contexts';
import { paymentService, getErrorMessage } from '../services';
import { BookingCard, LoadingSpinner, ErrorMessage } from '../components';

export function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const {
    currentBooking,
    fetchBookingDetail,
    cancelBooking,
    isLoading,
    error,
    clearError,
  } = useBooking();

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetail(bookingId);
    }
  }, [bookingId, fetchBookingDetail]);

  const handleCancel = async () => {
    if (!currentBooking) return;

    const confirmed = window.confirm(
      'Apakah Anda yakin ingin membatalkan booking ini?'
    );
    if (!confirmed) return;

    try {
      await cancelBooking(currentBooking.id);
      navigate('/bookings');
    } catch {
      // Error handled by context
    }
  };

  const handlePay = async () => {
    if (!currentBooking) return;

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const result = await paymentService.initiatePayment(currentBooking.id);

      // Redirect to payment gateway
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      }
    } catch (err) {
      setPaymentError(getErrorMessage(err));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading && !currentBooking) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorMessage message={error} onDismiss={clearError} />
        <button
          onClick={() => navigate('/bookings')}
          className="btn-secondary mt-4"
        >
          Kembali ke Daftar Booking
        </button>
      </div>
    );
  }

  if (!currentBooking) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-500">Booking tidak ditemukan.</p>
        <button
          onClick={() => navigate('/bookings')}
          className="btn-primary mt-4"
        >
          Kembali ke Daftar Booking
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detail Booking</h1>
          <p className="text-gray-500 mt-1">ID: {currentBooking.id}</p>
        </div>
        <button
          onClick={() => navigate('/bookings')}
          className="text-gray-500 hover:text-gray-700"
        >
          &larr; Kembali
        </button>
      </div>

      {paymentError && (
        <ErrorMessage
          message={paymentError}
          onDismiss={() => setPaymentError(null)}
        />
      )}

      {/* Booking Card */}
      <BookingCard
        booking={currentBooking}
        onCancel={handleCancel}
        onPay={handlePay}
        showActions={!isProcessingPayment}
      />

      {isProcessingPayment && (
        <div className="card flex items-center justify-center gap-3 py-6">
          <LoadingSpinner />
          <span className="text-gray-600">Memproses pembayaran...</span>
        </div>
      )}

      {/* Additional Info */}
      {currentBooking.status === 'CONFIRMED' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">
            <strong>Booking Dikonfirmasi!</strong> Silakan datang tepat waktu
            sesuai jadwal yang telah dibooking.
          </p>
        </div>
      )}

      {currentBooking.status === 'CANCELLED' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            <strong>Booking Dibatalkan.</strong> Anda dapat membuat booking baru
            untuk slot yang tersedia.
          </p>
        </div>
      )}
    </div>
  );
}
