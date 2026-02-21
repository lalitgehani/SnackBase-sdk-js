/**
 * Supabase-compatible result type — all compat methods return this shape,
 * never throwing. Mirrors the `{ data, error }` contract from @supabase/supabase-js.
 */
export interface SupabaseResult<T> {
  data: T | null;
  error: CompatError | null;
}

/**
 * Normalised error shape that mirrors Supabase's PostgrestError / AuthError.
 */
export interface CompatError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Wraps a SnackBase SDK call (which throws on error) into `{ data, error }` format.
 * This is the core primitive used by every bridge method.
 *
 * @example
 * const { data, error } = await wrap(() => snackbase.auth.login({ email, password }));
 */
export async function wrap<T>(fn: () => Promise<T>): Promise<SupabaseResult<T>> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (err: unknown) {
    const e = err as Record<string, unknown>;
    return {
      data: null,
      error: {
        message: typeof e?.message === 'string' ? e.message : 'Unknown error',
        status:
          typeof e?.statusCode === 'number'
            ? e.statusCode
            : typeof e?.status === 'number'
              ? e.status
              : undefined,
        code: typeof e?.code === 'string' ? e.code : undefined,
      },
    };
  }
}

/**
 * Thrown when a Supabase API is called that has no SnackBase equivalent.
 * Caught by `wrap()` when used inside bridge stubs; may also be thrown directly
 * from methods that cannot be expressed as async (e.g. `.functions`).
 */
export class NotSupportedError extends Error {
  constructor(method: string) {
    super(
      `@snackbase/supabase-compat: "${method}" is not supported by SnackBase. ` +
        `See https://snackbase.io/docs/supabase-migration for alternatives.`,
    );
    this.name = 'NotSupportedError';
  }
}
