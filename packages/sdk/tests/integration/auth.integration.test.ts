/**
 * Authentication integration tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
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
});
