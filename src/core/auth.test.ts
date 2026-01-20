import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthManager } from './auth';
import { MemoryStorage } from './storage';
import { User, AuthState } from '../types/auth';

describe('AuthManager', () => {
  let storage: MemoryStorage;
  let authManager: AuthManager;
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    role: 'user',
    groups: [],
    is_active: true,
    created_at: new Date().toISOString(),
    last_login: null
  };

  beforeEach(() => {
    storage = new MemoryStorage();
    authManager = new AuthManager({ storage });
  });

  it('should initialize with default state', () => {
    const state = authManager.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('should update state and persist to storage', async () => {
    await authManager.setState({
      user: mockUser,
      token: 'mock-token'
    });

    expect(authManager.isAuthenticated).toBe(true);
    expect(authManager.user).toEqual(mockUser);
    expect(authManager.token).toBe('mock-token');

    const storedState = JSON.parse(storage.getItem('sb_auth_state') || '{}');
    expect(storedState.token).toBe('mock-token');
    expect(storedState.user.id).toBe('1');
  });

  it('should clear state on logout', async () => {
    await authManager.setState({
      user: mockUser,
      token: 'mock-token'
    });

    await authManager.clear();

    expect(authManager.isAuthenticated).toBe(false);
    expect(authManager.user).toBeNull();
    expect(storage.getItem('sb_auth_state')).toBeNull();
  });

  it('should emit events on login and logout', async () => {
    const loginSpy = vi.fn();
    const logoutSpy = vi.fn();

    authManager.on('auth:login', loginSpy);
    authManager.on('auth:logout', logoutSpy);

    await authManager.setState({
      user: mockUser,
      token: 'mock-token'
    });
    expect(loginSpy).toHaveBeenCalledWith(expect.objectContaining({
      isAuthenticated: true,
      token: 'mock-token'
    }));

    await authManager.clear();
    expect(logoutSpy).toHaveBeenCalled();
  });

  it('should hydrate state from storage on initialization', async () => {
    const savedState: Partial<AuthState> = {
      user: mockUser,
      token: 'saved-token'
    };
    storage.setItem('sb_auth_state', JSON.stringify(savedState));

    const newAuthManager = new AuthManager({ storage });
    await newAuthManager.initialize();

    expect(newAuthManager.isAuthenticated).toBe(true);
    expect(newAuthManager.token).toBe('saved-token');
    expect(newAuthManager.user).toEqual(mockUser);
  });

  it('should clear expired sessions on initialization', async () => {
    const pastDate = new Date(Date.now() - 1000).toISOString();
    const expiredState: Partial<AuthState> = {
      user: mockUser,
      token: 'expired-token',
      expiresAt: pastDate
    };
    storage.setItem('sb_auth_state', JSON.stringify(expiredState));

    const newAuthManager = new AuthManager({ storage });
    await newAuthManager.initialize();

    expect(newAuthManager.isAuthenticated).toBe(false);
    expect(newAuthManager.token).toBeNull();
  });
});
