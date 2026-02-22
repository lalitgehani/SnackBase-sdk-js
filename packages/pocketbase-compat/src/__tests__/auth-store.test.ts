import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthStoreCompat } from '../auth-store.js';
import type { AuthManager } from '@snackbase/sdk';

// ---------------------------------------------------------------------------
// Mock AuthManager factory
// ---------------------------------------------------------------------------

interface MockAuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  expiresAt: string | null;
}

function makeMockAuthManager(initial: Partial<MockAuthState> = {}): AuthManager & {
  _emit: (event: string, ...args: any[]) => void;
} {
  const state: MockAuthState = {
    token: null,
    user: null,
    isAuthenticated: false,
    expiresAt: null,
    ...initial,
  };

  // Simple event emitter
  const listeners: Record<string, Set<Function>> = {};

  const manager = {
    get token() { return state.token; },
    get user() { return state.user; },
    get isAuthenticated() { return state.isAuthenticated; },
    getState: vi.fn(() => ({ ...state, refreshToken: null, account: null, tokenType: 'jwt' })),
    isSuperadmin: vi.fn(() => false),
    clear: vi.fn(async () => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    }),
    on: vi.fn((event: string, listener: Function) => {
      if (!listeners[event]) listeners[event] = new Set();
      listeners[event].add(listener);
      return () => listeners[event].delete(listener);
    }),
    // Test helper to fire events
    _emit(event: string, ...args: any[]) {
      listeners[event]?.forEach((fn) => fn(...args));
    },
    // Allow tests to mutate state
    _setState(patch: Partial<MockAuthState>) {
      Object.assign(state, patch);
    },
  };

  return manager as any;
}

// ---------------------------------------------------------------------------
// token / record / isValid when not authenticated
// ---------------------------------------------------------------------------

describe('AuthStoreCompat — unauthenticated state', () => {
  let authManager: ReturnType<typeof makeMockAuthManager>;
  let store: AuthStoreCompat;

  beforeEach(() => {
    authManager = makeMockAuthManager();
    store = new AuthStoreCompat(authManager as unknown as AuthManager);
  });

  it('token returns empty string when not authenticated', () => {
    expect(store.token).toBe('');
  });

  it('record returns null when not authenticated', () => {
    expect(store.record).toBeNull();
  });

  it('isValid returns false when not authenticated', () => {
    expect(store.isValid).toBe(false);
  });

  it('model is an alias for record', () => {
    expect(store.model).toBe(store.record);
  });
});

// ---------------------------------------------------------------------------
// save() / clear()
// ---------------------------------------------------------------------------

