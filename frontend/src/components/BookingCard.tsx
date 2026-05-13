import type { Booking } from '../types';
import {
  formatCurrency,
  formatDate,
  formatTimeSlot,
  cn,
} from '../utils/helpers';
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
} from '../utils/constants';
import { CountdownTimer } from './CountdownTimer';

interface BookingCardProps {
  booking: Booking;
  onCancel?: () => void;
  onPay?: () => void;
  showActions?: boolean;
}

export function BookingCard({
  booking,
  onCancel,
  onPay,
  showActions = true,
}: BookingCardProps) {
  const statusLabel = BOOKING_STATUS_LABELS[booking.status] || booking.status;
  const statusColor = BOOKING_STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-800';
  const isLocked = booking.status === 'LOCKED';
  const canCancel = isLocked;
  const canPay = isLocked || booking.status === 'PENDING_PAYMENT';

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">
            {booking.fieldName}
          </h3>
          <p className="text-gray-500">{booking.branchName}</p>
        </div>
        <span className={cn('px-3 py-1 rounded-full text-sm font-medium', statusColor)}>
          {statusLabel}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Tanggal</p>
          <p className="font-medium">{formatDate(booking.bookingDate)}</p>
        </div>
        <div>
          <p className="text-gray-500">Waktu</p>
          <p className="font-medium">
            {formatTimeSlot(booking.startTime, booking.endTime)}
          </p>
        </div>
      </div>

      {/* Pricing */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Harga Dasar</span>
          <span>{formatCurrency(booking.basePrice)}</span>
        </div>
        {booking.membershipDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Diskon Membership</span>
            <span>-{formatCurrency(booking.membershipDiscount)}</span>
          </div>
        )}
        {booking.promoDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Diskon Promo ({booking.promoCode})</span>
            <span>-{formatCurrency(booking.promoDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-lg border-t pt-2">
          <span>Total</span>
          <span className="text-green-600">{formatCurrency(booking.finalPrice)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">DP (50%)</span>
          <span>{formatCurrency(booking.dpAmount)}</span>
        </div>
      </div>

      {/* Countdown for LOCKED status */}
      {isLocked && booking.lockExpiresAt && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-yellow-800 text-sm">Slot dikunci selama:</span>
            <CountdownTimer expiresAt={booking.lockExpiresAt} onExpire={onCancel} />
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (canCancel || canPay) && (
        <div className="flex gap-3 pt-2">
          {canCancel && onCancel && (
            <button onClick={onCancel} className="btn-secondary flex-1">
              Batalkan
            </button>
          )}
          {canPay && onPay && (
            <button onClick={onPay} className="btn-primary flex-1">
              Bayar Sekarang
            </button>
          )}
        </div>
      )}
    </div>
  );
}
