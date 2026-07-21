import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useAuth } from './useAuth';
import { SnackBaseProvider } from '../SnackBaseContext';

describe('useAuth', () => {
  let client: any;
  let mockUnsubscribe: any;
  let authState: any;

  beforeEach(() => {
    mockUnsubscribe = vi.fn();
    authState = {
      user: null,
      account: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      expiresAt: null,
      tokenType: 'jwt',
    };
    client = {
      user: null,
      account: null,
      auth: {
        sendVerification: vi.fn(),
        verifyResetToken: vi.fn(),
        getOAuthUrl: vi.fn(),
        handleOAuthCallback: vi.fn(),
      },
      internalAuthManager: {
        token: null,
        refreshToken: null,
        getState: vi.fn(() => ({ ...authState })),
      },
      isAuthenticated: false,
      tokenType: 'jwt',
      on: vi.fn().mockReturnValue(mockUnsubscribe),
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      refreshToken: vi.fn(),
      getCurrentUser: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerificationEmail: vi.fn(),
      getSAMLUrl: vi.fn(),
      handleSAMLCallback: vi.fn(),
      getSAMLMetadata: vi.fn(),
    };

    Object.defineProperty(client, 'isSuperadmin', {
      get: vi.fn().mockReturnValue(false),
      configurable: true,
    });
    Object.defineProperty(client, 'isApiKeySession', {
      get: vi.fn().mockReturnValue(false),
      configurable: true,
    });
    Object.defineProperty(client, 'isPersonalTokenSession', {
      get: vi.fn().mockReturnValue(false),
      configurable: true,
    });
    Object.defineProperty(client, 'isOAuthSession', {
      get: vi.fn().mockReturnValue(false),
      configurable: true,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SnackBaseProvider client={client}>{children}</SnackBaseProvider>
  );

  it('should return initial state from AuthManager.getState including expiresAt', () => {
    authState.expiresAt = '2026-12-01T00:00:00.000Z';
    authState.isAuthenticated = true;
    authState.token = 'tok';
    client.internalAuthManager.getState.mockReturnValue({ ...authState });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.expiresAt).toBe('2026-12-01T00:00:00.000Z');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('tok');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should subscribe to auth events including auth:error', () => {
    renderHook(() => useAuth(), { wrapper });

    expect(client.on).toHaveBeenCalledWith('auth:login', expect.any(Function));
    expect(client.on).toHaveBeenCalledWith('auth:refresh', expect.any(Function));
    expect(client.on).toHaveBeenCalledWith('auth:logout', expect.any(Function));
    expect(client.on).toHaveBeenCalledWith('auth:error', expect.any(Function));
  });

  it('should update expiresAt from login event payload (not hard-coded null)', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const loginHandler = client.on.mock.calls.find((call: any) => call[0] === 'auth:login')[1];
    const newState = {
      user: { id: '123', email: 'test@example.com' },
      account: null,
      isAuthenticated: true,
      token: 'jwt-token',
      refreshToken: 'rt',
      expiresAt: '2027-01-01T12:00:00.000Z',
      tokenType: 'jwt',
    };

    act(() => {
      loginHandler(newState);
    });

    expect(result.current.user).toEqual(newState.user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.expiresAt).toBe('2027-01-01T12:00:00.000Z');
    expect(result.current.error).toBeNull();
  });

  it('should clear expiresAt on logout', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const loginHandler = client.on.mock.calls.find((call: any) => call[0] === 'auth:login')[1];
    const logoutHandler = client.on.mock.calls.find((call: any) => call[0] === 'auth:logout')[1];

    act(() => {
      loginHandler({
        user: { id: '1' },
        account: null,
        token: 't',
        refreshToken: 'r',
        isAuthenticated: true,
        expiresAt: '2027-01-01T00:00:00.000Z',
        tokenType: 'jwt',
      });
    });
    expect(result.current.expiresAt).toBe('2027-01-01T00:00:00.000Z');

    act(() => {
      logoutHandler();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.expiresAt).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should surface auth:error and clear on successful login', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const errorHandler = client.on.mock.calls.find((call: any) => call[0] === 'auth:error')[1];
    const loginHandler = client.on.mock.calls.find((call: any) => call[0] === 'auth:login')[1];

    act(() => {
      errorHandler(new Error('bad credentials'));
    });
    expect(result.current.error?.message).toBe('bad credentials');

    act(() => {
      loginHandler({
        user: { id: '1' },
        account: null,
        token: 't',
        refreshToken: null,
        isAuthenticated: true,
        expiresAt: '2027-06-01T00:00:00.000Z',
        tokenType: 'jwt',
      });
    });
    expect(result.current.error).toBeNull();
  });

  it('should unsubscribe all four auth listeners on unmount', () => {
    const { unmount } = renderHook(() => useAuth(), { wrapper });
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(4);
  });

  it('should call client.login when login is called', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const credentials = { email: 'test@example.com', password: 'password' };

    await act(async () => {
      await result.current.login(credentials);
    });

    expect(client.login).toHaveBeenCalledWith(credentials);
  });

  it('should delegate refreshAccessToken, verifyEmail, getOAuthUrl, handleOAuthCallback', async () => {
    client.refreshToken.mockResolvedValue({ token: 'new' });
    client.verifyEmail.mockResolvedValue({ message: 'ok' });
    client.auth.getOAuthUrl.mockResolvedValue({ authorization_url: 'https://oauth.example' });
    client.auth.handleOAuthCallback.mockResolvedValue({ token: 'oauth' });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.refreshAccessToken();
      await result.current.verifyEmail('tok');
      await result.current.getOAuthUrl('google', 'http://localhost/cb');
      await result.current.handleOAuthCallback({
        provider: 'google',
        code: 'c',
        redirectUri: 'http://localhost/cb',
        state: 's',
      });
    });

    expect(client.refreshToken).toHaveBeenCalled();
    expect(result.current.refreshToken).toBeNull(); // AuthState field, not overwritten by action
    expect(client.verifyEmail).toHaveBeenCalledWith('tok');
    expect(client.auth.getOAuthUrl).toHaveBeenCalledWith('google', 'http://localhost/cb', undefined);
    expect(client.auth.handleOAuthCallback).toHaveBeenCalled();
  });

  it('should reflect superadmin status from client', () => {
    const spy = Object.getOwnPropertyDescriptor(client, 'isSuperadmin')?.get as any;
    spy.mockReturnValue(true);
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isSuperadmin).toBe(true);
  });
});
