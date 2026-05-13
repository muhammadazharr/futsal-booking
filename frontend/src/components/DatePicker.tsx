import { getNextDays, formatDateISO, isToday } from '../utils/helpers';
import { cn } from '../utils/helpers';

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  daysToShow?: number;
}

export function DatePicker({
  selectedDate,
  onDateChange,
  daysToShow = 7,
}: DatePickerProps) {
  const dates = getNextDays(daysToShow);

  const formatDayName = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date);
  };

  const formatDayNumber = (date: Date): string => {
    return date.getDate().toString();
  };

  const formatMonthYear = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">{formatMonthYear(dates[0])}</p>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {dates.map((date) => {
          const dateStr = formatDateISO(date);
          const isSelected = dateStr === selectedDate;
          const isTodayDate = isToday(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => onDateChange(dateStr)}
              className={cn(
                'flex flex-col items-center min-w-[60px] py-3 px-4 rounded-lg transition-colors',
                isSelected
                  ? 'bg-green-600 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              )}
            >
              <span className="text-xs uppercase">{formatDayName(date)}</span>
              <span className="text-lg font-semibold">{formatDayNumber(date)}</span>
              {isTodayDate && (
                <span
                  className={cn(
                    'text-xs',
                    isSelected ? 'text-green-100' : 'text-green-600'
                  )}
                >
                  Hari ini
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
