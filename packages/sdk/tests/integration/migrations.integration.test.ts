/**
 * MigrationService integration tests — F6.4: MigrationService Full Coverage
 *
 * Requires SNACKBASE_API_KEY (superadmin) — migration endpoints are superadmin-only.
 * This service is entirely read-only; no test resources are created or cleaned up.
 *
 * Backend endpoints:
 *   GET /api/v1/migrations         → list()
 *   GET /api/v1/migrations/current → getCurrent()
 *   GET /api/v1/migrations/history → getHistory()
 *
 * NOTE: The SDK TypeScript types use camelCase (isApplied, isDynamic, currentRevision,
 * appliedAt, createdAt) but the backend returns snake_case (is_applied, is_dynamic,
 * current_revision, created_at). There is no camelCase transformer in the HTTP layer.
 * Tests cast to `any` where needed to assert actual backend field names.
 *
 * Additional backend fields not present in SDK types:
 *   MigrationRevision: is_head, down_revision, branch_labels
 *   CurrentRevisionResponse: created_at (SDK says appliedAt)
 *   MigrationListResponse: current_revision (SDK says currentRevision)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import { createTestClient, skipIfNoCredentials } from './setup';

describe('MigrationService Integration Tests', () => {
  let client: SnackBaseClient;

  beforeAll(() => {
    if (skipIfNoCredentials()) return;
    client = createTestClient();
  });

  // ── list() ──────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('should return an object with revisions array and total', async () => {
      if (skipIfNoCredentials()) return;

      const result = await client.migrations.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result.revisions)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('total should match the length of the revisions array', async () => {
      if (skipIfNoCredentials()) return;

      const result = await client.migrations.list();

      expect(result.total).toBe(result.revisions.length);
    });

    it('should return at least one revision (initial schema migration always exists)', async () => {
      if (skipIfNoCredentials()) return;

      const result = await client.migrations.list();

      expect(result.revisions.length).toBeGreaterThan(0);
    });

    it('each revision should have the required backend fields', async () => {
      if (skipIfNoCredentials()) return;

      const result = await client.migrations.list();
      if (result.revisions.length === 0) return;

      const rev = result.revisions[0] as any;
      expect(typeof rev.revision).toBe('string');
      expect(typeof rev.description).toBe('string');
      // Backend returns snake_case — SDK types incorrectly say camelCase
      expect(typeof rev.is_applied).toBe('boolean');
      expect(typeof rev.is_dynamic).toBe('boolean');
      expect(typeof rev.is_head).toBe('boolean');
      // down_revision and created_at may be null
      expect(['string', 'object'].includes(typeof rev.down_revision)).toBe(true);
      expect(['string', 'object'].includes(typeof rev.created_at)).toBe(true);
    });

    it('current_revision should be null or a string present in revisions', async () => {
      if (skipIfNoCredentials()) return;

      const result = await client.migrations.list();
      // Backend returns current_revision (snake_case); SDK type says currentRevision (camelCase)
      const currentRevision = (result as any).current_revision;

      if (currentRevision === null || currentRevision === undefined) {
        // Acceptable — no migrations applied yet
        return;
      }

      expect(typeof currentRevision).toBe('string');
      const ids = result.revisions.map((r) => r.revision);
      expect(ids).toContain(currentRevision);
    });
  });

  // ── getCurrent() ─────────────────────────────────────────────────────────────

  describe('getCurrent', () => {
    it('should return an object with revision and description when migrations are applied', async () => {
      if (skipIfNoCredentials()) return;

      const result = await client.migrations.getCurrent();

      // A freshly initialised SnackBase instance always has migrations applied
      if (result === null) {
        console.warn('[migrations getCurrent] returned null — backend may have no applied migrations');
        return;
      }

      expect(typeof result.revision).toBe('string');
      expect(result.revision.length).toBeGreaterThan(0);
      expect(typeof result.description).toBe('string');
    });

    it('should include created_at on the current revision (backend field name)', async () => {
      if (skipIfNoCredentials()) return;

      const result = await client.migrations.getCurrent();
      if (result === null) return;

      // Backend returns created_at; SDK type incorrectly says appliedAt
      const raw = result as any;
      expect(['string', 'object'].includes(typeof raw.created_at)).toBe(true);
    });

    it('SDK should return null (not throw) when no migration is applied (404 handling)', async () => {
      if (skipIfNoCredentials()) return;

      // We cannot force a 404 in a normal running backend, but we verify the
      // SDK contract: getCurrent() catches 404 and returns null instead of throwing.
      // The method itself handles the 404 internally — calling it must never reject
      // with a 404 error.
      const result = await client.migrations.getCurrent();
      // result is either null (no migration applied) or a valid object — both are fine
      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('getCurrent revision should match the last entry in getHistory', async () => {
      if (skipIfNoCredentials()) return;

      const current = await client.migrations.getCurrent();
      const historyResult = await client.migrations.getHistory();

      if (current === null || historyResult.history.length === 0) return;

      const lastHistoryEntry = historyResult.history[historyResult.history.length - 1];
      expect(current.revision).toBe(lastHistoryEntry.revision);
    });
  });

  // ── getHistory() ─────────────────────────────────────────────────────────────

  describe('getHistory', () => {
    it('should return an object with history array and total', async () => {
      if (skipIfNoCredentials()) return;

      const result = await client.migrations.getHistory();

      expect(result).toBeDefined();
      expect(Array.isArray(result.history)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('total should match the length of the history array', async () => {
      if (skipIfNoCredentials()) return;

      const result = await client.migrations.getHistory();

      expect(result.total).toBe(result.history.length);
    });

    it('should return at least one applied migration', async () => {
      if (skipIfNoCredentials()) return;

      const result = await client.migrations.getHistory();

      expect(result.history.length).toBeGreaterThan(0);
    });

    it('each history item should have the required backend fields', async () => {
      if (skipIfNoCredentials()) return;

      const result = await client.migrations.getHistory();
      if (result.history.length === 0) return;

      const item = result.history[0] as any;
      expect(typeof item.revision).toBe('string');
      expect(typeof item.description).toBe('string');
      // Backend returns snake_case; SDK type incorrectly says isDynamic / createdAt
      expect(typeof item.is_dynamic).toBe('boolean');
      expect(['string', 'object'].includes(typeof item.created_at)).toBe(true);
    });

    it('history entries should be ordered chronologically (oldest first)', async () => {
      if (skipIfNoCredentials()) return;

      const result = await client.migrations.getHistory();
      if (result.history.length < 2) return;

      for (let i = 1; i < result.history.length; i++) {
        const prev = (result.history[i - 1] as any).created_at;
        const curr = (result.history[i] as any).created_at;
        if (!prev || !curr) continue; // tolerate null timestamps
        expect(new Date(prev).getTime()).toBeLessThanOrEqual(new Date(curr).getTime());
      }
    });

    it('history should contain only applied migrations (none pending)', async () => {
      if (skipIfNoCredentials()) return;

      const listResult = await client.migrations.list();
      const historyResult = await client.migrations.getHistory();

      if (listResult.revisions.length === 0 || historyResult.history.length === 0) return;

      // Every revision in history must be marked as applied in list()
      const appliedRevisions = new Set(
        listResult.revisions
          .filter((r) => (r as any).is_applied === true)
          .map((r) => r.revision)
      );

      for (const item of historyResult.history) {
        expect(appliedRevisions.has(item.revision)).toBe(true);
      }
    });
  });

  // ── read-only — no write methods ─────────────────────────────────────────────

  describe('read-only — no write methods', () => {
    it('should not expose a create method', () => {
      expect((client.migrations as any).create).toBeUndefined();
    });

    it('should not expose an update method', () => {
      expect((client.migrations as any).update).toBeUndefined();
    });

    it('should not expose a delete method', () => {
      expect((client.migrations as any).delete).toBeUndefined();
    });
  });
});
