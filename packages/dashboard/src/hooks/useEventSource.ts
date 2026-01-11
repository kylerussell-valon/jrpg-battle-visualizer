'use client';

import { useEffect, useRef, useCallback } from 'react';

interface SSEMessage {
  type: string;
  data?: unknown;
  timestamp?: number;
}

interface UseEventSourceOptions {
  onMessage: (event: SSEMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectInterval?: number;
}

export function useEventSource(
  url: string,
  options: UseEventSourceOptions
) {
  const { onMessage, onConnect, onDisconnect, reconnectInterval = 3000 } = options;
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      onConnect?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SSEMessage = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = () => {
      onDisconnect?.();
      eventSource.close();

      // Attempt to reconnect
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, reconnectInterval);
    };
  }, [url, onMessage, onConnect, onDisconnect, reconnectInterval]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  return { disconnect };
}
