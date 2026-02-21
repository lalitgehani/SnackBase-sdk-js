import { SnackBaseClient } from '@snackbase/sdk';
import { SnackbaseSupabaseClient } from './client';

/**
 * Optional configuration subset matching Supabase's `createClient` options.
 * Fields not supported by SnackBase are silently ignored.
 */
export interface CompatClientOptions {
  auth?: {
    persistSession?: boolean;
    autoRefreshToken?: boolean;
    storageKey?: string;
  };
  global?: {
    headers?: Record<string, string>;
  };
}

/**
 * Drop-in replacement for Supabase's `createClient()`.
 *
 * @param url - Your SnackBase instance URL (e.g. `http://localhost:8000`)
 * @param key - Your SnackBase API key (used as the anonymous/service key)
 * @param options - Optional configuration (subset of Supabase options — ignored fields do not throw)
 *
 * @example
 * ```ts
 * import { createClient } from '@snackbase/supabase-compat'
 * const supabase = createClient('http://localhost:8000', 'my-api-key')
 *
 * // Same API as @supabase/supabase-js
 * const { data, error } = await supabase.from('posts').select('*')
 * ```
 */
export function createClient(
  url: string,
  key: string,
  _options?: CompatClientOptions,
): SnackbaseSupabaseClient {
  const snackbase = new SnackBaseClient({
    baseUrl: url,
    apiKey: key,
  });
  return new SnackbaseSupabaseClient(snackbase);
}

// Named export for advanced usage
export { SnackbaseSupabaseClient } from './client';

// Type exports for user code
export type {
  CompatSession,
  CompatUser,
  CompatError,
  CompatSessionResult,
  CompatUserResult,
  AuthChangeEvent,
  AuthStateChangeCallback,
  AuthSubscription,
  PublicUrlResult,
  RealtimeChannelStatus,
  RealtimePostgresEvent,
  RealtimePostgresChangesPayload,
} from './types';
export type { SupabaseResult } from './errors';
export { NotSupportedError } from './errors';
