/**
 * Accounts integration tests — F2.2: AccountService Full Coverage
 *
 * Requires SNACKBASE_API_KEY for admin operations.
 * Each test creates its own account with a unique name to avoid conflicts.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import {
  createTestClient,
  createTestAccountName,
  createTestEmail,
  trackAccount,
  trackUser,
  cleanupTestResources,
  skipIfNoCredentials,
  TEST_CONFIG,
} from './setup';

describe('Accounts Integration Tests', () => {
  let client: SnackBaseClient;
  let testRoleId: number;

  beforeAll(async () => {
    if (skipIfNoCredentials()) return;

    client = createTestClient();

    // Fetch a role_id for user creation in getUsers test
    const rolesResult = await client.roles.list();
    if (!rolesResult.items.length) {
      throw new Error('No roles found');
    }
    testRoleId = Number(rolesResult.items[0].id);
  });

  beforeEach(() => {
    if (!client) {
      client = createTestClient();
    }
  });

  afterAll(async () => {
    await cleanupTestResources(client);
  });

  describe('list', () => {
    it('should return an account list that includes a newly created account', async () => {
      if (skipIfNoCredentials()) return;

      const account = await client.accounts.create({
        name: createTestAccountName(),
      });
      trackAccount(account.id);

      const result = await client.accounts.list();

      expect(result.items).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThan(0);
      const found = result.items.find((a) => a.id === account.id);
      expect(found).toBeDefined();
      expect(found!.name).toBe(account.name);
    });

    it('should have account_code matching the XX#### format', async () => {
      if (skipIfNoCredentials()) return;

      const account = await client.accounts.create({
        name: createTestAccountName(),
      });
      trackAccount(account.id);

      expect(account.account_code).toMatch(/^[A-Z]{2}\d{4}$/);
    });
  });

  describe('get', () => {
    it('should return the correct account object with all expected fields', async () => {
      if (skipIfNoCredentials()) return;

      const name = createTestAccountName();
      const created = await client.accounts.create({ name });
      trackAccount(created.id);

      const fetched = await client.accounts.get(created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe(name);
      expect(fetched.account_code).toMatch(/^[A-Z]{2}\d{4}$/);
      expect(fetched.slug).toBeDefined();
      expect(fetched.created_at).toBeDefined();
    });

    it('should throw for a non-existent account ID', async () => {
      if (skipIfNoCredentials()) return;

      await expect(
        client.accounts.get('11111111-1111-1111-1111-111111111111')
      ).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create an account and confirm existence via get()', async () => {
      if (skipIfNoCredentials()) return;

      const name = createTestAccountName();
      const account = await client.accounts.create({ name });
      trackAccount(account.id);

      expect(account.id).toBeDefined();
      expect(account.name).toBe(name);
      expect(account.slug).toBeDefined();
      expect(account.account_code).toMatch(/^[A-Z]{2}\d{4}$/);

      const fetched = await client.accounts.get(account.id);
      expect(fetched.id).toBe(account.id);
    });

    it('should return 409 for a duplicate slug', async () => {
      if (skipIfNoCredentials()) return;

      const slug = `testslug${Date.now()}`;
      const first = await client.accounts.create({
        name: createTestAccountName(),
        slug,
      });
      trackAccount(first.id);

      await expect(
        client.accounts.create({
          name: createTestAccountName(),
          slug,
        })
      ).rejects.toThrow();

      // Original still exists
      const fetched = await client.accounts.get(first.id);
      expect(fetched.id).toBe(first.id);
    });
  });

  describe('update', () => {
    it('should update the account name and reflect it in get()', async () => {
      if (skipIfNoCredentials()) return;

      const account = await client.accounts.create({
        name: createTestAccountName(),
      });
      trackAccount(account.id);

      const newName = createTestAccountName();
      const updated = await client.accounts.update(account.id, { name: newName });

      expect(updated.id).toBe(account.id);
      expect(updated.name).toBe(newName);

      const fetched = await client.accounts.get(account.id);
      expect(fetched.name).toBe(newName);
    });
  });

  describe('delete', () => {
    it('should delete an account so that list() no longer includes it', async () => {
      if (skipIfNoCredentials()) return;

      const account = await client.accounts.create({
        name: createTestAccountName(),
      });
      // Not tracked — we delete it manually in this test

      // Verify account is readable before attempting delete
      // (workaround for SQLite connection pool visibility lag)
      const fetched = await client.accounts.get(account.id);
      expect(fetched.id).toBe(account.id);

      const result = await client.accounts.delete(account.id);
      expect(result.success).toBe(true);

      const listResult = await client.accounts.list();
      const found = listResult.items.find((a) => a.id === account.id);
      expect(found).toBeUndefined();
    });
  });

  describe('getUsers', () => {
    it('should return users belonging to the account', async () => {
      if (skipIfNoCredentials()) return;

      const account = await client.accounts.create({
        name: createTestAccountName(),
      });
      trackAccount(account.id);

      const user1 = await client.users.create({
        email: createTestEmail(),
        password: TEST_CONFIG.testPassword,
        account_id: account.id,
        role_id: testRoleId,
      });
      trackUser(user1.id);

      const user2 = await client.users.create({
        email: createTestEmail(),
        password: TEST_CONFIG.testPassword,
        account_id: account.id,
        role_id: testRoleId,
      });
      trackUser(user2.id);

      const result = await client.accounts.getUsers(account.id);

      expect(result.items).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(2);

      const ids = result.items.map((u) => u.id);
      expect(ids).toContain(user1.id);
      expect(ids).toContain(user2.id);
    });
  });
});
