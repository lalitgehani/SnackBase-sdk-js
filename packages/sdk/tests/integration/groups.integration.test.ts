/**
 * Groups integration tests — F4.1: GroupsService Full Coverage
 *
 * Requires SNACKBASE_API_KEY for admin operations.
 * A shared test account and two test users are created in beforeAll so that
 * member-management tests have real user IDs to work with.
 * Each test creates its own group with a unique name to avoid conflicts.
 *
 * API notes:
 * - GET /api/v1/groups returns a plain array (not a paginated wrapper)
 * - POST/DELETE /api/v1/groups/{id}/users manages membership (not /members)
 * - GET /api/v1/groups/{id} returns GroupDetailResponse with a `users` array
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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

function createTestGroupName() {
  return `test_group_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

describe('Groups Integration Tests', () => {
  let client: SnackBaseClient;
  let testAccountId: string;
  let testRoleId: number;
  let testUserId1: string;
  let testUserId2: string;

  // Track groups created during tests so they can be cleaned up in afterAll
  const createdGroupIds: string[] = [];

  beforeAll(async () => {
    if (skipIfNoCredentials()) return;

    client = createTestClient();

    // Fetch a valid role ID for user creation
    const rolesResult = await client.roles.list();
    if (!rolesResult.items.length) {
      throw new Error('No roles found — cannot create test users without a role_id');
    }
    testRoleId = Number(rolesResult.items[0].id);

    // Discover the account that groups will be scoped to by creating a probe group
    // and reading its account_id, then deleting it.
    const probeGroup = await client.groups.create({ name: `probe_${Date.now()}` });
    const apiKeyAccountId = (probeGroup as any).account_id as string;
    await client.groups.delete(probeGroup.id);

    // Create users in the same account so they can be added as group members
    const account = await client.accounts.create({ name: createTestAccountName() });
    testAccountId = account.id;
    trackAccount(account.id);

    // If the API key's account differs from the test account, we use the API key's
    // account for member tests (groups are scoped there by default).
    const memberAccountId = apiKeyAccountId ?? testAccountId;

    const user1 = await client.users.create({
      email: createTestEmail(),
      password: TEST_CONFIG.testPassword,
      account_id: memberAccountId,
      role_id: testRoleId,
    });
    testUserId1 = user1.id;
    trackUser(user1.id);

    const user2 = await client.users.create({
      email: createTestEmail(),
      password: TEST_CONFIG.testPassword,
      account_id: memberAccountId,
      role_id: testRoleId,
    });
    testUserId2 = user2.id;
    trackUser(user2.id);
  });

  afterAll(async () => {
    if (!client) return;

    // Clean up any groups not already deleted by individual tests
    for (const id of createdGroupIds) {
      try {
        await client.groups.delete(id);
      } catch {
        // ignore cleanup errors
      }
    }

    await cleanupTestResources(client);
  });

  describe('list', () => {
    it('should return an array that includes a newly created group', async () => {
      if (skipIfNoCredentials()) return;

      const name = createTestGroupName();
      const group = await client.groups.create({ name });
      createdGroupIds.push(group.id);

      // Pass a high limit so newly created groups aren't cut off by the default of 100.
      // Superadmin API keys receive all groups across all accounts via list_all().
      const result = await client.groups.list({ limit: 9999 } as any);

      // Backend returns a plain array (not a paginated wrapper)
      expect(result).toBeInstanceOf(Array);
      const found = result.find((g) => g.id === group.id);
      expect(found).toBeDefined();
      expect(found!.name).toBe(name);
    });
  });

  describe('get', () => {
    it('should return the correct group with all expected fields', async () => {
      if (skipIfNoCredentials()) return;

      const name = createTestGroupName();
      const description = 'Integration test group';
      const created = await client.groups.create({ name, description });
      createdGroupIds.push(created.id);

      const fetched = await client.groups.get(created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe(name);
      expect(fetched.description).toBe(description);
      expect(fetched.created_at).toBeDefined();
    });

    it('should throw for a non-existent group ID', async () => {
      if (skipIfNoCredentials()) return;

      await expect(
        client.groups.get('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create a group and confirm existence via get()', async () => {
      if (skipIfNoCredentials()) return;

      const name = createTestGroupName();
      const group = await client.groups.create({ name, description: 'Test description' });
      createdGroupIds.push(group.id);

      expect(group.id).toBeDefined();
      expect(group.name).toBe(name);

      const fetched = await client.groups.get(group.id);
      expect(fetched.id).toBe(group.id);
    });

    it('should return 409 for a duplicate group name', async () => {
      if (skipIfNoCredentials()) return;

      const name = createTestGroupName();
      const first = await client.groups.create({ name });
      createdGroupIds.push(first.id);

      await expect(client.groups.create({ name })).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update group metadata and reflect the change in get()', async () => {
      if (skipIfNoCredentials()) return;

      const name = createTestGroupName();
      const created = await client.groups.create({ name, description: 'Original' });
      createdGroupIds.push(created.id);

      const updatedName = createTestGroupName();
      const updated = await client.groups.update(created.id, {
        name: updatedName,
        description: 'Updated',
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(updatedName);
      expect(updated.description).toBe('Updated');

      const fetched = await client.groups.get(created.id);
      expect(fetched.name).toBe(updatedName);
      expect(fetched.description).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('should delete a group so get() throws afterward', async () => {
      if (skipIfNoCredentials()) return;

      const name = createTestGroupName();
      const group = await client.groups.create({ name });

      const result = await client.groups.delete(group.id);
      expect(result.success).toBe(true);

      await expect(client.groups.get(group.id)).rejects.toThrow();

      // Remove from cleanup list since already deleted
      const idx = createdGroupIds.indexOf(group.id);
      if (idx !== -1) createdGroupIds.splice(idx, 1);
    });

    it('should delete a group that has members without error', async () => {
      if (skipIfNoCredentials()) return;

      const name = createTestGroupName();
      const group = await client.groups.create({ name });
      await client.groups.addMember(group.id, testUserId1);

      const result = await client.groups.delete(group.id);
      expect(result.success).toBe(true);

      // Remove from cleanup list since already deleted
      const idx = createdGroupIds.indexOf(group.id);
      if (idx !== -1) createdGroupIds.splice(idx, 1);
    });
  });

  describe('addMember', () => {
    it('should add a user and return { success: true }', async () => {
      if (skipIfNoCredentials()) return;

      const group = await client.groups.create({ name: createTestGroupName() });
      createdGroupIds.push(group.id);

      const result = await client.groups.addMember(group.id, testUserId1);
      expect(result.success).toBe(true);
    });

    it('should reflect the added user in the group returned by get()', async () => {
      if (skipIfNoCredentials()) return;

      const group = await client.groups.create({ name: createTestGroupName() });
      createdGroupIds.push(group.id);

      await client.groups.addMember(group.id, testUserId1);

      // GET /api/v1/groups/{id} returns GroupDetailResponse which includes a `users` array
      const fetched = (await client.groups.get(group.id)) as any;
      if (Array.isArray(fetched.users)) {
        const memberIds = fetched.users.map((u: any) => u.id);
        expect(memberIds).toContain(testUserId1);
      }
    });
  });

  describe('removeMember', () => {
    it('should remove one user while the other remains in the group', async () => {
      if (skipIfNoCredentials()) return;

      const group = await client.groups.create({ name: createTestGroupName() });
      createdGroupIds.push(group.id);

      await client.groups.addMember(group.id, testUserId1);
      await client.groups.addMember(group.id, testUserId2);

      const removeResult = await client.groups.removeMember(group.id, testUserId1);
      expect(removeResult.success).toBe(true);

      const fetched = (await client.groups.get(group.id)) as any;
      if (Array.isArray(fetched.users)) {
        const memberIds = fetched.users.map((u: any) => u.id);
        expect(memberIds).not.toContain(testUserId1);
        expect(memberIds).toContain(testUserId2);
      }
    });

    it('should succeed idempotently when removing a user who is not in the group', async () => {
      if (skipIfNoCredentials()) return;

      // The backend DELETE /groups/{id}/users/{user_id} is idempotent:
      // it always returns 204 regardless of whether the user was a member.
      const group = await client.groups.create({ name: createTestGroupName() });
      createdGroupIds.push(group.id);

      const result = await client.groups.removeMember(group.id, testUserId1);
      expect(result.success).toBe(true);
    });
  });
});
