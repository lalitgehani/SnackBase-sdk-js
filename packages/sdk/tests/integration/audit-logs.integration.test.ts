/**
 * Audit Logs integration tests — F6.2: AuditLogService Full Coverage
 *
 * Requires SNACKBASE_API_KEY (superadmin) — audit log endpoints are superadmin-only.
 * Creates a test account + user in beforeAll to seed audit entries, then exercises
 * list(), get(), and export() against the real backend.
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

describe('Audit Logs Integration Tests', () => {
  let client: SnackBaseClient;
  let testAccountId: string;
  let auditLoggingEnabled: boolean;

  beforeAll(async () => {
    if (skipIfNoCredentials()) return;

    client = createTestClient();

    // Fetch available roles so we can create a user
    const rolesResult = await client.roles.list();
    if (!rolesResult.items.length) {
      throw new Error('No roles found — cannot seed audit entries without creating a user');
    }
    const roleId = Number(rolesResult.items[0].id);

    // Create an account and a user — these operations generate audit log entries
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

    // Check whether audit logging is active before we make data-dependent assertions
    const initialList = await client.auditLogs.list({ limit: 1 });
    auditLoggingEnabled = initialList.audit_logging_enabled;

    if (!auditLoggingEnabled) {
      console.warn(
        '[audit-logs tests] audit_logging_enabled=false on this backend — ' +
          'data-dependent assertions will be skipped; structural assertions still run.'
      );
    }
  });

  afterAll(async () => {
    if (client) {
      await cleanupTestResources(client);
    }
  });

  // ── list() ──────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('should return a paginated response with the expected structure', async () => {
      if (skipIfNoCredentials()) return;

      const result = await client.auditLogs.list();

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('skip');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('audit_logging_enabled');
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.skip).toBe('number');
      expect(typeof result.limit).toBe('number');
      expect(typeof result.audit_logging_enabled).toBe('boolean');
    });

    it('each returned item has the required audit log fields', async () => {
      if (skipIfNoCredentials()) return;
      if (!auditLoggingEnabled) return;

      const result = await client.auditLogs.list({ limit: 5 });
      if (result.items.length === 0) return; // no entries yet — tolerate

      const entry = result.items[0];
      expect(typeof entry.id).toBe('number');
      expect(typeof entry.account_id).toBe('string');
      expect(typeof entry.operation).toBe('string');
      expect(typeof entry.table_name).toBe('string');
      expect(typeof entry.record_id).toBe('string');
      expect(typeof entry.user_id).toBe('string');
      expect(typeof entry.user_email).toBe('string');
      expect(typeof entry.user_name).toBe('string');
      expect(typeof entry.occurred_at).toBe('string');
    });

    it('should include an entry for the CREATE operation seeded in beforeAll', async () => {
      if (skipIfNoCredentials()) return;
      if (!auditLoggingEnabled) return;

      const result = await client.auditLogs.list({ operation: 'CREATE', limit: 100 });

      expect(result.items.length).toBeGreaterThan(0);
      const allCreate = result.items.every((e) => e.operation === 'CREATE');
      expect(allCreate).toBe(true);
    });

    it('should filter by table_name and return only matching entries', async () => {
      if (skipIfNoCredentials()) return;
      if (!auditLoggingEnabled) return;

      const result = await client.auditLogs.list({ table_name: 'users', limit: 50 });

      if (result.items.length === 0) return; // tolerate empty
      const allUsers = result.items.every((e) => e.table_name === 'users');
      expect(allUsers).toBe(true);
    });

    it('should accept from_date/to_date filters and return a valid response', async () => {
      if (skipIfNoCredentials()) return;

      const from = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      const to = new Date().toISOString();

      const result = await client.auditLogs.list({ from_date: from, to_date: to, limit: 50 });

      // SDK correctly passes date params — backend responds with valid structure
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.skip).toBe('number');
      expect(typeof result.limit).toBe('number');
    });

    it('should respect skip and limit for pagination', async () => {
      if (skipIfNoCredentials()) return;

      const result = await client.auditLogs.list({ skip: 0, limit: 2 });

      expect(result.items.length).toBeLessThanOrEqual(2);
      expect(result.skip).toBe(0);
      expect(result.limit).toBe(2);
    });
  });

  // ── get() ───────────────────────────────────────────────────────────────────

  describe('get', () => {
    it('should return the full entry for an existing log ID', async () => {
      if (skipIfNoCredentials()) return;
      if (!auditLoggingEnabled) return;

      const listResult = await client.auditLogs.list({ limit: 1 });
      if (listResult.items.length === 0) {
        console.warn('[audit-logs get test] No log entries available — skipping');
        return;
      }

      const targetId = listResult.items[0].id;
      const entry = await client.auditLogs.get(targetId);

      expect(entry.id).toBe(targetId);
      expect(typeof entry.account_id).toBe('string');
      expect(typeof entry.operation).toBe('string');
      expect(typeof entry.table_name).toBe('string');
      expect(typeof entry.record_id).toBe('string');
      expect(typeof entry.user_id).toBe('string');
      expect(typeof entry.user_email).toBe('string');
      expect(typeof entry.occurred_at).toBe('string');
    });

    it('should throw (404) for a non-existent log ID', async () => {
      if (skipIfNoCredentials()) return;

      await expect(client.auditLogs.get(999999999)).rejects.toThrow();
    });
  });

  // ── export() ────────────────────────────────────────────────────────────────

  describe('export', () => {
    it('should return an array when format is json (HTTP client auto-parses application/json)', async () => {
      if (skipIfNoCredentials()) return;

      const data = await client.auditLogs.export({}, 'json') as unknown;

      // The HTTP client parses application/json responses automatically,
      // so the result is already a JS array, not a raw JSON string.
      expect(Array.isArray(data)).toBe(true);
    });

    it('should return a CSV string with a header row when format is csv', async () => {
      if (skipIfNoCredentials()) return;

      const data = await client.auditLogs.export({}, 'csv');

      // text/csv is not auto-parsed — stays as a string
      expect(typeof data).toBe('string');
      const firstLine = data.split('\n')[0];
      expect(firstLine).toBeTruthy();
      expect(firstLine).toContain(',');
    });

    it('should accept filters when exporting and return a valid response', async () => {
      if (skipIfNoCredentials()) return;

      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24h ago
      const data = await client.auditLogs.export({ from_date: from }, 'json') as unknown;

      expect(Array.isArray(data)).toBe(true);
    });
  });

  // ── no write methods ─────────────────────────────────────────────────────────

  describe('immutability — no write methods', () => {
    it('should not expose a create method', () => {
      expect((client.auditLogs as any).create).toBeUndefined();
    });

    it('should not expose an update method', () => {
      expect((client.auditLogs as any).update).toBeUndefined();
    });

    it('should not expose a delete method', () => {
      expect((client.auditLogs as any).delete).toBeUndefined();
    });
  });
});
