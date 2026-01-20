import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth-service';
import { HttpClient, HttpResponse } from './http-client';
import { AuthManager } from './auth';
import { MemoryStorage } from './storage';
import { User, Account, AuthResponse } from '../types/auth';

describe('AuthService', () => {
  let httpClient: HttpClient;
  let authManager: AuthManager;
  let authService: AuthService;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'user',
    groups: [],
    is_active: true,
    created_at: new Date().toISOString(),
    last_login: null,
  };

  const mockAccount: Account = {
    id: 'acc-1',
    slug: 'test-acc',
    name: 'Test Account',
    created_at: new Date().toISOString(),
  };

  const mockAuthResponse: AuthResponse = {
    user: mockUser,
    account: mockAccount,
    token: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  };

  beforeEach(() => {
    httpClient = new HttpClient({ baseUrl: 'https://api.example.com' });
    authManager = new AuthManager({ storage: new MemoryStorage() });
    authService = new AuthService(httpClient, authManager);
  });

  describe('login', () => {
    it('should authenticate user and update state', async () => {
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: mockAuthResponse,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const credentials = { account: 'test-acc', email: 'test@example.com', password: 'password' };
      const result = await authService.login(credentials);

      expect(postSpy).toHaveBeenCalledWith('/api/v1/auth/login', credentials);
      expect(result).toEqual(mockAuthResponse);
      expect(authManager.isAuthenticated).toBe(true);
      expect(authManager.token).toBe('access-token');
      expect(authManager.user).toEqual(mockUser);
    });
  });

  describe('register', () => {
    it('should register user and return response data', async () => {
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: { user: mockUser, account: mockAccount },
        status: 201,
        headers: new Headers(),
        request: {} as any,
      });

      const data = { email: 'test@example.com', password: 'password', accountName: 'Test Account' };
      const result = await authService.register(data);

      expect(postSpy).toHaveBeenCalledWith('/api/v1/auth/register', data);
      expect(result.user).toEqual(mockUser);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens and update state', async () => {
      await authManager.setState({ refreshToken: 'old-refresh-token' });

      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: { ...mockAuthResponse, token: 'new-access-token' },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await authService.refreshToken();

      expect(postSpy).toHaveBeenCalledWith('/api/v1/auth/refresh', { refreshToken: 'old-refresh-token' });
      expect(result.token).toBe('new-access-token');
      expect(authManager.token).toBe('new-access-token');
    });

    it('should throw error if no refresh token available', async () => {
      await expect(authService.refreshToken()).rejects.toThrow('No refresh token available');
    });
  });

  describe('logout', () => {
    it('should clear state and persist to storage', async () => {
      await authManager.setState({ user: mockUser, token: 'token' });
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: {},
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await authService.logout();

      expect(postSpy).toHaveBeenCalledWith('/api/v1/auth/logout', {});
      expect(result.success).toBe(true);
      expect(authManager.isAuthenticated).toBe(false);
      expect(authManager.token).toBeNull();
    });

    it('should clear state even if server logout fails', async () => {
      await authManager.setState({ user: mockUser, token: 'token' });
      vi.spyOn(httpClient, 'post').mockRejectedValue(new Error('Logout failed'));

      const result = await authService.logout();

      expect(result.success).toBe(true);
      expect(authManager.isAuthenticated).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user and update state', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: { user: mockUser, account: mockAccount },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await authService.getCurrentUser();

      expect(getSpy).toHaveBeenCalledWith('/api/v1/auth/me');
      expect(result.user).toEqual(mockUser);
      expect(authManager.user).toEqual(mockUser);
    });
  });

  describe('password and email methods', () => {
    it('forgotPassword should call correct endpoint', async () => {
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: { message: 'sent' },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await authService.forgotPassword({ account: 'acc', email: 'test@example.com' });
      expect(postSpy).toHaveBeenCalledWith('/api/v1/auth/forgot-password', { account: 'acc', email: 'test@example.com' });
      expect(result.message).toBe('sent');
    });

    it('resetPassword should call correct endpoint', async () => {
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: { message: 'success' },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await authService.resetPassword({ token: 'tok', newPassword: 'pass' });
      expect(postSpy).toHaveBeenCalledWith('/api/v1/auth/reset-password', { token: 'tok', newPassword: 'pass' });
      expect(result.message).toBe('success');
    });

    it('verifyEmail should call correct endpoint', async () => {
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: { message: 'verified' },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await authService.verifyEmail('tok');
      expect(postSpy).toHaveBeenCalledWith('/api/v1/auth/verify-email', { token: 'tok' });
      expect(result.message).toBe('verified');
    });

    it('resendVerificationEmail should call correct endpoint', async () => {
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: { message: 'resent' },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await authService.resendVerificationEmail();
      expect(postSpy).toHaveBeenCalledWith('/api/v1/auth/resend-verification', {});
      expect(result.message).toBe('resent');
    });
  });

  describe('OAuth methods', () => {
    it('getOAuthUrl should generate URL and store state token', async () => {
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: { url: 'https://oauth.provider.com/auth', state: 'state-123' },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await authService.getOAuthUrl('google', 'https://app.com/callback');

      expect(postSpy).toHaveBeenCalledWith('/api/v1/auth/oauth/google/authorize', {
        redirectUri: 'https://app.com/callback',
        state: undefined,
      });
      expect(result.url).toBe('https://oauth.provider.com/auth');
      expect(result.state).toBe('state-123');
    });

    it('handleOAuthCallback should authenticate user with valid state', async () => {
      // Setup state first
      vi.spyOn(httpClient, 'post').mockResolvedValueOnce({
        data: { url: '...', state: 'state-123' },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });
      await authService.getOAuthUrl('google', 'https://app.com/callback');

      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: { ...mockAuthResponse, isNewUser: false, isNewAccount: false },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await authService.handleOAuthCallback({
        provider: 'google',
        code: 'auth-code',
        redirectUri: 'https://app.com/callback',
        state: 'state-123',
      });

      expect(postSpy).toHaveBeenCalledWith('/api/v1/auth/oauth/google/callback', {
        code: 'auth-code',
        redirectUri: 'https://app.com/callback',
        state: 'state-123',
      });
      expect(result.user).toEqual(mockUser);
      expect(authManager.isAuthenticated).toBe(true);
    });

    it('handleOAuthCallback should throw error for invalid state', async () => {
      await expect(authService.handleOAuthCallback({
        provider: 'google',
        code: 'auth-code',
        redirectUri: 'https://app.com/callback',
        state: 'invalid-state',
      })).rejects.toThrow('Invalid or expired state token');
    });

    it('handleOAuthCallback should throw error for expired state', async () => {
      vi.useFakeTimers();
      
      vi.spyOn(httpClient, 'post').mockResolvedValueOnce({
        data: { url: '...', state: 'state-123' },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });
      await authService.getOAuthUrl('google', 'https://app.com/callback');

      // Advance time by 11 minutes
      vi.advanceTimersByTime(11 * 60 * 1000);

      await expect(authService.handleOAuthCallback({
        provider: 'google',
        code: 'auth-code',
        redirectUri: 'https://app.com/callback',
        state: 'state-123',
      })).rejects.toThrow('Invalid or expired state token');

      vi.useRealTimers();
    });
  });

  describe('SAML methods', () => {
    it('getSAMLUrl should generate URL with correct params', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: { url: 'https://idp.com/sso' },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await authService.getSAMLUrl('okta', 'test-acc', 'state-123');

      expect(getSpy).toHaveBeenCalledWith('/api/v1/auth/saml/sso', {
        params: {
          provider: 'okta',
          account: 'test-acc',
          relayState: 'state-123',
        },
      });
      expect(result.url).toBe('https://idp.com/sso');
    });

    it('handleSAMLCallback should authenticate user', async () => {
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: { ...mockAuthResponse, isNewUser: false, isNewAccount: false },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const params = { SAMLResponse: 'base64-xml', relayState: 'state-123' };
      const result = await authService.handleSAMLCallback(params);

      expect(postSpy).toHaveBeenCalledWith('/api/v1/auth/saml/acs', params);
      expect(result.user).toEqual(mockUser);
      expect(authManager.isAuthenticated).toBe(true);
      expect(authManager.token).toBe('access-token');
    });

    it('getSAMLMetadata should fetch metadata XML', async () => {
      const mockMetadata = '<XML>metadata</XML>';
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockMetadata,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await authService.getSAMLMetadata('okta', 'test-acc');

      expect(getSpy).toHaveBeenCalledWith('/api/v1/auth/saml/metadata', {
        params: {
          provider: 'okta',
          account: 'test-acc',
        },
      });
      expect(result).toBe(mockMetadata);
    });
  });
});
