/**
 * AuthStoreCompat — bridges SnackBase's AuthManager to the PocketBase authStore API.
 *
 * Phase 3: token, record, model, isValid, isSuperuser, save, clear, onChange,
 *   loadFromCookie, exportToCookie.
 */

import type { AuthManager } from '@snackbase/sdk';
import type { RecordModel } from './types.js';
import { toRecordModel } from './normalizer.js';

type OnChangeCallback = (token: string, record: RecordModel | null) => void;

const DEFAULT_COOKIE_KEY = 'pb_auth';

export class AuthStoreCompat {
  /** Local override — set by save(), cleared by clear() */
  private _localToken: string | null = null;
  private _localRecord: RecordModel | null = null;

  /** Internal onChange listeners */
  private _listeners: Set<OnChangeCallback> = new Set();

  /** Cleanup fns for authManager event subscriptions */
  private _authUnsubscribes: Array<() => void> = [];

  constructor(private readonly authManager: AuthManager) {
    // Bridge auth:login, auth:logout, auth:refresh → our onChange listeners
    this._authUnsubscribes.push(
      authManager.on('auth:login', () => this._fireOnChange()),
      authManager.on('auth:logout', () => this._fireOnChange()),
      authManager.on('auth:refresh', () => this._fireOnChange()),
    );
  }

  /** The current JWT token string; '' if not authenticated. */
  get token(): string {
    return this._localToken ?? this.authManager.token ?? '';
  }

  /**
   * The current authenticated record mapped to PocketBase's RecordModel shape.
   * Returns null when not authenticated.
   */
  get record(): RecordModel | null {
    if (this._localToken !== null) {
      return this._localRecord;
    }
    const user = this.authManager.user;
    if (!user) return null;
    return toRecordModel(user as unknown as Record<string, any>, 'users');
  }

  /** Deprecated alias for `record` (PocketBase backward compat). */
  get model(): RecordModel | null {
    return this.record;
  }

  /**
   * Whether the current auth session is valid (has a token and not expired).
   */
  get isValid(): boolean {
    const token = this._localToken ?? this.authManager.token;
    if (!token) return false;

    if (this._localToken !== null) {
      // Local override — no expiry to check
      return true;
    }

    const state = this.authManager.getState();
    if (!state.isAuthenticated) return false;
    if (!state.expiresAt) return true;
    return new Date(state.expiresAt) > new Date();
  }

  /**
   * Whether the authenticated record belongs to the superusers collection.
   * Approximated via SnackBase's isSuperadmin().
   */
  get isSuperuser(): boolean {
    return this.authManager.isSuperadmin();
  }

  /**
   * Manually set (override) the auth token and record.
   * Useful for SSR cookie-restore scenarios.
   * Fires onChange listeners.
   */
  save(token: string, record?: RecordModel | null): void {
    this._localToken = token;
    this._localRecord = record ?? null;
    this._fireOnChange();
  }

  /**
   * Clear the local override and the authManager session.
   * Fires onChange listeners.
   */
  clear(): void {
    this._localToken = null;
    this._localRecord = null;
    // Also clear the underlying authManager session
    this.authManager.clear().catch(() => {});
    this._fireOnChange();
  }

  /**
   * Register a callback that fires whenever the auth state changes.
   * If `fireImmediately` is true, the callback fires once right away.
   *
   * Returns an unsubscribe function.
   */
  onChange(callback: OnChangeCallback, fireImmediately = false): () => void {
    this._listeners.add(callback);

    if (fireImmediately) {
      callback(this.token, this.record);
    }

    return () => {
      this._listeners.delete(callback);
    };
  }

  /**
   * Parse a cookie string and restore auth state via save().
   *
   * Expected cookie value format (JSON): `{"token":"...","record":{...}}`
   *
   * @param cookieStr - Full cookie string, e.g. `document.cookie`
   * @param key - Cookie name to look for (default: 'pb_auth')
   */
  loadFromCookie(cookieStr: string, key = DEFAULT_COOKIE_KEY): void {
    const cookies = parseCookies(cookieStr);
    const raw = cookies[key];
    if (!raw) return;

    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      const token: string = parsed?.token ?? '';
      const record: RecordModel | null = parsed?.record ?? null;
      if (token) {
        this.save(token, record);
      }
    } catch {
      // Silently ignore malformed cookie values
    }
  }

  /**
   * Serialize the current auth state as a Set-Cookie-compatible string.
   *
   * @param opts - Standard cookie options (path, sameSite, secure, httpOnly, maxAge)
   * @param key - Cookie name (default: 'pb_auth')
   */
  exportToCookie(
    opts: {
      path?: string;
      sameSite?: string;
      secure?: boolean;
      httpOnly?: boolean;
      maxAge?: number;
    } = {},
    key = DEFAULT_COOKIE_KEY,
  ): string {
    const value = encodeURIComponent(
      JSON.stringify({ token: this.token, record: this.record }),
    );

    const parts: string[] = [`${key}=${value}`];

    const path = opts.path ?? '/';
    parts.push(`Path=${path}`);

    if (opts.sameSite) {
      parts.push(`SameSite=${opts.sameSite}`);
    }
    if (opts.secure) {
      parts.push('Secure');
    }
    if (opts.httpOnly) {
      parts.push('HttpOnly');
    }
    if (opts.maxAge !== undefined) {
      parts.push(`Max-Age=${opts.maxAge}`);
    }

    return parts.join('; ');
  }

  /** Notify all registered onChange listeners. */
  private _fireOnChange(): void {
    const token = this.token;
    const record = this.record;
    for (const listener of this._listeners) {
      listener(token, record);
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function parseCookies(cookieStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of cookieStr.split(';')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx < 0) continue;
    const name = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    result[name] = val;
  }
  return result;
}
