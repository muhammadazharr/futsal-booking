import { useState, useEffect } from 'react';
import { calculateRemainingSeconds, formatCountdown } from '../utils/helpers';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(() => calculateRemainingSeconds(expiresAt));

  useEffect(() => {
    if (seconds <= 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          onExpire?.();
          clearInterval(interval);
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onExpire, expiresAt]);

  const isUrgent = seconds < 60;

  return (
    <span
      className={`font-mono font-bold ${
        isUrgent ? 'text-red-600' : 'text-yellow-800'
      }`}
    >
      {formatCountdown(seconds)}
    </span>
  );
}
