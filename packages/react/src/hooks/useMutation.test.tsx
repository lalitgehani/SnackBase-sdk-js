import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useMutation } from './useMutation';
import { useQuery } from './useQuery';
import { SnackBaseProvider } from '../SnackBaseContext';
import { __resetInvalidation } from '../internal/invalidation';

describe('useMutation', () => {
  let client: any;

  beforeEach(() => {
    __resetInvalidation();
    client = {
      records: {
        create: vi.fn(),
        update: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        batchCreate: vi.fn(),
        batchUpdate: vi.fn(),
        batchDelete: vi.fn(),
        aggregate: vi.fn(),
        list: vi.fn().mockResolvedValue({ items: [], total: 0, skip: 0, limit: 10 }),
      },
    };
  });

  afterEach(() => {
    __resetInvalidation();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SnackBaseProvider client={client}>{children}</SnackBaseProvider>
  );

  it('create/update/del call SDK methods', async () => {
    client.records.create.mockResolvedValue({ id: '1', title: 'a' });
    client.records.update.mockResolvedValue({ id: '1', title: 'b' });
    client.records.delete.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useMutation('posts'), { wrapper });

    await act(async () => {
      await result.current.create({ title: 'a' });
      await result.current.update('1', { title: 'b' });
      await result.current.del('1');
    });

    expect(client.records.create).toHaveBeenCalledWith('posts', { title: 'a' });
    expect(client.records.update).toHaveBeenCalledWith('posts', '1', { title: 'b' });
    expect(client.records.delete).toHaveBeenCalledWith('posts', '1');
  });

  it('patch, batchCreate, aggregate call SDK and rethrow errors', async () => {
    client.records.patch.mockResolvedValue({ id: '1', title: 'p' });
    client.records.batchCreate.mockResolvedValue({ created: [], count: 0 });
    client.records.aggregate.mockResolvedValue({ results: [], total_groups: 0 });

    const { result } = renderHook(() => useMutation('posts'), { wrapper });

    await act(async () => {
      await result.current.patch('1', { title: 'p' });
      await result.current.batchCreate([{ title: 'x' }]);
      await result.current.aggregate({ functions: 'count()' });
    });

    expect(client.records.patch).toHaveBeenCalledWith('posts', '1', { title: 'p' });
    expect(client.records.batchCreate).toHaveBeenCalledWith('posts', [{ title: 'x' }]);
    expect(client.records.aggregate).toHaveBeenCalledWith('posts', { functions: 'count()' });

    client.records.patch.mockRejectedValue(new Error('patch fail'));
    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.patch('1', { title: 'z' });
      } catch (e) {
        thrown = e;
      }
    });
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe('patch fail');
    expect(result.current.error?.message).toBe('patch fail');
  });

  it('invalidateOnSuccess refetches mounted useQuery for same collection', async () => {
    client.records.list
      .mockResolvedValueOnce({ items: [{ id: '1' }], total: 1, skip: 0, limit: 10 })
      .mockResolvedValueOnce({ items: [{ id: '1' }, { id: '2' }], total: 2, skip: 0, limit: 10 });
    client.records.create.mockResolvedValue({ id: '2', title: 'n' });

    const { result } = renderHook(
      () => ({
        q: useQuery('posts'),
        m: useMutation('posts', { invalidateOnSuccess: true }),
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.q.loading).toBe(false);
    });
    expect(client.records.list).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.m.create({ title: 'n' });
    });

    await waitFor(() => {
      expect(client.records.list).toHaveBeenCalledTimes(2);
    });
  });

  it('does not invalidate when invalidateOnSuccess is false (default)', async () => {
    client.records.create.mockResolvedValue({ id: '1' });
    client.records.list.mockResolvedValue({ items: [], total: 0, skip: 0, limit: 10 });

    const { result } = renderHook(
      () => ({
        q: useQuery('posts'),
        m: useMutation('posts'),
      }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.q.loading).toBe(false));
    const calls = client.records.list.mock.calls.length;

    await act(async () => {
      await result.current.m.create({ title: 'x' });
    });

    // No extra list from invalidation
    expect(client.records.list.mock.calls.length).toBe(calls);
  });
});
