/**
 * Dashboard integration tests — F6.6: DashboardService Full Coverage
 *
 * Requires SNACKBASE_API_KEY (superadmin) — the dashboard stats endpoint is superadmin-only.
 * Creates a test account + user in beforeAll to seed meaningful data, then exercises
 * getStats() against the real backend verifying structure, numeric invariants, and
 * data-dependent assertions.
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

describe('Dashboard Integration Tests', () => {
  let client: SnackBaseClient;
  let testAccountId: string;

  beforeAll(async () => {
    if (skipIfNoCredentials()) return;

    client = createTestClient();

    // Fetch a role so we can create a test user
    const rolesResult = await client.roles.list();
    if (!rolesResult.items.length) {
      throw new Error('No roles found — cannot seed dashboard data without creating a user');
    }
    const roleId = Number(rolesResult.items[0].id);

    // Create an account and a user — seeds total_accounts, total_users,
    // new_accounts_7d, and new_users_7d in the stats response
    const account = await client.accounts.create({ name: createTestAccountName() });
    testAccountId = account.id;
    trackAccount(account.id);

    const user = await client.users.create({
      email: createTestEmail(),
      password: TEST_CONFIG.testPassword,
      account_id: testAccountId,
      role_id: roleId,
    });
    trackUser(user.id);
  });

  afterAll(async () => {
    if (client) {
      await cleanupTestResources(client);
    }
  });

  // ── getStats() — response structure ─────────────────────────────────────────

  describe('getStats — response structure', () => {
    it('should return a non-null object', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      expect(stats).toBeDefined();
      expect(stats).not.toBeNull();
      expect(typeof stats).toBe('object');
    });

    it('should have all required numeric top-level fields', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      expect(typeof stats.total_accounts).toBe('number');
      expect(typeof stats.total_users).toBe('number');
      expect(typeof stats.total_collections).toBe('number');
      expect(typeof stats.total_records).toBe('number');
      expect(typeof stats.new_accounts_7d).toBe('number');
      expect(typeof stats.new_users_7d).toBe('number');
      expect(typeof stats.active_sessions).toBe('number');
      expect(typeof stats.public_collections_count).toBe('number');
    });

    it('should have recent_registrations as an array', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      expect(Array.isArray(stats.recent_registrations)).toBe(true);
    });

    it('should have recent_audit_logs as an array', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      expect(Array.isArray(stats.recent_audit_logs)).toBe(true);
    });

    it('should have system_health as an object', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      expect(typeof stats.system_health).toBe('object');
      expect(stats.system_health).not.toBeNull();
    });
  });

  // ── getStats() — numeric invariants ─────────────────────────────────────────

  describe('getStats — numeric invariants', () => {
    it('total_* fields should all be non-negative integers', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      expect(stats.total_accounts).toBeGreaterThanOrEqual(0);
      expect(stats.total_users).toBeGreaterThanOrEqual(0);
      expect(stats.total_collections).toBeGreaterThanOrEqual(0);
      expect(stats.total_records).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(stats.total_accounts)).toBe(true);
      expect(Number.isInteger(stats.total_users)).toBe(true);
      expect(Number.isInteger(stats.total_collections)).toBe(true);
      expect(Number.isInteger(stats.total_records)).toBe(true);
    });

    it('growth metrics should be non-negative', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      expect(stats.new_accounts_7d).toBeGreaterThanOrEqual(0);
      expect(stats.new_users_7d).toBeGreaterThanOrEqual(0);
    });

    it('active_sessions and public_collections_count should be non-negative', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      expect(stats.active_sessions).toBeGreaterThanOrEqual(0);
      expect(stats.public_collections_count).toBeGreaterThanOrEqual(0);
    });
  });

  // ── getStats() — data reflects seeded state ──────────────────────────────────

  describe('getStats — data reflects seeded state', () => {
    it('total_accounts should be at least 1 (account created in beforeAll)', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      expect(stats.total_accounts).toBeGreaterThanOrEqual(1);
    });

    it('total_users should be at least 1 (user created in beforeAll)', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      expect(stats.total_users).toBeGreaterThanOrEqual(1);
    });

    it('new_accounts_7d should be at least 1 (account just created)', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      expect(stats.new_accounts_7d).toBeGreaterThanOrEqual(1);
    });

    it('new_users_7d should be at least 1 (user just created)', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      expect(stats.new_users_7d).toBeGreaterThanOrEqual(1);
    });
  });

  // ── getStats() — system_health shape ────────────────────────────────────────

  describe('getStats — system_health shape', () => {
    it('system_health.database_status should be a non-empty string', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      expect(typeof stats.system_health.database_status).toBe('string');
      expect(stats.system_health.database_status.length).toBeGreaterThan(0);
    });

    it('system_health.storage_usage_mb should be a non-negative number', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      expect(typeof stats.system_health.storage_usage_mb).toBe('number');
      expect(stats.system_health.storage_usage_mb).toBeGreaterThanOrEqual(0);
    });
  });

  // ── getStats() — recent_registrations items ──────────────────────────────────

  describe('getStats — recent_registrations item shape', () => {
    it('each recent_registration item should have required fields', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      if (stats.recent_registrations.length === 0) return; // tolerate empty

      const reg = stats.recent_registrations[0];
      expect(typeof reg.id).toBe('string');
      expect(typeof reg.email).toBe('string');
      expect(typeof reg.account_id).toBe('string');
      expect(typeof reg.account_code).toBe('string');
      expect(typeof reg.account_name).toBe('string');
      expect(typeof reg.created_at).toBe('string');
    });

    it('account_code in recent_registrations should match XX#### format', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      if (stats.recent_registrations.length === 0) return;

      const reg = stats.recent_registrations[0];
      expect(reg.account_code).toMatch(/^[A-Z]{2}\d{4}$/);
    });
  });

  // ── getStats() — recent_audit_logs items ─────────────────────────────────────

  describe('getStats — recent_audit_logs item shape', () => {
    it('each recent_audit_log item should have required fields when present', async () => {
      if (skipIfNoCredentials()) return;

      const stats = await client.dashboard.getStats();

      if (stats.recent_audit_logs.length === 0) {
        console.warn('[dashboard tests] recent_audit_logs is empty — item shape check skipped');
        return;
      }

      const entry = stats.recent_audit_logs[0];
      expect(typeof entry.id).toBe('number');
      expect(typeof entry.operation).toBe('string');
      expect(typeof entry.table_name).toBe('string');
      expect(typeof entry.occurred_at).toBe('string');
    });
  });

  // ── authorization — no API key ────────────────────────────────────────────────

  describe('authorization', () => {
    it('should throw when called without an API key', async () => {
      const unauthClient = new SnackBaseClient({
        baseUrl: TEST_CONFIG.baseUrl,
        enableLogging: false,
      });

      await expect(unauthClient.dashboard.getStats()).rejects.toThrow();
    });
  });

  // ── read-only — no write methods ─────────────────────────────────────────────

  describe('read-only — no write methods', () => {
    it('should not expose a create method', () => {
      expect((client.dashboard as any).create).toBeUndefined();
    });

    it('should not expose an update method', () => {
      expect((client.dashboard as any).update).toBeUndefined();
    });

    it('should not expose a delete method', () => {
      expect((client.dashboard as any).delete).toBeUndefined();
    });
  });
});
