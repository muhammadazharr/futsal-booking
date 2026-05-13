import type { SlotAvailability } from '../types';
import { formatCurrency, formatTimeSlot, cn } from '../utils/helpers';

interface SlotCardProps {
  slot: SlotAvailability;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function SlotCard({
  slot,
  isSelected = false,
  onClick,
  disabled = false,
}: SlotCardProps) {
  const isAvailable = slot.isAvailable;
  const hasDiscount = slot.membershipDiscount && slot.membershipDiscount > 0;

  return (
    <button
      onClick={onClick}
      disabled={disabled || !isAvailable}
      className={cn(
        'w-full p-4 rounded-lg border-2 transition-all text-left',
        isAvailable
          ? isSelected
            ? 'border-green-600 bg-green-50'
            : 'border-gray-200 bg-white hover:border-green-400'
          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-gray-900">
            {formatTimeSlot(slot.startTime, slot.endTime)}
          </p>
          <p
            className={cn(
              'text-sm mt-1',
              isAvailable ? 'text-green-600' : 'text-red-500'
            )}
          >
            {isAvailable ? 'Tersedia' : slot.status === 'LOCKED' ? 'Dikunci' : 'Tidak Tersedia'}
          </p>
        </div>
        <div className="text-right">
          {hasDiscount ? (
            <>
              <p className="text-sm text-gray-400 line-through">
                {formatCurrency(slot.basePrice)}
              </p>
              <p className="font-semibold text-green-600">
                {formatCurrency(slot.finalPrice)}
              </p>
            </>
          ) : (
            <p className="font-semibold text-gray-900">
              {formatCurrency(slot.finalPrice)}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
