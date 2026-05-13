import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useBooking } from '../contexts';
import { bookingService, getErrorMessage } from '../services';
import api from '../services/api';
import type { AvailabilityResponse, FieldAvailability, SlotAvailability } from '../types';
import {
  DatePicker,
  SlotCard,
  LoadingSpinner,
  ErrorMessage,
} from '../components';
import { getToday, formatCurrency } from '../utils/helpers';

export function AvailabilityPage() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();
  const { selectedSlot, selectSlot } = useBooking();
  const navigate = useNavigate();

  // Fetch branches on mount and pick the first active branch
  useEffect(() => {
    api.get<{ data: { branchId: string }[] } | { branchId: string }[]>('/bookings/branches')
      .then((res) => {
        const list = 'data' in res.data && Array.isArray((res.data as { data: { branchId: string }[] }).data)
          ? (res.data as { data: { branchId: string }[] }).data
          : res.data as { branchId: string }[];
        if (list.length > 0) setBranchId(list[0].branchId);
        else setError('Tidak ada cabang yang tersedia.');
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const fetchAvailability = useCallback(async () => {
    if (!branchId) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await bookingService.getAvailability(branchId, selectedDate);
      setAvailability(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, branchId]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const handleSlotSelect = (field: FieldAvailability, slot: SlotAvailability) => {
    if (!slot.isAvailable) return;

    // Check if same slot is already selected
    if (
      selectedSlot?.field.fieldId === field.fieldId &&
      selectedSlot?.slot.slotId === slot.slotId
    ) {
      selectSlot(null);
      return;
    }

    selectSlot({
      field,
      slot,
      date: selectedDate,
      branchId: branchId!,
    });
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/availability' } } });
      return;
    }

    if (selectedSlot) {
      navigate('/booking/confirm');
    }
  };

  const isSlotSelected = (fieldId: string, slotId: string): boolean => {
    return (
      selectedSlot?.field.fieldId === fieldId &&
      selectedSlot?.slot.slotId === slotId
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ketersediaan Lapangan</h1>
        <p className="text-gray-500 mt-1">
          Pilih tanggal dan slot waktu untuk booking
        </p>
      </div>

      {/* Date Picker */}
      <div className="card">
        <DatePicker
          selectedDate={selectedDate}
          onDateChange={(date) => {
            setSelectedDate(date);
            selectSlot(null);
          }}
        />
      </div>

      {/* Error State */}
      {error && (
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Availability Grid */}
      {!isLoading && availability && (
        <div className="space-y-6">
          {availability.fields.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500">
                Tidak ada lapangan tersedia untuk tanggal ini.
              </p>
            </div>
          ) : (
            availability.fields.map((field) => (
              <div key={field.fieldId} className="card">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {field.fieldName}
                  </h2>
                  <p className="text-sm text-gray-500">{field.fieldType}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {field.slots.map((slot) => (
                    <SlotCard
                      key={slot.slotId}
                      slot={slot}
                      isSelected={isSlotSelected(field.fieldId, slot.slotId)}
                      onClick={() => handleSlotSelect(field, slot)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Selected Slot Summary & Book Button */}
      {selectedSlot && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {selectedSlot.field.fieldName}
              </p>
              <p className="text-sm text-gray-500">
                {selectedSlot.slot.startTime} - {selectedSlot.slot.endTime}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(selectedSlot.slot.finalPrice)}
              </p>
              <button onClick={handleBooking} className="btn-primary">
                {isAuthenticated ? 'Lanjut Booking' : 'Login untuk Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed bottom bar */}
      {selectedSlot && <div className="h-24" />}
    </div>
  );
}
