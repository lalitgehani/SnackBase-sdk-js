import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useRecord } from './useRecord';
import { SnackBaseProvider } from '../SnackBaseContext';

describe('useRecord', () => {
  let client: any;

  beforeEach(() => {
    client = {
      records: {
        get: vi.fn(),
      },
    };
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SnackBaseProvider client={client}>{children}</SnackBaseProvider>
  );

  it('fetches record on mount', async () => {
    client.records.get.mockResolvedValue({ id: '1', title: 'Hello' });
    const { result } = renderHook(() => useRecord('posts', '1'), { wrapper });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ id: '1', title: 'Hello' });
    expect(client.records.get).toHaveBeenCalledWith('posts', '1', {
      fields: undefined,
      expand: undefined,
    });
  });

  it('skips fetch when id is empty', async () => {
    const { result } = renderHook(() => useRecord('posts', ''), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(client.records.get).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it('handles errors', async () => {
    client.records.get.mockRejectedValue(new Error('not found'));
    const { result } = renderHook(() => useRecord('posts', 'x'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe('not found');
  });

  it('refetches when id changes and ignores stale response', async () => {
    let resolveSlow: (v: any) => void;
    const slow = new Promise((resolve) => {
      resolveSlow = resolve;
    });

    client.records.get.mockImplementation((_c: string, id: string) => {
      if (id === 'slow') return slow;
      return Promise.resolve({ id: 'fast', title: 'Fast' });
    });

    const { result, rerender } = renderHook(
      ({ id }) => useRecord('posts', id),
      { wrapper, initialProps: { id: 'slow' } }
    );

    rerender({ id: 'fast' });

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 'fast', title: 'Fast' });
    });

    // Late slow response must not overwrite
    await act(async () => {
      resolveSlow!({ id: 'slow', title: 'Slow' });
    });

    expect(result.current.data).toEqual({ id: 'fast', title: 'Fast' });
  });

  it('refetch method reloads data', async () => {
    client.records.get
      .mockResolvedValueOnce({ id: '1', v: 1 })
      .mockResolvedValueOnce({ id: '1', v: 2 });

    const { result } = renderHook(() => useRecord('posts', '1'), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ id: '1', v: 1 }));

    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.data).toEqual({ id: '1', v: 2 });
  });
});
