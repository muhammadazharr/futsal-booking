import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../contexts';
import { promoService, getErrorMessage } from '../services';
import { LoadingSpinner, ErrorMessage } from '../components';
import { formatCurrency, formatDate, formatTimeSlot } from '../utils/helpers';

export function BookingConfirmPage() {
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  const {
    selectedSlot,
    createBooking,
    isLoading,
    error,
    clearError,
  } = useBooking();
  const navigate = useNavigate();

  // Redirect if no slot selected
  if (!selectedSlot) {
    navigate('/availability');
    return null;
  }

  const { field, slot, date, branchId } = selectedSlot;
  const finalPrice = slot.finalPrice - promoDiscount;
  const dpAmount = Math.ceil(finalPrice * 0.5);

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;

    setIsValidatingPromo(true);
    setPromoError(null);

    try {
      const result = await promoService.validatePromo({
        code: promoCode.trim(),
        bookingAmount: slot.finalPrice,
      });

      if (result.valid) {
        setPromoDiscount(result.discountAmount);
      } else {
        setPromoError(result.message || 'Kode promo tidak valid');
      }
    } catch (err) {
      setPromoError(getErrorMessage(err));
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoDiscount(0);
    setPromoError(null);
  };

  const handleConfirmBooking = async () => {
    clearError();

    try {
      const booking = await createBooking({
        branchId,
        fieldId: field.fieldId,
        slotId: slot.slotId,
        bookingDate: date,
        promoCode: promoDiscount > 0 ? promoCode : undefined,
      });

      navigate(`/booking/${booking.id}`);
    } catch {
      // Error is handled by context
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Konfirmasi Booking</h1>
        <p className="text-gray-500 mt-1">
          Periksa detail booking sebelum melanjutkan
        </p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      {/* Booking Details */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Detail Booking</h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Lapangan</p>
            <p className="font-medium">{field.fieldName}</p>
            <p className="text-gray-400 text-xs">{field.fieldType}</p>
          </div>
          <div>
            <p className="text-gray-500">Tanggal</p>
            <p className="font-medium">{formatDate(date)}</p>
          </div>
          <div>
            <p className="text-gray-500">Waktu</p>
            <p className="font-medium">
              {formatTimeSlot(slot.startTime, slot.endTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Promo Code */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Kode Promo</h2>

        {promoDiscount > 0 ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
            <div>
              <p className="font-medium text-green-800">{promoCode}</p>
              <p className="text-sm text-green-600">
                Hemat {formatCurrency(promoDiscount)}
              </p>
            </div>
            <button
              onClick={handleRemovePromo}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Hapus
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Masukkan kode promo"
              className="input-field flex-1"
              disabled={isValidatingPromo}
            />
            <button
              onClick={handleValidatePromo}
              disabled={isValidatingPromo || !promoCode.trim()}
              className="btn-secondary"
            >
              {isValidatingPromo ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Terapkan'
              )}
            </button>
          </div>
        )}

        {promoError && (
          <p className="text-sm text-red-600">{promoError}</p>
        )}
      </div>

      {/* Price Summary */}
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Ringkasan Harga</h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Harga Dasar</span>
            <span>{formatCurrency(slot.basePrice)}</span>
          </div>
          {slot.membershipDiscount && slot.membershipDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Diskon Membership</span>
              <span>-{formatCurrency(slot.membershipDiscount)}</span>
            </div>
          )}
          {promoDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Diskon Promo</span>
              <span>-{formatCurrency(promoDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total</span>
            <span className="text-green-600">{formatCurrency(finalPrice)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>DP (50%)</span>
            <span>{formatCurrency(dpAmount)}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Penting:</strong> Slot akan dikunci selama 10 menit setelah
          booking. Segera lakukan pembayaran untuk mengkonfirmasi booking Anda.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/availability')}
          className="btn-secondary flex-1"
        >
          Kembali
        </button>
        <button
          onClick={handleConfirmBooking}
          disabled={isLoading}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Memproses...</span>
            </>
          ) : (
            'Konfirmasi Booking'
          )}
        </button>
      </div>
    </div>
  );
}
