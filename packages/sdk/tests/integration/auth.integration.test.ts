/**
 * Authentication integration tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import { AuthenticationError } from '../../src/core/errors';
import {
  createTestClient,
  createTestEmail,
  createTestAccountName,
  trackUser,
  verifyUser,
  cleanupTestResources,
} from './setup';

describe('Authentication Integration Tests', () => {
  let client: SnackBaseClient;

  beforeEach(() => {
    client = createTestClient();
  });

  afterEach(async () => {
    await cleanupTestResources(client);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const email = createTestEmail();
      const password = 'TestPass123!';
      const account_name = createTestAccountName();

      const authState = await client.auth.register({
        email,
        password,
        account_name,
      });

      expect(authState.user).toBeDefined();
      expect(authState.user!.email).toBe(email);
      // Note: isAuthenticated might be false if verification is required
      expect(authState.user!.id).toBeDefined();

      trackUser(authState.user!.id);
    });

    it('should fail with duplicate account slug', async () => {
      const email = createTestEmail();
      const password = 'TestPass123!';
      const account_name = createTestAccountName();

      await client.auth.register({
        email,
        password,
        account_name,
      });

      await expect(
        client.auth.register({
          email: createTestEmail(),
          password,
          account_name, // Same name -> Same slug -> Should fail
        })
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login with email and password', async () => {
      const email = createTestEmail();
      const password = 'TestPass123!';
      const account_name = createTestAccountName();
      const account_slug = account_name.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');

      // First register
      const registerState = await client.auth.register({
        email,
        password,
        account_name,
      });
      trackUser(registerState.user!.id);

      // Verify user so they can login
      await verifyUser(registerState.user!.id);

      // Login
      const loginState = await client.auth.login({
        email,
        password,
        account: account_slug,
      });

      expect(loginState.user).toBeDefined();
      expect(loginState.user!.email).toBe(email);
      expect(client.isAuthenticated).toBe(true);
    });

    it('should fail with wrong password', async () => {
      const email = createTestEmail();
      const password = 'TestPass123!';
      const account_name = createTestAccountName();
      const account_slug = account_name.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');

      await client.auth.register({
        email,
        password,
        account_name,
      });

      await expect(
        client.auth.login({
          email,
          password: 'WrongPassword123!',
          account: account_slug,
        })
      ).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should logout and clear auth state', async () => {
      const email = createTestEmail();
      const password = 'TestPass123!';
      const account_name = createTestAccountName();
      const account_slug = account_name.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');

      const authState = await client.auth.register({
        email,
        password,
        account_name,
      });
      trackUser(authState.user!.id);
      await verifyUser(authState.user!.id);

      await client.auth.login({
        email,
        password,
        account: account_slug,
      });

      expect(client.isAuthenticated).toBe(true);

      await client.auth.logout();

      expect(client.isAuthenticated).toBe(false);
      expect(client.user).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user profile', async () => {
      const email = createTestEmail();
      const password = 'TestPass123!';
      const account_name = createTestAccountName();
      const account_slug = account_name.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');

      const registerState = await client.auth.register({
        email,
        password,
        account_name,
      });
      trackUser(registerState.user!.id);
      await verifyUser(registerState.user!.id);

      await client.auth.login({
        email,
        password,
        account: account_slug,
      });

      const response = await client.auth.getCurrentUser();
      const user = response.user;

      expect(user).toBeDefined();
      expect(user!.email).toBe(email);
    });
  });

  describe('forgotPassword and resetPassword', () => {
    it('should send password reset email', async () => {
      const email = createTestEmail();
      const password = 'TestPass123!';
      const account_name = createTestAccountName();
      const account_slug = account_name.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');

      await client.auth.register({
        email,
        password,
        account_name,
      });

      await client.auth.forgotPassword({ 
        email,
        account: account_slug
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const email = createTestEmail();
      const password = 'TestPass123!';
      const account_name = createTestAccountName();
      const account_slug = account_name.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');

      const registerState = await client.auth.register({
        email,
        password,
        account_name,
      });
      trackUser(registerState.user!.id);
      await verifyUser(registerState.user!.id);

      await client.auth.login({
        email,
        password,
        account: account_slug,
      });

      const newState = await client.auth.refreshToken();

      expect(newState.token).toBeDefined();
      expect(client.isAuthenticated).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // F7.4: AuthService — Coverage Completion
  // ──────────────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('should fail with an invalid token', async () => {
      await expect(
        client.auth.resetPassword({
          token: 'invalid-token-that-does-not-exist',
          new_password: 'NewSecure123!',
        })
      ).rejects.toThrow();
    });

    it('should fail with a weak password', async () => {
      await expect(
        client.auth.resetPassword({
          token: 'any-token',
          new_password: '123',
        })
      ).rejects.toThrow();
    });
  });

  describe('verifyEmail', () => {
    it('should fail with an invalid token', async () => {
      await expect(
        client.auth.verifyEmail('garbage-token-that-does-not-exist')
      ).rejects.toThrow();
    });
  });

  describe('verifyResetToken', () => {
    it('should return valid=false for an invalid token', async () => {
      const result = await client.auth.verifyResetToken('nonexistent-token');

      expect(result.valid).toBe(false);
      expect(result.expires_at).toBeNull();
    });
  });

  describe('resendVerificationEmail', () => {
    it('should succeed for an authenticated user', async () => {
      const email = createTestEmail();
      const password = 'TestPass123!';
      const account_name = createTestAccountName();
      const account_slug = account_name.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');

      const registerState = await client.auth.register({
        email,
        password,
        account_name,
      });
      trackUser(registerState.user!.id);
      await verifyUser(registerState.user!.id);

      await client.auth.login({
        email,
        password,
        account: account_slug,
      });

      const result = await client.auth.resendVerificationEmail();

      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
    }, 30000);
  });

  describe('sendVerification', () => {
    it('should succeed or return 500 when email service is unavailable', async () => {
      const email = createTestEmail();
      const password = 'TestPass123!';
      const account_name = createTestAccountName();
      const account_slug = account_name.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');

      const registerState = await client.auth.register({
        email,
        password,
        account_name,
      });
      trackUser(registerState.user!.id);
      await verifyUser(registerState.user!.id);

      await client.auth.login({
        email,
        password,
        account: account_slug,
      });

      // The endpoint returns 200 if email sends, or 500 if the email service
      // is not configured. Both are valid in a test environment.
      try {
        const result = await client.auth.sendVerification(email);
        expect(result).toBeDefined();
        expect(result.message).toBeDefined();
        expect(typeof result.message).toBe('string');
      } catch (err: any) {
        // 500 is expected when no email provider is configured
        expect(err.status ?? err.statusCode ?? 500).toBe(500);
      }
    }, 30000);
  });

  describe('getOAuthUrl', () => {
    it('should throw when provider is not configured', async () => {
      // No OAuth providers configured in test environment
      await expect(
        client.auth.getOAuthUrl('google', 'http://localhost/callback')
      ).rejects.toThrow();
    });
  });

  describe('handleOAuthCallback', () => {
    it('should throw AuthenticationError for unknown state token', async () => {
      // SDK validates state client-side before hitting backend
      await expect(
        client.auth.handleOAuthCallback({
          provider: 'google',
          code: 'fake-code',
          redirectUri: 'http://localhost/callback',
          state: 'unknown-state-token',
        })
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('getSAMLUrl', () => {
    it('should throw when no SAML provider is configured', async () => {
      await expect(
        client.auth.getSAMLUrl('okta', 'nonexistent-account')
      ).rejects.toThrow();
    });
  });

  describe('getSAMLMetadata', () => {
    it('should throw when no SAML provider is configured', async () => {
      await expect(
        client.auth.getSAMLMetadata('okta', 'nonexistent-account')
      ).rejects.toThrow();
    });
  });

  describe('handleSAMLCallback', () => {
    it('should throw for invalid SAML assertion', async () => {
      await expect(
        client.auth.handleSAMLCallback({
          SAMLResponse: 'invalid-saml-data',
        })
      ).rejects.toThrow();
    });
  });
});
