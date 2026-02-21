import { describe, it, expect } from 'vitest';
import { wrap, NotSupportedError, type CompatError } from '../errors';

describe('wrap()', () => {
  it('returns { data, error: null } on success', async () => {
    const { data, error } = await wrap(() => Promise.resolve(42));
    expect(data).toBe(42);
    expect(error).toBeNull();
  });

  it('returns { data: null, error } on failure — never re-throws', async () => {
    const result = await wrap(() => Promise.reject(new Error('something went wrong')));
    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.message).toBe('something went wrong');
  });

  it('populates error.status from statusCode property', async () => {
    const err = Object.assign(new Error('not found'), { statusCode: 404 });
    const { error } = await wrap(() => Promise.reject(err));
    expect(error?.status).toBe(404);
  });

  it('populates error.status from status property when statusCode is absent', async () => {
    const err = Object.assign(new Error('bad'), { status: 400 });
    const { error } = await wrap(() => Promise.reject(err));
    expect(error?.status).toBe(400);
  });

  it('populates error.code when present', async () => {
    const err = Object.assign(new Error('oops'), { code: 'PGRST301' });
    const { error } = await wrap(() => Promise.reject(err));
    expect(error?.code).toBe('PGRST301');
  });

  it('sets error.message to "Unknown error" when error has no message', async () => {
    const { error } = await wrap(() => Promise.reject(null));
    expect(error?.message).toBe('Unknown error');
  });

  it('handles non-Error objects thrown', async () => {
    const { data, error } = await wrap(() => Promise.reject('string error'));
    expect(data).toBeNull();
    expect(error).not.toBeNull();
    // 'string error' has no .message property — should fall back
    expect(typeof error?.message).toBe('string');
  });

  it('does NOT re-throw even if wrapped function rejects', async () => {
    let threw = false;
    try {
      await wrap(() => Promise.reject(new Error('boom')));
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
  });

  it('works with async functions that return objects', async () => {
    const payload = { id: '1', name: 'test' };
    const { data, error } = await wrap(async () => payload);
    expect(data).toEqual(payload);
    expect(error).toBeNull();
  });
});

describe('NotSupportedError', () => {
  it('includes method name in message', () => {
    const err = new NotSupportedError('auth.signInAnonymously');
    expect(err.message).toContain('auth.signInAnonymously');
  });

  it('includes docs URL in message', () => {
    const err = new NotSupportedError('supabase.functions');
    expect(err.message).toContain('snackbase.io/docs/supabase-migration');
  });

  it('has name "NotSupportedError"', () => {
    const err = new NotSupportedError('test');
    expect(err.name).toBe('NotSupportedError');
  });

  it('is an instance of Error', () => {
    const err = new NotSupportedError('test');
    expect(err).toBeInstanceOf(Error);
  });

  it('wrap() catches NotSupportedError and returns it as error', async () => {
    const { data, error } = await wrap(() =>
      Promise.reject(new NotSupportedError('supabase.functions')),
    );
    expect(data).toBeNull();
    expect(error?.message).toContain('supabase.functions');
  });
});
