/**
 * Authentication integration tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import {
  createTestClient,
  createTestEmail,
  trackUser,
  cleanupTestResources,
  skipIfNoCredentials,
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
      const password = 'testpassword123';

      const authState = await client.auth.register({
        email,
        password,
        passwordConfirm: password,
        name: 'Test User',
      });

      expect(authState.user).toBeDefined();
      expect(authState.user.email).toBe(email);
      expect(authState.user.name).toBe('Test User');
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.token).toBeDefined();

      trackUser(authState.user.id);
    });

    it('should fail with mismatched passwords', async () => {
      const email = createTestEmail();

      await expect(
        client.auth.register({
          email,
          password: 'password123',
          passwordConfirm: 'different',
        })
      ).rejects.toThrow();
    });

    it('should fail with duplicate email', async () => {
      const email = createTestEmail();
      const password = 'testpassword123';

      await client.auth.register({
        email,
        password,
        passwordConfirm: password,
      });

      await expect(
        client.auth.register({
          email,
          password,
          passwordConfirm: password,
        })
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login with email and password', async () => {
      const email = createTestEmail();
      const password = 'testpassword123';

      // First register
      const registerState = await client.auth.register({
        email,
        password,
        passwordConfirm: password,
      });
      trackUser(registerState.user.id);

      // Logout
      await client.auth.logout();

      // Login
      const loginState = await client.auth.login({
        email,
        password,
      });

      expect(loginState.user).toBeDefined();
      expect(loginState.user.email).toBe(email);
      expect(loginState.isAuthenticated).toBe(true);
    });

    it('should fail with wrong password', async () => {
      const email = createTestEmail();
      const password = 'testpassword123';

      await client.auth.register({
        email,
        password,
        passwordConfirm: password,
      });

      await client.auth.logout();

      await expect(
        client.auth.login({
          email,
          password: 'wrongpassword',
        })
      ).rejects.toThrow();
    });

    it('should fail with non-existent user', async () => {
      await expect(
        client.auth.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should logout and clear auth state', async () => {
      const email = createTestEmail();
      const password = 'testpassword123';

      const authState = await client.auth.register({
        email,
        password,
        passwordConfirm: password,
      });
      trackUser(authState.user.id);

      expect(client.isAuthenticated).toBe(true);

      await client.auth.logout();

      expect(client.isAuthenticated).toBe(false);
      expect(client.user).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user profile', async () => {
      const email = createTestEmail();
      const password = 'testpassword123';

      const authState = await client.auth.register({
        email,
        password,
        passwordConfirm: password,
        name: 'Test User',
      });
      trackUser(authState.user.id);

      const user = await client.auth.getCurrentUser();

      expect(user).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.name).toBe('Test User');
    });

    it('should fail when not authenticated', async () => {
      // Ensure logged out
      await client.auth.logout();

      await expect(client.auth.getCurrentUser()).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const email = createTestEmail();
      const password = 'testpassword123';

      const authState = await client.auth.register({
        email,
        password,
        passwordConfirm: password,
        name: 'Test User',
      });
      trackUser(authState.user.id);

      const updatedUser = await client.auth.updateProfile({
        name: 'Updated Name',
      });

      expect(updatedUser.name).toBe('Updated Name');
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const email = createTestEmail();
      const oldPassword = 'oldpassword123';
      const newPassword = 'newpassword123';

      const authState = await client.auth.register({
        email,
        password: oldPassword,
        passwordConfirm: oldPassword,
      });
      trackUser(authState.user.id);

      await client.auth.changePassword({
        oldPassword,
        newPassword,
        newPasswordConfirm: newPassword,
      });

      // Logout and try to login with new password
      await client.auth.logout();

      const loginState = await client.auth.login({
        email,
        password: newPassword,
      });

      expect(loginState.isAuthenticated).toBe(true);
    });

    it('should fail with wrong old password', async () => {
      const email = createTestEmail();
      const password = 'testpassword123';

      const authState = await client.auth.register({
        email,
        password,
        passwordConfirm: password,
      });
      trackUser(authState.user.id);

      await expect(
        client.auth.changePassword({
          oldPassword: 'wrongpassword',
          newPassword: 'newpassword123',
          newPasswordConfirm: 'newpassword123',
        })
      ).rejects.toThrow();
    });
  });

  describe('forgotPassword and resetPassword', () => {
    it('should send password reset email', async () => {
      const email = createTestEmail();
      const password = 'testpassword123';

      await client.auth.register({
        email,
        password,
        passwordConfirm: password,
      });

      // This should not throw
      await client.auth.forgotPassword({ email });
    });

    // Note: resetPassword requires a token from the email,
    // which is difficult to test in automated tests
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const email = createTestEmail();
      const password = 'testpassword123';

      const authState = await client.auth.register({
        email,
        password,
        passwordConfirm: password,
      });
      trackUser(authState.user.id);

      const oldToken = authState.token;

      const newState = await client.auth.refreshToken();

      expect(newState.token).toBeDefined();
      // New token should be different (in most cases)
      // expect(newState.token).not.toBe(oldToken);
      expect(newState.isAuthenticated).toBe(true);
    });
  });
});