describe('AuthStoreCompat — save and clear', () => {
  let authManager: ReturnType<typeof makeMockAuthManager>;
  let store: AuthStoreCompat;

  beforeEach(() => {
    authManager = makeMockAuthManager();
    store = new AuthStoreCompat(authManager as unknown as AuthManager);
  });

  it('save(token, record) → token returns the saved token', () => {
    const record = {
      id: 'u1',
      collectionId: 'users',
      collectionName: 'users',
      created: '',
      updated: '',
      email: 'test@test.com',
    };
    store.save('my-token', record);
    expect(store.token).toBe('my-token');
  });

  it('save(token, record) → record returns the saved record', () => {
    const record = {
      id: 'u1',
      collectionId: 'users',
      collectionName: 'users',
      created: '',
      updated: '',
      email: 'test@test.com',
    };
    store.save('my-token', record);
    expect(store.record).toEqual(record);
  });

  it('save(token) → isValid returns true', () => {
    store.save('some-token');
    expect(store.isValid).toBe(true);
  });

  it('clear() → token returns empty string', () => {
    store.save('my-token');
    store.clear();
    expect(store.token).toBe('');
  });

  it('clear() → record returns null', () => {
    store.save('my-token', { id: 'u1', collectionId: 'users', collectionName: 'users', created: '', updated: '' });
    store.clear();
    expect(store.record).toBeNull();
  });

  it('clear() → isValid returns false', () => {
    store.save('my-token');
    store.clear();
    expect(store.isValid).toBe(false);
  });

  it('clear() calls authManager.clear()', async () => {
    store.clear();
    // Give the async clear a tick to run
    await new Promise((r) => setTimeout(r, 0));
    expect(authManager.clear).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// onChange — event bridging
// ---------------------------------------------------------------------------

describe('AuthStoreCompat — onChange', () => {
  let authManager: ReturnType<typeof makeMockAuthManager>;
  let store: AuthStoreCompat;

  beforeEach(() => {
    authManager = makeMockAuthManager();
    store = new AuthStoreCompat(authManager as unknown as AuthManager);
  });

  it('onChange(cb) fires when auth:login is emitted', () => {
    const cb = vi.fn();
    store.onChange(cb);
    authManager._emit('auth:login', {});
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('onChange(cb) fires when auth:logout is emitted', () => {
    const cb = vi.fn();
    store.onChange(cb);
    authManager._emit('auth:logout');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('onChange(cb) fires when auth:refresh is emitted', () => {
    const cb = vi.fn();
    store.onChange(cb);
    authManager._emit('auth:refresh', {});
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('onChange(cb, true) fires immediately with current state', () => {
    const cb = vi.fn();
    store.onChange(cb, true);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('', null);
  });

  it('onChange returns an unsubscribe function', () => {
    const cb = vi.fn();
    const unsub = store.onChange(cb);
    unsub();
    authManager._emit('auth:login', {});
    expect(cb).not.toHaveBeenCalled();
  });

  it('save() fires onChange listeners', () => {
    const cb = vi.fn();
    store.onChange(cb);
    store.save('tok');
    expect(cb).toHaveBeenCalledWith('tok', null);
  });

  it('clear() fires onChange listeners', () => {
    store.save('tok');
    const cb = vi.fn();
    store.onChange(cb);
    store.clear();
    expect(cb).toHaveBeenCalledWith('', null);
  });
});

// ---------------------------------------------------------------------------
// isValid with authManager state
// ---------------------------------------------------------------------------

describe('AuthStoreCompat — isValid with authManager', () => {
  it('isValid returns true when authManager.isAuthenticated and no expiresAt', () => {
    const authManager = makeMockAuthManager({
      token: 'live-tok',
      isAuthenticated: true,
      expiresAt: null,
    });
    authManager.getState.mockReturnValue({
      token: 'live-tok',
      user: { id: 'u1' },
      isAuthenticated: true,
      expiresAt: null,
      refreshToken: null,
      account: null,
      tokenType: 'jwt',
    });
    const store = new AuthStoreCompat(authManager as unknown as AuthManager);
    expect(store.isValid).toBe(true);
  });

  it('isValid returns false when token is expired', () => {
    const pastDate = new Date(Date.now() - 1000).toISOString();
    const authManager = makeMockAuthManager({
      token: 'live-tok',
      isAuthenticated: true,
      expiresAt: pastDate,
    });
    authManager.getState.mockReturnValue({
      token: 'live-tok',
      user: { id: 'u1' },
      isAuthenticated: true,
      expiresAt: pastDate,
      refreshToken: null,
      account: null,
      tokenType: 'jwt',
    });
    const store = new AuthStoreCompat(authManager as unknown as AuthManager);
    expect(store.isValid).toBe(false);
  });

  it('isValid returns true when token is not yet expired', () => {
    const futureDate = new Date(Date.now() + 60_000).toISOString();
    const authManager = makeMockAuthManager({
      token: 'live-tok',
      isAuthenticated: true,
      expiresAt: futureDate,
    });
    authManager.getState.mockReturnValue({
      token: 'live-tok',
      user: { id: 'u1' },
      isAuthenticated: true,
      expiresAt: futureDate,
      refreshToken: null,
      account: null,
      tokenType: 'jwt',
    });
    const store = new AuthStoreCompat(authManager as unknown as AuthManager);
    expect(store.isValid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// loadFromCookie / exportToCookie
// ---------------------------------------------------------------------------

describe('AuthStoreCompat — cookies', () => {
  let authManager: ReturnType<typeof makeMockAuthManager>;
  let store: AuthStoreCompat;

  beforeEach(() => {
    authManager = makeMockAuthManager();
    store = new AuthStoreCompat(authManager as unknown as AuthManager);
  });

  it('loadFromCookie populates token from cookie string', () => {
    const record = { id: 'u1', collectionId: 'users', collectionName: 'users', created: '', updated: '' };
    const value = encodeURIComponent(JSON.stringify({ token: 'cookie-token', record }));
    store.loadFromCookie(`pb_auth=${value}`);
    expect(store.token).toBe('cookie-token');
  });

  it('loadFromCookie populates record from cookie string', () => {
    const record = { id: 'u1', collectionId: 'users', collectionName: 'users', created: '', updated: '' };
    const value = encodeURIComponent(JSON.stringify({ token: 'cookie-token', record }));
    store.loadFromCookie(`pb_auth=${value}`);
    expect(store.record).toEqual(record);
  });

  it('loadFromCookie does nothing when key is absent', () => {
    store.loadFromCookie('other_cookie=blah');
    expect(store.token).toBe('');
  });

  it('loadFromCookie does not throw on malformed cookie value', () => {
    expect(() => store.loadFromCookie('pb_auth=not-valid-json')).not.toThrow();
  });

  it('exportToCookie returns a valid cookie string containing the key', () => {
    store.save('my-token');
    const cookie = store.exportToCookie();
    expect(cookie).toContain('pb_auth=');
  });

  it('exportToCookie includes token in cookie value', () => {
    store.save('my-token');
    const cookie = store.exportToCookie();
    expect(cookie).toContain('my-token');
  });

  it('exportToCookie round-trips: export → loadFromCookie → same token', () => {
    store.save('round-trip-token');
    const cookie = store.exportToCookie();

    const store2 = new AuthStoreCompat(authManager as unknown as AuthManager);
    store2.loadFromCookie(cookie.split(';')[0]);
    expect(store2.token).toBe('round-trip-token');
  });

  it('loadFromCookie with custom key', () => {
    const value = encodeURIComponent(JSON.stringify({ token: 'custom-key-token', record: null }));
    store.loadFromCookie(`my_auth=${value}`, 'my_auth');
    expect(store.token).toBe('custom-key-token');
  });
});
