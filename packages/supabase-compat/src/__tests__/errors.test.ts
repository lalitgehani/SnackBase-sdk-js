import { describe, it, expect } from 'vitest';
import { wrap, NotSupportedError } from '../errors';

describe('wrap', () => {
  it('returns the resolved value with a null error', async () => {
    const result = await wrap(async () => ({ id: '1' }));
    expect(result).toEqual({ data: { id: '1' }, error: null });
  });

  it('never throws — a rejection becomes an error result', async () => {
    const result = await wrap(async () => {
      throw new Error('boom');
    });
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('boom');
  });

  it('prefers statusCode over status', async () => {
    const result = await wrap(async () => {
      throw Object.assign(new Error('nope'), { statusCode: 403, status: 500 });
    });
    expect(result.error?.status).toBe(403);
  });

  it('falls back to status when statusCode is absent', async () => {
    const result = await wrap(async () => {
      throw Object.assign(new Error('nope'), { status: 404 });
    });
    expect(result.error?.status).toBe(404);
  });

  it('passes through a string code', async () => {
    const result = await wrap(async () => {
      throw Object.assign(new Error('nope'), { code: 'PGRST116' });
    });
    expect(result.error?.code).toBe('PGRST116');
  });

  it('uses "Unknown error" when the thrown value has no string message', async () => {
    const result = await wrap(async () => {
      throw { notAnError: true };
    });
    expect(result.error?.message).toBe('Unknown error');
    expect(result.error?.status).toBeUndefined();
    expect(result.error?.code).toBeUndefined();
  });
});

describe('NotSupportedError', () => {
  it('names the unsupported method and keeps a distinguishable name', () => {
    const err = new NotSupportedError('supabase.rpc');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('NotSupportedError');
    expect(err.message).toContain('supabase.rpc');
    expect(err.message).toContain('not supported by SnackBase');
  });
});
