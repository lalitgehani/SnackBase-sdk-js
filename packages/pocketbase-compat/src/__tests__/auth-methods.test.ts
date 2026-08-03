import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordServiceCompat } from '../record-service.js';
import { ClientResponseError, NotSupportedError } from '../errors.js';
import type { SnackBaseClient } from '@snackbase/sdk';

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function makeMockSnackbase(authState: {
  token?: string | null;
  user?: any | null;
  isAuthenticated?: boolean;
} = {}): SnackBaseClient {
  const state = {
    token: authState.token ?? null,
    user: authState.user ?? null,
    isAuthenticated: authState.isAuthenticated ?? false,
    expiresAt: null,
    refreshToken: null,
    account: null,
    tokenType: 'jwt',
  };

  const auth = {
    login: vi.fn(),
    refreshToken: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    resendVerificationEmail: vi.fn(),
    verifyEmail: vi.fn(),
    getOAuthUrl: vi.fn(),
    handleOAuthCallback: vi.fn(),
  };

  const internalAuthManager = {
    getState: vi.fn(() => ({ ...state })),
    token: state.token,
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    // Allow tests to mutate the mock state
    _setState(patch: any) {
      Object.assign(state, patch);
      (internalAuthManager as any).token = state.token;
      (internalAuthManager as any).user = state.user;
      (internalAuthManager as any).isAuthenticated = state.isAuthenticated;
    },
  };

  return { auth, internalAuthManager } as unknown as SnackBaseClient;
}

function makeUser() {
  return {
    id: 'user-1',
    email: 'user@test.com',
    role: 'user',
    account_id: 'acc-1',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
    groups: [],
    last_login: null,
    token_type: 'jwt',
  };
}

// ---------------------------------------------------------------------------
// authWithPassword
// ---------------------------------------------------------------------------

describe('RecordServiceCompat.authWithPassword', () => {
  let snackbase: SnackBaseClient;
  let service: RecordServiceCompat;

  beforeEach(() => {
    snackbase = makeMockSnackbase();
    service = new RecordServiceCompat(snackbase, 'users');
  });

  it('calls snackbase.auth.login with email and password', async () => {
    const user = makeUser();
    (snackbase.auth.login as any).mockResolvedValue({ token: 'tok', user });
    (snackbase.internalAuthManager.getState as any).mockReturnValue({
      token: 'tok', user, isAuthenticated: true, expiresAt: null,
    });

    await service.authWithPassword('user@test.com', 'pass123');

    expect(snackbase.auth.login).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'pass123',
    });
  });

  it('returns { record, token } shape', async () => {
    const user = makeUser();
    (snackbase.auth.login as any).mockResolvedValue({ token: 'tok', user });
    (snackbase.internalAuthManager.getState as any).mockReturnValue({
      token: 'tok', user, isAuthenticated: true, expiresAt: null,
    });

    const result = await service.authWithPassword('user@test.com', 'pass123');

    expect(result.token).toBe('tok');
    expect(result.record).toBeDefined();
    expect(result.meta).toBeDefined();
  });

  it('record has id and email fields', async () => {
    const user = makeUser();
    (snackbase.auth.login as any).mockResolvedValue({ token: 'tok', user });
    (snackbase.internalAuthManager.getState as any).mockReturnValue({
      token: 'tok', user, isAuthenticated: true, expiresAt: null,
    });

    const { record } = await service.authWithPassword('user@test.com', 'pass123');
    expect(record.id).toBe('user-1');
    expect(record.email).toBe('user@test.com');
  });

  it('record has collectionName equal to the collection used', async () => {
    const user = makeUser();
    (snackbase.auth.login as any).mockResolvedValue({ token: 'tok', user });
    (snackbase.internalAuthManager.getState as any).mockReturnValue({
      token: 'tok', user, isAuthenticated: true, expiresAt: null,
    });

    const { record } = await service.authWithPassword('user@test.com', 'pass123');
    expect(record.collectionName).toBe('users');
    expect(record.collectionId).toBe('users');
  });

  it('record has PocketBase field names (created, updated — not created_at)', async () => {
    const user = makeUser();
    (snackbase.auth.login as any).mockResolvedValue({ token: 'tok', user });
    (snackbase.internalAuthManager.getState as any).mockReturnValue({
      token: 'tok', user, isAuthenticated: true, expiresAt: null,
    });

    const { record } = await service.authWithPassword('user@test.com', 'pass123');
    expect(record).toHaveProperty('created');
    expect(record).toHaveProperty('updated');
    expect(record).not.toHaveProperty('created_at');
    expect(record).not.toHaveProperty('updated_at');
  });

  it('throws ClientResponseError on login failure', async () => {
    (snackbase.auth.login as any).mockRejectedValue(
      Object.assign(new Error('Invalid credentials'), { status: 401, data: {} }),
    );

    await expect(service.authWithPassword('bad@test.com', 'wrong')).rejects.toBeInstanceOf(
      ClientResponseError,
    );
  });
});

