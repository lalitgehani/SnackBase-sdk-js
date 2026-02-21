import type { CompatError } from './errors';

// Re-export CompatError so consumers can import it from types.ts as well
export type { CompatError };

/** Mirrors Supabase's User object */
export interface CompatUser {
  id: string;
  email?: string;
  role?: string;
  created_at?: string;
  /** SnackBase doesn't have this field — returned as empty object */
  user_metadata: Record<string, unknown>;
  /** SnackBase role mapped here */
  app_metadata: Record<string, unknown>;
}

/** Mirrors Supabase's Session object */
export interface CompatSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  token_type: 'bearer';
  user: CompatUser;
}

/** Mirrors Supabase auth.getSession() return */
export interface CompatSessionResult {
  data: { session: CompatSession | null };
  error: CompatError | null;
}

/** Mirrors Supabase auth.getUser() return */
export interface CompatUserResult {
  data: { user: CompatUser | null };
  error: CompatError | null;
}

/** Mirrors Supabase onAuthStateChange event names */
export type AuthChangeEvent =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

/** Mirrors Supabase onAuthStateChange callback signature */
export type AuthStateChangeCallback = (
  event: AuthChangeEvent,
  session: CompatSession | null,
) => void | Promise<void>;

/** Mirrors Supabase onAuthStateChange return value */
export interface AuthSubscription {
  data: { subscription: { unsubscribe: () => void } };
}

/** Mirrors Supabase storage.from().getPublicUrl() return value (synchronous, never errors) */
export interface PublicUrlResult {
  data: { publicUrl: string };
}

/** Mirrors Supabase realtime channel status callback values */
export type RealtimeChannelStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR';

/** Supabase postgres_changes event type filter */
export type RealtimePostgresEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

/** Normalised postgres_changes payload shape */
export interface RealtimePostgresChangesPayload<T = Record<string, unknown>> {
  schema: string;
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
  commit_timestamp: string;
}
