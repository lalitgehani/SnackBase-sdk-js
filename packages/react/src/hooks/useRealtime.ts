import { useState, useEffect, useCallback, useRef } from 'react';
import { useSnackBase } from '../SnackBaseContext';
import type { RealTimeState } from '@snackbase/sdk';

export interface UseRealtimeOptions {
  /**
   * When true, call connect() on mount if not already connecting/connected.
   * @default false — useSubscription auto-connects when needed; useRealtime is for explicit control
   */
  autoConnect?: boolean;
}

export interface UseRealtimeResult {
  /** Current realtime transport state from `client.realtime.getState()` */
  state: RealTimeState;
  connect: () => Promise<void>;
  /**
   * Disconnect the shared realtime transport.
   * Prefer not calling this while useSubscription instances are still mounted;
   * disconnect is global to the client connection.
   */
  disconnect: () => void;
  error: Error | null;
  /** Active collection subscription names from the SDK */
  subscriptions: string[];
}

/**
 * Realtime connection status and control.
 * Shares the same `client.realtime` connection as `useSubscription`.
 * Does not disconnect on unmount (other subscribers may still need the connection).
 */
export function useRealtime(options?: UseRealtimeOptions): UseRealtimeResult {
  const client = useSnackBase();
  const autoConnect = options?.autoConnect === true;

  const [state, setState] = useState<RealTimeState>(() => client.realtime.getState());
  const [error, setError] = useState<Error | null>(null);
  const [subscriptions, setSubscriptions] = useState<string[]>(() =>
    typeof client.realtime.getSubscriptions === 'function'
      ? client.realtime.getSubscriptions()
      : []
  );

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(() => {
    if (!mountedRef.current) return;
    setState(client.realtime.getState());
    if (typeof client.realtime.getSubscriptions === 'function') {
      setSubscriptions(client.realtime.getSubscriptions());
    }
  }, [client]);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    const onConnecting = () => {
      setState('connecting');
    };
    const onConnected = () => {
      setState('connected');
      setError(null);
      refresh();
    };
    const onDisconnected = () => {
      setState('disconnected');
      refresh();
    };
    const onError = (err: Error) => {
      setError(err instanceof Error ? err : new Error(String(err)));
      setState(client.realtime.getState());
    };

    unsubs.push(client.realtime.on('connecting', onConnecting));
    unsubs.push(client.realtime.on('connected', onConnected));
    unsubs.push(client.realtime.on('disconnected', onDisconnected));
    unsubs.push(client.realtime.on('error', onError));
    unsubs.push(client.realtime.on('auth_error', onError));

    refresh();

    if (autoConnect) {
      const s = client.realtime.getState();
      if (s !== 'connected' && s !== 'connecting') {
        client.realtime.connect().catch((err: any) => {
          if (mountedRef.current) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setState(client.realtime.getState());
          }
        });
      }
    }

    return () => {
      for (const off of unsubs) {
        try {
          off();
        } catch {
          // ignore
        }
      }
      // Intentionally do not disconnect on unmount — shared connection policy
    };
  }, [client, autoConnect, refresh]);

  const connect = useCallback(async () => {
    setError(null);
    await client.realtime.connect();
    refresh();
  }, [client, refresh]);

  const disconnect = useCallback(() => {
    client.realtime.disconnect();
    refresh();
  }, [client, refresh]);

  return { state, connect, disconnect, error, subscriptions };
}
