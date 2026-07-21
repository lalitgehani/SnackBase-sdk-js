import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useSubscription } from './useSubscription';
import { SnackBaseProvider } from '../SnackBaseContext';
import {
  __resetSubscriptionRegistry,
  __getSubscriptionCount,
  __getSubscriptionOps,
} from '../internal/subscriptionRegistry';

describe('useSubscription', () => {
  let client: any;
  let listeners: Map<string, Set<Function>>;
  let rtState: string;

  beforeEach(() => {
    __resetSubscriptionRegistry();
    listeners = new Map();
    rtState = 'disconnected';

    client = {
      realtime: {
        getState: vi.fn(() => rtState),
        connect: vi.fn(async () => {
          rtState = 'connected';
          listeners.get('connected')?.forEach((h) => h());
        }),
        subscribe: vi.fn(async () => {}),
        unsubscribe: vi.fn(async () => {}),
        on: vi.fn((event: string, handler: Function) => {
          if (!listeners.has(event)) listeners.set(event, new Set());
          listeners.get(event)!.add(handler);
          return () => listeners.get(event)?.delete(handler);
        }),
        getSubscriptions: vi.fn(() => []),
      },
    };
  });

  afterEach(() => {
    __resetSubscriptionRegistry();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SnackBaseProvider client={client}>{children}</SnackBaseProvider>
  );

  it('connects on mount when not already connected', async () => {
    const cb = vi.fn();
    renderHook(() => useSubscription('posts', 'create', cb), { wrapper });

    await waitFor(() => {
      expect(client.realtime.connect).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(client.realtime.subscribe).toHaveBeenCalledWith('posts', ['create']);
    });
  });

  it('sets connected true only when getState is connected', async () => {
    const cb = vi.fn();
    // subscribe resolves but we control connected via state/events
    client.realtime.subscribe.mockImplementation(async () => {
      // intentionally leave state as connecting until event
      rtState = 'connecting';
    });
    client.realtime.connect.mockImplementation(async () => {
      rtState = 'connecting';
    });

    const { result } = renderHook(() => useSubscription('posts', '*', cb), { wrapper });

    await waitFor(() => {
      expect(client.realtime.subscribe).toHaveBeenCalled();
    });
    // Still connecting — not false-positive connected from subscribe alone
    expect(result.current.connected).toBe(false);

    act(() => {
      rtState = 'connected';
      listeners.get('connected')?.forEach((h) => h());
    });
    expect(result.current.connected).toBe(true);
  });

  it('surfaces connect errors', async () => {
    client.realtime.connect.mockRejectedValue(new Error('connect failed'));
    const { result } = renderHook(() => useSubscription('posts', 'create', vi.fn()), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.error?.message).toBe('connect failed');
    });
    expect(result.current.connected).toBe(false);
  });

  it('ref-counts: two mounts share one unsubscribe at last unmount', async () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const a = renderHook(() => useSubscription('posts', 'create', cb1), { wrapper });
    const b = renderHook(() => useSubscription('posts', 'create', cb2), { wrapper });

    await waitFor(() => {
      expect(__getSubscriptionCount('posts')).toBe(2);
    });
    expect(client.realtime.subscribe).toHaveBeenCalledTimes(1);

    a.unmount();
    expect(client.realtime.unsubscribe).not.toHaveBeenCalled();
    expect(__getSubscriptionCount('posts')).toBe(1);

    b.unmount();
    await waitFor(() => {
      expect(client.realtime.unsubscribe).toHaveBeenCalledWith('posts');
    });
    expect(__getSubscriptionCount('posts')).toBe(0);
  });

  it('always invokes the latest callback without resubscribe storm', async () => {
    const first = vi.fn();
    const second = vi.fn();

    const { rerender } = renderHook(
      ({ cb }) => useSubscription('posts', 'create', cb),
      { wrapper, initialProps: { cb: first } }
    );

    await waitFor(() => {
      expect(client.realtime.subscribe).toHaveBeenCalledTimes(1);
    });

    rerender({ cb: second });
    expect(client.realtime.subscribe).toHaveBeenCalledTimes(1);

    act(() => {
      listeners.get('posts.create')?.forEach((h) => h({ data: { id: '1' } }));
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({ id: '1' });
  });

  it('supports multi-handler operations form', async () => {
    const create = vi.fn();
    const update = vi.fn();

    renderHook(
      () =>
        useSubscription('posts', ['create', 'update'], {
          create,
          update,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(client.realtime.subscribe).toHaveBeenCalledWith('posts', ['create', 'update']);
    });

    act(() => {
      listeners.get('posts.create')?.forEach((h) => h({ data: { id: 'c1' } }));
      listeners.get('posts.update')?.forEach((h) => h({ data: { id: 'u1' } }));
    });

    expect(create).toHaveBeenCalledWith({ id: 'c1' }, expect.anything());
    expect(update).toHaveBeenCalledWith({ id: 'u1' }, expect.anything());
  });

  it('merges operations when dual-mount uses different ops (LivePosts pattern)', async () => {
    const onCreate = vi.fn();
    const onUpdate = vi.fn();
    const onDelete = vi.fn();

    const createHook = renderHook(
      () => useSubscription('posts', 'create', onCreate),
      { wrapper }
    );
    await waitFor(() => {
      expect(client.realtime.subscribe).toHaveBeenCalledWith('posts', ['create']);
    });
    expect(__getSubscriptionOps('posts')).toEqual(['create']);

    const updateHook = renderHook(
      () => useSubscription('posts', 'update', onUpdate),
      { wrapper }
    );
    await waitFor(() => {
      expect(client.realtime.subscribe).toHaveBeenCalledWith('posts', ['create', 'update']);
    });
    expect(__getSubscriptionOps('posts').sort()).toEqual(['create', 'update']);

    const deleteHook = renderHook(
      () => useSubscription('posts', 'delete', onDelete),
      { wrapper }
    );
    await waitFor(() => {
      // Last subscribe must include all three ops so server delivers all events
      const calls = client.realtime.subscribe.mock.calls;
      const lastOps = calls[calls.length - 1][1] as string[];
      expect([...lastOps].sort()).toEqual(['create', 'delete', 'update']);
    });
    expect(__getSubscriptionCount('posts')).toBe(3);
    expect(__getSubscriptionOps('posts').sort()).toEqual(['create', 'delete', 'update']);

    // Each hook still receives its own event type
    act(() => {
      listeners.get('posts.create')?.forEach((h) => h({ data: { id: 'c' } }));
      listeners.get('posts.update')?.forEach((h) => h({ data: { id: 'u' } }));
      listeners.get('posts.delete')?.forEach((h) => h({ data: { id: 'd' } }));
    });
    expect(onCreate).toHaveBeenCalledWith({ id: 'c' });
    expect(onUpdate).toHaveBeenCalledWith({ id: 'u' });
    expect(onDelete).toHaveBeenCalledWith({ id: 'd' });

    createHook.unmount();
    updateHook.unmount();
    expect(client.realtime.unsubscribe).not.toHaveBeenCalled();
    deleteHook.unmount();
    await waitFor(() => {
      expect(client.realtime.unsubscribe).toHaveBeenCalledWith('posts');
    });
  });
});
