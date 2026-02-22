/**
 * PocketBase-compatible error classes for @snackbase/pocketbase-compat.
 */

/**
 * Mirrors PocketBase's ClientResponseError shape.
 * Thrown by all compat bridge methods (unlike supabase-compat which returns { data, error }).
 */
export class ClientResponseError extends Error {
  public readonly url: string;
  public readonly status: number;
  public readonly data: Record<string, any>;
  public readonly isAbort: boolean;
  public readonly originalError: unknown;

  constructor(opts: {
    url?: string;
    status?: number;
    data?: Record<string, any>;
    message?: string;
    isAbort?: boolean;
    originalError?: unknown;
  } = {}) {
    const status = opts.status ?? 0;
    const data = opts.data ?? {};
    const message =
      opts.message ||
      (data?.message as string | undefined) ||
      `Failed request (${status})`;

    super(message);
    this.name = 'ClientResponseError';
    this.url = opts.url ?? '';
    this.status = status;
    this.data = data;
    this.isAbort = opts.isAbort ?? false;
    this.originalError = opts.originalError ?? null;
    Object.setPrototypeOf(this, ClientResponseError.prototype);
  }

  toJSON() {
    return {
      url: this.url,
      status: this.status,
      data: this.data,
      isAbort: this.isAbort,
    };
  }
}

/**
 * Thrown when a PocketBase API is called that has no SnackBase equivalent.
 */
export class NotSupportedError extends Error {
  constructor(method: string) {
    super(
      `@snackbase/pocketbase-compat: "${method}" is not supported by SnackBase. ` +
        `See https://snackbase.io/docs/pocketbase-migration for alternatives.`,
    );
    this.name = 'NotSupportedError';
    Object.setPrototypeOf(this, NotSupportedError.prototype);
  }
}

/**
 * Wraps a SnackBase SDK call (which throws on error) and rethrows any error as
 * a ClientResponseError. This is the core primitive used by every bridge method.
 *
 * Unlike supabase-compat's `wrap()`, PocketBase code expects throws — never { data, error }.
 *
 * @example
 * const result = await wrapThrow(() => snackbase.records.get('posts', id));
 */
export async function wrapThrow<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    if (err instanceof ClientResponseError) {
      throw err;
    }

    const e = err as Record<string, unknown>;
    const status =
      typeof e?.status === 'number'
        ? e.status
        : typeof e?.statusCode === 'number'
          ? e.statusCode
          : 0;
    const message =
      typeof e?.message === 'string' ? e.message : 'Unknown error';
    const data =
      e?.data && typeof e.data === 'object'
        ? (e.data as Record<string, any>)
        : {};

    throw new ClientResponseError({
      status,
      message,
      data,
      originalError: err,
    });
  }
}
