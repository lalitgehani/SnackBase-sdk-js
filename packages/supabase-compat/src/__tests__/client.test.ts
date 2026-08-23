import { describe, it, expect, vi } from 'vitest';
import type { SnackBaseClient } from '@snackbase/sdk';
import { createClient, SnackbaseSupabaseClient, NotSupportedError } from '../index';
import { SnackbaseQueryBuilder } from '../query-builder';

const stub = () => ({ records: {}, auth: {}, files: {}, realtime: {} }) as unknown as SnackBaseClient;

describe('createClient', () => {
  it('returns a SnackbaseSupabaseClient', () => {
    expect(createClient('http://localhost:8000', 'sb_ak.key')).toBeInstanceOf(
      SnackbaseSupabaseClient,
    );
  });

  it('accepts and ignores unsupported Supabase options rather than throwing', () => {
    expect(() =>
      createClient('http://localhost:8000', 'sb_ak.key', {
        auth: { persistSession: false, autoRefreshToken: false, storageKey: 'x' },
        global: { headers: { 'x-custom': '1' } },
      }),
    ).not.toThrow();
  });
});

describe('SnackbaseSupabaseClient', () => {
  it('from() returns a lazy query builder without calling the SDK', () => {
    const client = new SnackbaseSupabaseClient(stub());
    expect(client.from('posts')).toBeInstanceOf(SnackbaseQueryBuilder);
  });

  it('exposes auth and storage namespaces', () => {
    const client = new SnackbaseSupabaseClient(stub());
    expect(client.auth).toBeDefined();
    expect(client.storage).toBeDefined();
  });

  it('returns the same storage instance on repeat access', () => {
    const client = new SnackbaseSupabaseClient(stub());
    expect(client.storage).toBe(client.storage);
  });

  it('throws NotSupportedError from rpc()', () => {
    const client = new SnackbaseSupabaseClient(stub());
    expect(() => client.rpc()).toThrow(NotSupportedError);
  });

  it('throws NotSupportedError from the functions getter', () => {
    const client = new SnackbaseSupabaseClient(stub());
    expect(() => client.functions).toThrow(NotSupportedError);
  });

  it('removeChannel unsubscribes the channel and reports ok', async () => {
    const client = new SnackbaseSupabaseClient(stub());
    const channel = { _unsubscribeAll: vi.fn().mockResolvedValue(undefined) };

    await expect(client.removeChannel(channel as never)).resolves.toBe('ok');
    expect(channel._unsubscribeAll).toHaveBeenCalled();
  });
});
