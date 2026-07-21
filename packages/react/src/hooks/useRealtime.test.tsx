import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useRealtime } from './useRealtime';
import { SnackBaseProvider } from '../SnackBaseContext';

describe('useRealtime', () => {
  let client: any;
  let listeners: Map<string, Set<Function>>;
  let rtState: string;

  beforeEach(() => {
    listeners = new Map();
    rtState = 'disconnected';
    client = {
      realtime: {
        getState: vi.fn(() => rtState),
        connect: vi.fn(async () => {
          rtState = 'connected';
          listeners.get('connected')?.forEach((h) => h());
        }),
        disconnect: vi.fn(() => {
          rtState = 'disconnected';
          listeners.get('disconnected')?.forEach((h) => h());
        }),
        getSubscriptions: vi.fn(() => ['posts']),
        on: vi.fn((event: string, handler: Function) => {
          if (!listeners.has(event)) listeners.set(event, new Set());
          listeners.get(event)!.add(handler);
          return () => listeners.get(event)?.delete(handler);
        }),
      },
    };
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SnackBaseProvider client={client}>{children}</SnackBaseProvider>
  );

  it('reflects getState and updates on lifecycle events', async () => {
    const { result } = renderHook(() => useRealtime(), { wrapper });
    expect(result.current.state).toBe('disconnected');

    act(() => {
      rtState = 'connected';
      listeners.get('connected')?.forEach((h) => h());
    });
    expect(result.current.state).toBe('connected');
  });

  it('connect and disconnect delegate to SDK', async () => {
    const { result } = renderHook(() => useRealtime(), { wrapper });

    await act(async () => {
      await result.current.connect();
    });
    expect(client.realtime.connect).toHaveBeenCalled();
    expect(result.current.state).toBe('connected');

    act(() => {
      result.current.disconnect();
    });
    expect(client.realtime.disconnect).toHaveBeenCalled();
    expect(result.current.state).toBe('disconnected');
  });

  it('autoConnect connects on mount', async () => {
    renderHook(() => useRealtime({ autoConnect: true }), { wrapper });
    await waitFor(() => {
      expect(client.realtime.connect).toHaveBeenCalled();
    });
  });

  it('does not disconnect on unmount', () => {
    const { unmount } = renderHook(() => useRealtime(), { wrapper });
    unmount();
    expect(client.realtime.disconnect).not.toHaveBeenCalled();
  });
});