// ---------------------------------------------------------------------------
// authRefresh
// ---------------------------------------------------------------------------

describe('RecordServiceCompat.authRefresh', () => {
  it('calls snackbase.auth.refreshToken()', async () => {
    const snackbase = makeMockSnackbase();
    const user = makeUser();
    (snackbase.auth.refreshToken as any).mockResolvedValue({ token: 'new-tok', user });
    (snackbase.internalAuthManager.getState as any).mockReturnValue({
      token: 'new-tok', user, isAuthenticated: true, expiresAt: null,
    });

    const service = new RecordServiceCompat(snackbase, 'users');
    await service.authRefresh();

    expect(snackbase.auth.refreshToken).toHaveBeenCalled();
  });

  it('returns RecordAuthResponse shape', async () => {
    const snackbase = makeMockSnackbase();
    const user = makeUser();
    (snackbase.auth.refreshToken as any).mockResolvedValue({ token: 'new-tok', user });
    (snackbase.internalAuthManager.getState as any).mockReturnValue({
      token: 'new-tok', user, isAuthenticated: true, expiresAt: null,
    });

    const service = new RecordServiceCompat(snackbase, 'users');
    const result = await service.authRefresh();

    expect(result.token).toBe('new-tok');
    expect(result.record).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// requestPasswordReset
// ---------------------------------------------------------------------------

describe('RecordServiceCompat.requestPasswordReset', () => {
  it('calls snackbase.auth.forgotPassword() with email', async () => {
    const snackbase = makeMockSnackbase();
    (snackbase.auth.forgotPassword as any).mockResolvedValue({ message: 'sent' });
    const service = new RecordServiceCompat(snackbase, 'users');

    await service.requestPasswordReset('user@test.com');

    expect(snackbase.auth.forgotPassword).toHaveBeenCalledWith({ email: 'user@test.com' });
  });

  it('returns true on success', async () => {
    const snackbase = makeMockSnackbase();
    (snackbase.auth.forgotPassword as any).mockResolvedValue({ message: 'sent' });
    const service = new RecordServiceCompat(snackbase, 'users');

    const result = await service.requestPasswordReset('user@test.com');
    expect(result).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// confirmPasswordReset
// ---------------------------------------------------------------------------

describe('RecordServiceCompat.confirmPasswordReset', () => {
  it('calls snackbase.auth.resetPassword() with token and new password', async () => {
    const snackbase = makeMockSnackbase();
    (snackbase.auth.resetPassword as any).mockResolvedValue({ message: 'ok' });
    const service = new RecordServiceCompat(snackbase, 'users');

    await service.confirmPasswordReset('reset-tok', 'newpass123', 'newpass123');

    expect(snackbase.auth.resetPassword).toHaveBeenCalledWith({
      token: 'reset-tok',
      new_password: 'newpass123',
    });
  });

  it('returns true on success', async () => {
    const snackbase = makeMockSnackbase();
    (snackbase.auth.resetPassword as any).mockResolvedValue({ message: 'ok' });
    const service = new RecordServiceCompat(snackbase, 'users');

    const result = await service.confirmPasswordReset('tok', 'pass', 'pass');
    expect(result).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// confirmVerification
// ---------------------------------------------------------------------------

describe('RecordServiceCompat.confirmVerification', () => {
  it('calls snackbase.auth.verifyEmail() with the token', async () => {
    const snackbase = makeMockSnackbase();
    (snackbase.auth.verifyEmail as any).mockResolvedValue({ message: 'verified' });
    const service = new RecordServiceCompat(snackbase, 'users');

    await service.confirmVerification('verify-tok');

    expect(snackbase.auth.verifyEmail).toHaveBeenCalledWith('verify-tok');
  });

  it('returns true on success', async () => {
    const snackbase = makeMockSnackbase();
    (snackbase.auth.verifyEmail as any).mockResolvedValue({ message: 'verified' });
    const service = new RecordServiceCompat(snackbase, 'users');

    const result = await service.confirmVerification('verify-tok');
    expect(result).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// requestVerification
// ---------------------------------------------------------------------------

describe('RecordServiceCompat.requestVerification', () => {
  it('calls snackbase.auth.resendVerificationEmail() when authenticated', async () => {
    const snackbase = makeMockSnackbase({ isAuthenticated: true, token: 'tok' });
    (snackbase.internalAuthManager.getState as any).mockReturnValue({
      token: 'tok', user: makeUser(), isAuthenticated: true, expiresAt: null,
    });
    (snackbase.auth.resendVerificationEmail as any).mockResolvedValue({ message: 'sent' });
    const service = new RecordServiceCompat(snackbase, 'users');

    const result = await service.requestVerification('user@test.com');
    expect(result).toBe(true);
    expect(snackbase.auth.resendVerificationEmail).toHaveBeenCalled();
  });

  it('throws ClientResponseError when not authenticated', async () => {
    const snackbase = makeMockSnackbase({ isAuthenticated: false });
    (snackbase.internalAuthManager.getState as any).mockReturnValue({
      token: null, user: null, isAuthenticated: false, expiresAt: null,
    });
    const service = new RecordServiceCompat(snackbase, 'users');

    await expect(service.requestVerification('user@test.com')).rejects.toBeInstanceOf(
      ClientResponseError,
    );
  });
});

// ---------------------------------------------------------------------------
// listAuthMethods
// ---------------------------------------------------------------------------

describe('RecordServiceCompat.listAuthMethods', () => {
  it('returns an object with password.enabled: true', async () => {
    const snackbase = makeMockSnackbase();
    const service = new RecordServiceCompat(snackbase, 'users');

    const methods = await service.listAuthMethods();
    expect(methods.password.enabled).toBe(true);
  });

  it('returns an object with otp.enabled: false', async () => {
    const snackbase = makeMockSnackbase();
    const service = new RecordServiceCompat(snackbase, 'users');

    const methods = await service.listAuthMethods();
    expect(methods.otp.enabled).toBe(false);
  });

  it('returns an object with mfa.enabled: false', async () => {
    const snackbase = makeMockSnackbase();
    const service = new RecordServiceCompat(snackbase, 'users');

    const methods = await service.listAuthMethods();
    expect(methods.mfa.enabled).toBe(false);
  });

  it('returns an object with oauth2.enabled: true', async () => {
    const snackbase = makeMockSnackbase();
    const service = new RecordServiceCompat(snackbase, 'users');

    const methods = await service.listAuthMethods();
    expect(methods.oauth2.enabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// authWithOAuth2 — partial support
// ---------------------------------------------------------------------------

describe('RecordServiceCompat.authWithOAuth2', () => {
  it('throws NotSupportedError for the popup-relay flow', async () => {
    const snackbase = makeMockSnackbase();
    (snackbase.auth.getOAuthUrl as any).mockRejectedValue(new Error('no server'));
    const service = new RecordServiceCompat(snackbase, 'users');

    await expect(
      service.authWithOAuth2({ provider: 'google', redirectUrl: 'http://localhost/cb' }),
    ).rejects.toBeInstanceOf(NotSupportedError);
  });

  it('fires urlCallback with the OAuth URL before throwing', async () => {
    const snackbase = makeMockSnackbase();
    (snackbase.auth.getOAuthUrl as any).mockResolvedValue({
      authorization_url: 'https://oauth.example.com/auth',
      state: 'abc',
      provider: 'google',
    });
    const service = new RecordServiceCompat(snackbase, 'users');

    const urlCallback = vi.fn();
    await expect(
      service.authWithOAuth2({ provider: 'google', redirectUrl: 'http://localhost/cb', urlCallback }),
    ).rejects.toBeInstanceOf(NotSupportedError);

    expect(urlCallback).toHaveBeenCalledWith('https://oauth.example.com/auth');
  });
});

// ---------------------------------------------------------------------------
// Unsupported auth methods throw NotSupportedError
// ---------------------------------------------------------------------------

describe('RecordServiceCompat — unsupported auth methods', () => {
  let service: RecordServiceCompat;

  beforeEach(() => {
    service = new RecordServiceCompat(makeMockSnackbase(), 'users');
  });

  it('requestEmailChange throws NotSupportedError', () => {
    expect(() => service.requestEmailChange()).toThrow(NotSupportedError);
  });

  it('confirmEmailChange throws NotSupportedError', () => {
    expect(() => service.confirmEmailChange()).toThrow(NotSupportedError);
  });

  it('requestOTP throws NotSupportedError', () => {
    expect(() => service.requestOTP()).toThrow(NotSupportedError);
  });

  it('authWithOTP throws NotSupportedError', () => {
    expect(() => service.authWithOTP()).toThrow(NotSupportedError);
  });

  it('impersonate throws NotSupportedError', () => {
    expect(() => service.impersonate()).toThrow(NotSupportedError);
  });
});
