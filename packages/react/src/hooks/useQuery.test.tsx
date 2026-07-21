import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React, { StrictMode } from 'react';
import { useQuery } from './useQuery';
import { SnackBaseProvider } from '../SnackBaseContext';

describe('useQuery', () => {
  let client: any;

  beforeEach(() => {
    client = {
      records: {
        list: vi.fn(),
        query: vi.fn(),
      },
    };
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SnackBaseProvider client={client}>{children}</SnackBaseProvider>
  );

  it('should fetch data on mount', async () => {
    const mockData = { items: [], total: 0, skip: 0, limit: 10 };
    client.records.list.mockResolvedValue(mockData);

    const { result } = renderHook(() => useQuery('posts'), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(client.records.list).toHaveBeenCalledWith('posts', undefined);
  });

  it('should handle errors', async () => {
    const error = new Error('Fetch failed');
    client.records.list.mockRejectedValue(error);

    const { result } = renderHook(() => useQuery('posts'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should refetch when params change', async () => {
    const mockData = { items: [], total: 0, skip: 0, limit: 10 };
    client.records.list.mockResolvedValue(mockData);

    const { result, rerender } = renderHook((props) => useQuery('posts', props), {
      wrapper,
      initialProps: { limit: 10 },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(client.records.list).toHaveBeenCalledWith('posts', { limit: 10 });

    rerender({ limit: 20 });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(client.records.list).toHaveBeenCalledWith('posts', { limit: 20 });
  });

  it('enabled: false skips network call', async () => {
    const { result } = renderHook(
      () => useQuery('posts', undefined, { enabled: false }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(client.records.list).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it('QueryBuilder form calls records.query().get()', async () => {
    const mockData = { items: [{ id: '1' }], total: 1, skip: 0, limit: 10 };
    const qb = {
      filter: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue(mockData),
    };
    client.records.query.mockReturnValue(qb);

    const { result } = renderHook(
      () => useQuery('posts', (builder) => builder.filter('status = "a"').sort('-created')),
      { wrapper }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(client.records.query).toHaveBeenCalledWith('posts');
    expect(qb.filter).toHaveBeenCalled();
    expect(qb.get).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockData);
  });

  it('ignores stale list response after params change', async () => {
    let resolveSlow: (v: any) => void;
    const slow = new Promise((resolve) => {
      resolveSlow = resolve;
    });

    client.records.list.mockImplementation((_c: string, params?: any) => {
      if (params?.limit === 1) return slow;
      return Promise.resolve({ items: [{ id: 'fast' }], total: 1, skip: 0, limit: 10 });
    });

    const { result, rerender } = renderHook(
      (props: { limit: number }) => useQuery('posts', { limit: props.limit }),
      { wrapper, initialProps: { limit: 1 } }
    );

    rerender({ limit: 2 });

    await waitFor(() => {
      expect(result.current.data?.items[0]).toEqual({ id: 'fast' });
    });

    await act(async () => {
      resolveSlow!({ items: [{ id: 'slow' }], total: 1, skip: 0, limit: 1 });
    });

    expect(result.current.data?.items[0]).toEqual({ id: 'fast' });
  });

  it('works under Strict Mode without throwing', async () => {
    client.records.list.mockResolvedValue({ items: [], total: 0, skip: 0, limit: 10 });
    const strictWrapper = ({ children }: { children: React.ReactNode }) => (
      <StrictMode>
        <SnackBaseProvider client={client}>{children}</SnackBaseProvider>
      </StrictMode>
    );

    const { result } = renderHook(() => useQuery('posts'), { wrapper: strictWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
  });
});
