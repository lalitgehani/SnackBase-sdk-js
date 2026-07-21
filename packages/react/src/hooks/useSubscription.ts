import { useState, useEffect, useRef } from 'react';
import { useSnackBase } from '../SnackBaseContext';
import { acquireSubscription } from '../internal/subscriptionRegistry';
import type { RealtimeEvent } from '@snackbase/sdk';

export interface UseSubscriptionResult {
  /** True only when realtime transport state is `'connected'` */
  connected: boolean;
  error: Error | null;
}

/** Handler map for multi-operation subscriptions */
export interface SubscriptionHandlers<T = any> {
  create?: (data: T, event: RealtimeEvent<T>) => void;
  update?: (data: T, event: RealtimeEvent<T>) => void;
  delete?: (data: T, event: RealtimeEvent<T>) => void;
  /** Called for any matching event (in addition to specific handlers) */
  '*'? : (data: T, event: RealtimeEvent<T>) => void;
}

export type SubscriptionOperations = Array<'create' | 'update' | 'delete' | '*' | string>;

function isHandlers(value: unknown): value is SubscriptionHandlers {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (typeof (value as SubscriptionHandlers).create === 'function' ||
      typeof (value as SubscriptionHandlers).update === 'function' ||
      typeof (value as SubscriptionHandlers).delete === 'function' ||
      typeof (value as SubscriptionHandlers)['*'] === 'function')
  );
}

function normalizeOperations(eventOrOps: string | SubscriptionOperations): string[] {
  if (Array.isArray(eventOrOps)) {
    if (eventOrOps.includes('*') || eventOrOps.length === 0) {
      return ['create', 'update', 'delete'];
    }
    return eventOrOps.filter((op) => op !== '*');
  }
  if (eventOrOps === '*') {
    return ['create', 'update', 'delete'];
  }
  return [eventOrOps];
}

/**
 * Subscribe to realtime collection events.
 *
 * **Legacy form:** `useSubscription(collection, event, callback)`
 * where `event` is `'create' | 'update' | 'delete' | '*'`.
 *
 * **Multi-handler form:** `useSubscription(collection, operations, handlers)`
 * e.g. `useSubscription('posts', ['create', 'update'], { create: fn, update: fn })`.
 *
 * Shared subscriptions are ref-counted per collection: unmounting one consumer
 * does not unsubscribe while others remain mounted. Always invokes the latest
 * callback/handlers via ref (callback identity changes do not resubscribe).
 *
 * Ensures `client.realtime.connect()` when not already connecting/connected.
 */
export function useSubscription<T = any>(
  collection: string,
  event: string,
  callback: (data: T) => void
): UseSubscriptionResult;
export function useSubscription<T = any>(
  collection: string,
  operations: SubscriptionOperations,
  handlers: SubscriptionHandlers<T>
): UseSubscriptionResult;
export function useSubscription<T = any>(
  collection: string,
  eventOrOps: string | SubscriptionOperations,
  callbackOrHandlers: ((data: T) => void) | SubscriptionHandlers<T>
): UseSubscriptionResult {
  const client = useSnackBase();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const callbackRef = useRef(callbackOrHandlers);
  callbackRef.current = callbackOrHandlers;

  const operations = normalizeOperations(eventOrOps);
  const opsKey = Array.isArray(eventOrOps)
    ? eventOrOps.slice().sort().join(',')
    : String(eventOrOps);
  const multi = isHandlers(callbackOrHandlers);

  useEffect(() => {
    let cancelled = false;
    let release: (() => void) | undefined;
    const unsubs: Array<() => void> = [];

    const syncConnected = () => {
      if (cancelled) return;
      setConnected(client.realtime.getState() === 'connected');
    };

    const setup = async () => {
      try {
        const state = client.realtime.getState();
        if (state !== 'connected' && state !== 'connecting') {
          await client.realtime.connect();
        }
        if (cancelled) return;

        syncConnected();

        // Lifecycle listeners for accurate connected flag
        unsubs.push(
          client.realtime.on('connected', () => {
            if (!cancelled) {
              setConnected(true);
              setError(null);
            }
          })
        );
        unsubs.push(
          client.realtime.on('disconnected', () => {
            if (!cancelled) setConnected(false);
          })
        );
        unsubs.push(
          client.realtime.on('connecting', () => {
            if (!cancelled) setConnected(false);
          })
        );
        unsubs.push(
          client.realtime.on('error', (err: Error) => {
            if (!cancelled) {
              setError(err instanceof Error ? err : new Error(String(err)));
              setConnected(client.realtime.getState() === 'connected');
            }
          })
        );
        unsubs.push(
          client.realtime.on('auth_error', (err: Error) => {
            if (!cancelled) {
              setError(err instanceof Error ? err : new Error(String(err)));
            }
          })
        );

        release = await acquireSubscription(
          collection,
          operations,
          (col, ops) => client.realtime.subscribe(col, ops),
          (col) => client.realtime.unsubscribe(col)
        );
        if (cancelled) {
          release();
          return;
        }

        syncConnected();

        if (multi) {
          const wire = (op: string) => {
            const eventType = `${collection}.${op}`;
            const off = client.realtime.on(eventType, (e: any) => {
              const handlers = callbackRef.current as SubscriptionHandlers<T>;
              const payload = e?.data !== undefined ? e.data : e;
              const specific = handlers[op as keyof SubscriptionHandlers<T>] as
                | ((data: T, event: any) => void)
                | undefined;
              specific?.(payload, e);
              handlers['*']?.(payload, e);
            });
            unsubs.push(off);
          };
          for (const op of operations) {
            wire(op);
          }
          // Also listen wildcard if operations include all three
          if (operations.length === 3) {
            const off = client.realtime.on(`${collection}.*`, (e: any) => {
              const handlers = callbackRef.current as SubscriptionHandlers<T>;
              const payload = e?.data !== undefined ? e.data : e;
              handlers['*']?.(payload, e);
            });
            unsubs.push(off);
          }
        } else {
          const eventName =
            typeof eventOrOps === 'string' && eventOrOps !== '*'
              ? eventOrOps
              : '*';
          const eventType =
            eventName === '*' ? `${collection}.*` : `${collection}.${eventName}`;
          const off = client.realtime.on(eventType, (e: any) => {
            const cb = callbackRef.current as (data: T) => void;
            const payload = e?.data !== undefined ? e.data : e;
            cb(payload);
          });
          unsubs.push(off);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setConnected(client.realtime.getState() === 'connected');
        }
      }
    };

    setup();

    return () => {
      cancelled = true;
      for (const off of unsubs) {
        try {
          off();
        } catch {
          // ignore
        }
      }
      release?.();
    };
  }, [client, collection, opsKey, multi]);

  return { connected, error };
}
