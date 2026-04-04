/**
 * Roles integration tests — F3.1: RoleService Full Coverage
 *
 * These tests require superadmin authentication (SNACKBASE_API_KEY).
 * Default system roles ("admin", "user") cannot be deleted (backend returns 422).
 * Custom roles created in each test use unique names to avoid conflicts.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import { createTestClient, TEST_CONFIG } from './setup';

function createTestRoleName() {
  return `test_role_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

describe('Roles Integration Tests', () => {
  let client: SnackBaseClient;
  const createdRoleIds: string[] = [];

  beforeEach(() => {
    if (!TEST_CONFIG.apiKey) {
      return;
    }
    client = createTestClient();
  });

  afterEach(async () => {
    if (!TEST_CONFIG.apiKey || !client) return;
    for (const id of createdRoleIds) {
      try {
        await client.roles.delete(id);
      } catch {
        // ignore cleanup errors
      }
    }
    createdRoleIds.length = 0;
  });

  describe('list', () => {
    it('should return all roles including system defaults', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.roles.list();

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(2);

      const names = result.items.map((r) => r.name);
      expect(names).toContain('admin');
      expect(names).toContain('user');
    });

    it('should include a newly created custom role in the list', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const name = createTestRoleName();
      const created = await client.roles.create({ name, description: 'Test role' });
      createdRoleIds.push(created.id);

      const result = await client.roles.list();
      const found = result.items.find((r) => r.id === created.id);

      expect(found).toBeDefined();
      expect(found!.name).toBe(name);
    });
  });

  describe('get', () => {
    it('should return the correct role with all fields', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const name = createTestRoleName();
      const description = 'Integration test role';
      const created = await client.roles.create({ name, description });
      createdRoleIds.push(created.id);

      const fetched = await client.roles.get(created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe(name);
      expect(fetched.description).toBe(description);
    });

    it('should throw for a non-existent role ID', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(client.roles.get('999999')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create a role and return it with an ID', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const name = createTestRoleName();
      const description = 'Created by integration test';

      const role = await client.roles.create({ name, description });
      createdRoleIds.push(role.id);

      expect(role.id).toBeDefined();
      expect(role.name).toBe(name);
      expect(role.description).toBe(description);

      // Confirm get() sees it
      const fetched = await client.roles.get(role.id);
      expect(fetched.id).toBe(role.id);
    });

    it('should return 409 for a duplicate role name', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const name = createTestRoleName();
      const first = await client.roles.create({ name });
      createdRoleIds.push(first.id);

      await expect(client.roles.create({ name })).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update the role description and reflect it in get()', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const name = createTestRoleName();
      const created = await client.roles.create({ name, description: 'Original' });
      createdRoleIds.push(created.id);

      // PUT requires name — send both name and the updated description
      const updated = await client.roles.update(created.id, { name, description: 'Updated' });

      expect(updated.id).toBe(created.id);
      expect(updated.description).toBe('Updated');

      const fetched = await client.roles.get(created.id);
      expect(fetched.description).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('should delete a custom role so get() returns 404', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const name = createTestRoleName();
      const role = await client.roles.create({ name });

      await client.roles.delete(role.id);

      await expect(client.roles.get(role.id)).rejects.toThrow();
      // Remove from cleanup list since already deleted
      const idx = createdRoleIds.indexOf(role.id);
      if (idx !== -1) createdRoleIds.splice(idx, 1);
    });

    it('should throw when attempting to delete a default system role', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // Find the "user" role ID from the list
      const result = await client.roles.list();
      const userRole = result.items.find((r) => r.name === 'user');
      expect(userRole).toBeDefined();

      // Backend returns 422 for default role deletion attempts
      await expect(client.roles.delete(userRole!.id)).rejects.toThrow();
    });
  });
});
