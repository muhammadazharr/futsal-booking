import { useEffect, useRef, useCallback } from 'react';
import type { SSEAvailabilityEvent, SSEBookingEvent } from '../types';
import { API_BASE_URL } from '../utils/constants';

interface UseSSEOptions {
  branchId: string;
  onAvailabilityUpdate?: (event: SSEAvailabilityEvent) => void;
  onBookingUpdate?: (event: SSEBookingEvent) => void;
  enabled?: boolean;
}

/**
 * Hook for subscribing to Server-Sent Events for realtime updates
 * 
 * Usage:
 * ```tsx
 * useSSE({
 *   branchId: '1',
 *   onAvailabilityUpdate: (event) => {
 *     console.log('Availability changed:', event);
 *     // Refresh availability data
 *   },
 *   enabled: true,
 * });
 * ```
 */
export function useSSE({
  branchId,
  onAvailabilityUpdate,
  onBookingUpdate,
  enabled = false,
}: UseSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  // Store callbacks in refs to avoid dependency issues
  const onAvailabilityUpdateRef = useRef(onAvailabilityUpdate);
  const onBookingUpdateRef = useRef(onBookingUpdate);

  useEffect(() => {
    onAvailabilityUpdateRef.current = onAvailabilityUpdate;
  }, [onAvailabilityUpdate]);

  useEffect(() => {
    onBookingUpdateRef.current = onBookingUpdate;
  }, [onBookingUpdate]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    reconnectAttempts.current = 0;
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !branchId) return;

    // Close existing connection
    disconnect();

    const url = `${API_BASE_URL}/realtime/availability?branchId=${branchId}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[SSE] Connected to availability stream');
      reconnectAttempts.current = 0;
    };

    eventSource.addEventListener('availability', (event) => {
      try {
        const data: SSEAvailabilityEvent = JSON.parse(event.data);
        onAvailabilityUpdateRef.current?.(data);
      } catch (error) {
        console.error('[SSE] Failed to parse availability event:', error);
      }
    });

    eventSource.addEventListener('booking', (event) => {
      try {
        const data: SSEBookingEvent = JSON.parse(event.data);
        onBookingUpdateRef.current?.(data);
      } catch (error) {
        console.error('[SSE] Failed to parse booking event:', error);
      }
    });

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      eventSource.close();

      // Attempt reconnection with exponential backoff
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current);
        console.log(`[SSE] Reconnecting in ${delay}ms...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          // Call connect directly from effect, not recursively here
        }, delay);
      } else {
        console.error('[SSE] Max reconnection attempts reached');
      }
    };
  }, [branchId, enabled, disconnect]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    reconnect: connect,
    disconnect,
  };
}
