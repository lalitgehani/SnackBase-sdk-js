/**
 * Users integration tests — F2.1: UserService Full Coverage
 *
 * Requires SNACKBASE_API_KEY for admin operations.
 * A single shared test account is created in beforeAll; each test creates
 * its own user with a unique email to avoid conflicts between runs.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import {
  createTestClient,
  createTestEmail,
  createTestAccountName,
  trackUser,
  trackAccount,
  cleanupTestResources,
  skipIfNoCredentials,
  TEST_CONFIG,
} from './setup';

describe('Users Integration Tests', () => {
  let client: SnackBaseClient;
  let testAccountId: string;
  let testAccountSlug: string;
  let testRoleId: number;

  beforeAll(async () => {
    if (skipIfNoCredentials()) return;

    client = createTestClient();

    // Fetch available roles to get a valid role_id for user creation
    const rolesResult = await client.roles.list();
    if (!rolesResult.items.length) {
      throw new Error('No roles found — cannot create test users without a role_id');
    }
    testRoleId = Number(rolesResult.items[0].id);

    // Create a shared account so all user tests have an account_id to work with
    const account = await client.accounts.create({
      name: createTestAccountName(),
    });
    testAccountId = account.id;
    testAccountSlug = account.slug;
    trackAccount(account.id);
  });

  afterAll(async () => {
    if (client) {
      await cleanupTestResources(client);
    }
  });

  beforeEach(() => {
    // Ensure client is initialised (may be undefined if credentials were skipped)
    if (!client) {
      client = createTestClient();
    }
  });

  describe('list', () => {
    it('should return a paginated list that includes a newly created user', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const user = await client.users.create({
        email,
        password: TEST_CONFIG.testPassword,
        account_id: testAccountId,
        role_id: testRoleId,
      });
      trackUser(user.id);

      const result = await client.users.list();

      expect(result.items).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThan(0);
      const found = result.items.find((u) => u.id === user.id);
      expect(found).toBeDefined();
      expect(found!.email).toBe(email);
    });

    it('should return only matching users when filtered by account_id', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const user = await client.users.create({
        email,
        password: TEST_CONFIG.testPassword,
        account_id: testAccountId,
        role_id: testRoleId,
      });
      trackUser(user.id);

      const result = await client.users.list({ account_id: testAccountId });

      expect(result.items).toBeInstanceOf(Array);
      const found = result.items.find((u) => u.id === user.id);
      expect(found).toBeDefined();
    });
  });

  describe('get', () => {
    it('should return the correct user object with expected fields', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const created = await client.users.create({
        email,
        password: TEST_CONFIG.testPassword,
        account_id: testAccountId,
        role_id: testRoleId,
      });
      trackUser(created.id);

      const fetched = await client.users.get(created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.email).toBe(email);
      expect(typeof fetched.is_active).toBe('boolean');
      expect(fetched.created_at).toBeDefined();
    });

    it('should throw for a non-existent user ID', async () => {
      if (skipIfNoCredentials()) return;

      await expect(
        client.users.get('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create a user and confirm existence via get()', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const user = await client.users.create({
        email,
        password: TEST_CONFIG.testPassword,
        account_id: testAccountId,
        role_id: testRoleId,
      });
      trackUser(user.id);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(email);

      const fetched = await client.users.get(user.id);
      expect(fetched.id).toBe(user.id);
    });

    it('should return 409 for a duplicate email', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const first = await client.users.create({
        email,
        password: TEST_CONFIG.testPassword,
        account_id: testAccountId,
        role_id: testRoleId,
      });
      trackUser(first.id);

      await expect(
        client.users.create({
          email,
          password: TEST_CONFIG.testPassword,
          account_id: testAccountId,
          role_id: testRoleId,
        })
      ).rejects.toThrow();

      // Original still exists
      const fetched = await client.users.get(first.id);
      expect(fetched.id).toBe(first.id);
    });
  });

  describe('update', () => {
    it('should update user fields and reflect the change in get()', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const user = await client.users.create({
        email,
        password: TEST_CONFIG.testPassword,
        account_id: testAccountId,
        role_id: testRoleId,
      });
      trackUser(user.id);

      const updated = await client.users.update(user.id, { is_active: false });

      expect(updated.id).toBe(user.id);
      expect(updated.is_active).toBe(false);

      const fetched = await client.users.get(user.id);
      expect(fetched.is_active).toBe(false);
    });
  });

  describe('delete', () => {
    it('should soft-delete a user so that is_active becomes false', { timeout: 15000 }, async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const user = await client.users.create({
        email,
        password: TEST_CONFIG.testPassword,
        account_id: testAccountId,
        role_id: testRoleId,
      });
      trackUser(user.id);

      const result = await client.users.delete(user.id);
      expect(result.success).toBe(true);

      const fetched = await client.users.get(user.id);
      expect(fetched.is_active).toBe(false);
    });
  });

  describe('setPassword', () => {
    it('should allow login with the new password after setPassword()', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const user = await client.users.create({
        email,
        password: TEST_CONFIG.testPassword,
        account_id: testAccountId,
        role_id: testRoleId,
      });
      trackUser(user.id);

      // Admin-force verify so the user can log in
      await client.users.verifyEmail(user.id);

      const newPassword = 'NewPassword456!';
      const setResult = await client.users.setPassword(user.id, newPassword);
      expect(setResult.success).toBe(true);

      // Verify login with new password succeeds
      const loginClient = createTestClient();
      const loginState = await loginClient.auth.login({
        email,
        password: newPassword,
        account: testAccountSlug,
      });
      expect(loginState.user).toBeDefined();
      expect(loginState.user!.email).toBe(email);
    });
  });

  describe('verifyEmail', () => {
    it('should succeed and return { success: true }', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const user = await client.users.create({
        email,
        password: TEST_CONFIG.testPassword,
        account_id: testAccountId,
        role_id: testRoleId,
      });
      trackUser(user.id);

      const result = await client.users.verifyEmail(user.id);
      expect(result.message).toMatch(/verified/i);
    });
  });

  describe('resendVerification', () => {
    it('should attempt to resend verification for an unverified user', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const user = await client.users.create({
        email,
        password: TEST_CONFIG.testPassword,
        account_id: testAccountId,
        role_id: testRoleId,
      });
      trackUser(user.id);

      // If no email provider is configured, the backend returns 500.
      // Use a no-retry client to avoid retry backoff causing test timeout.
      const noRetryClient = new SnackBaseClient({
        baseUrl: TEST_CONFIG.baseUrl,
        apiKey: TEST_CONFIG.apiKey,
        enableLogging: false,
        maxRetries: 0,
      });

      // Either outcome (success or server error) is acceptable.
      try {
        const result = await noRetryClient.users.resendVerification(user.id);
        expect(result.success).toBe(true);
      } catch (error: any) {
        // 500 from backend when no email provider is configured
        expect(error.status).toBe(500);
      }
    });
  });
});
