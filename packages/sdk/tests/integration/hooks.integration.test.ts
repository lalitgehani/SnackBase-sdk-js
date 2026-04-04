/**
 * HookService integration tests — F5.2: HookService Full Coverage
 *
 * Tests require superadmin authentication (SNACKBASE_API_KEY).
 * Each test that creates a hook cleans it up in afterEach.
 *
 * Backend response shapes:
 *   list:           { items: Hook[], total: number }
 *   get:            Hook
 *   create:         Hook
 *   update:         Hook
 *   delete:         204 No Content → SDK returns { success: true }
 *   toggle:         Hook (enabled state flipped)
 *   trigger:        { message, status, actions_executed, error? } (202)
 *                   NOTE: SDK types this as { queued: boolean } but backend
 *                   actually returns the execution result object directly.
 *   listExecutions: { items: HookExecution[], total: number }
 *
 * All test hooks use trigger type "manual" with empty actions[] to keep tests
 * deterministic and free of side-effects (no scheduler, no outbound HTTP calls).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import { createTestClient, TEST_CONFIG, waitFor } from './setup';

function createTestHookPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: `test-hook-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    trigger: { type: 'manual' as const },
    actions: [] as Record<string, unknown>[],
    enabled: true,
    ...overrides,
  };
}

describe('HookService Integration Tests', () => {
  let client: SnackBaseClient;
  const createdHookIds: string[] = [];

  beforeEach(() => {
    if (!TEST_CONFIG.apiKey) return;
    client = createTestClient();
  });

  afterEach(async () => {
    if (!TEST_CONFIG.apiKey || !client) return;
    for (const id of createdHookIds) {
      try {
        await client.hooks.delete(id);
      } catch {
        // already deleted — ignore
      }
    }
    createdHookIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------

  describe('list', () => {
    it('should return a paginated response with items array and total', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.hooks.list();

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(typeof result.total).toBe('number');
    });

    it('should include a newly created hook in the list', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload());
      createdHookIds.push(created.id);

      const result = await client.hooks.list();
      const found = result.items.find((h) => h.id === created.id);

      expect(found).toBeDefined();
      expect(found!.name).toBe(created.name);
    });

    it('should respect limit param — items.length <= limit', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.hooks.list({ limit: 2 });

      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBeLessThanOrEqual(2);
    });

    it('should filter by trigger_type=manual', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(
        createTestHookPayload({ trigger: { type: 'manual' } })
      );
      createdHookIds.push(created.id);

      const result = await client.hooks.list({ trigger_type: 'manual' });

      expect(result.items.every((h) => h.trigger.type === 'manual')).toBe(true);
      expect(result.items.find((h) => h.id === created.id)).toBeDefined();
    });

    it('should filter by enabled=false', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload({ enabled: false }));
      createdHookIds.push(created.id);

      const result = await client.hooks.list({ enabled: false });

      expect(result.items.every((h) => h.enabled === false)).toBe(true);
      expect(result.items.find((h) => h.id === created.id)).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // get
  // ---------------------------------------------------------------------------

  describe('get', () => {
    it('should return full hook config including all required fields', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(
        createTestHookPayload({ description: 'test description' })
      );
      createdHookIds.push(created.id);

      const fetched = await client.hooks.get(created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe(created.name);
      expect(fetched.description).toBe('test description');
      expect(fetched.trigger).toEqual({ type: 'manual' });
      expect(fetched.actions).toBeInstanceOf(Array);
      expect(typeof fetched.enabled).toBe('boolean');
      expect(fetched.created_at).toBeDefined();
      expect(fetched.updated_at).toBeDefined();
    });

    it('should throw for a non-existent hook ID', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.hooks.get('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------

  describe('create', () => {
    it('should create a hook with manual trigger and return the hook with an id', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload());
      createdHookIds.push(created.id);

      expect(created.id).toBeDefined();
      expect(created.trigger.type).toBe('manual');
      expect(created.enabled).toBe(true);
      expect(created.actions).toBeInstanceOf(Array);
    });

    it('should create a hook with an event trigger', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(
        createTestHookPayload({
          trigger: { type: 'event', event: 'records.create' },
        })
      );
      createdHookIds.push(created.id);

      expect(created.trigger.type).toBe('event');
      expect((created.trigger as { type: 'event'; event: string }).event).toBe('records.create');
    });

    it('should create a hook with a schedule trigger and populate next_run_at', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(
        createTestHookPayload({
          trigger: { type: 'schedule', cron: '0 9 * * MON' },
          enabled: true,
        })
      );
      createdHookIds.push(created.id);

      expect(created.trigger.type).toBe('schedule');
      // An enabled schedule hook must have next_run_at calculated
      expect(created.next_run_at).toBeDefined();
      expect(created.next_run_at).not.toBeNull();
    });

    it('should confirm the hook exists via get() after create', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload());
      createdHookIds.push(created.id);

      const fetched = await client.hooks.get(created.id);
      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe(created.name);
    });

    it('should create a hook with enabled=false when specified', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload({ enabled: false }));
      createdHookIds.push(created.id);

      expect(created.enabled).toBe(false);

      const fetched = await client.hooks.get(created.id);
      expect(fetched.enabled).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------

  describe('update', () => {
    it('should update the name and reflect it in get()', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload());
      createdHookIds.push(created.id);

      const newName = `updated-hook-${Date.now()}`;
      const updated = await client.hooks.update(created.id, { name: newName });

      expect(updated.name).toBe(newName);

      const fetched = await client.hooks.get(created.id);
      expect(fetched.name).toBe(newName);
    });

    it('should update the description and reflect it in get()', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload());
      createdHookIds.push(created.id);

      const updated = await client.hooks.update(created.id, {
        description: 'updated description',
      });

      expect(updated.description).toBe('updated description');

      const fetched = await client.hooks.get(created.id);
      expect(fetched.description).toBe('updated description');
    });

    it('should update enabled=false and reflect it in get()', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload({ enabled: true }));
      createdHookIds.push(created.id);

      await client.hooks.update(created.id, { enabled: false });

      const fetched = await client.hooks.get(created.id);
      expect(fetched.enabled).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------

  describe('delete', () => {
    it('should return { success: true } and make get() throw afterwards', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload());
      // Not pushed to createdHookIds — deleted in this test

      const result = await client.hooks.delete(created.id);
      expect(result.success).toBe(true);

      await expect(client.hooks.get(created.id)).rejects.toThrow();
    });

    it('should no longer appear in list() after delete', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload());
      await client.hooks.delete(created.id);

      const result = await client.hooks.list();
      const found = result.items.find((h) => h.id === created.id);
      expect(found).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // toggle
  // ---------------------------------------------------------------------------

  describe('toggle', () => {
    it('should disable an enabled hook; get() reflects enabled: false', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload({ enabled: true }));
      createdHookIds.push(created.id);

      const toggled = await client.hooks.toggle(created.id);
      expect(toggled.enabled).toBe(false);

      const fetched = await client.hooks.get(created.id);
      expect(fetched.enabled).toBe(false);
    });

    it('should re-enable after a second toggle; get() reflects enabled: true', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload({ enabled: true }));
      createdHookIds.push(created.id);

      // First toggle → disabled
      await client.hooks.toggle(created.id);
      const afterFirst = await client.hooks.get(created.id);
      expect(afterFirst.enabled).toBe(false);

      // Second toggle → re-enabled
      await client.hooks.toggle(created.id);
      const afterSecond = await client.hooks.get(created.id);
      expect(afterSecond.enabled).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // trigger
  // ---------------------------------------------------------------------------

  describe('trigger', () => {
    it('should return a defined result when triggering a manual hook', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload());
      createdHookIds.push(created.id);

      // NOTE: The backend returns { message, status, actions_executed, error? } with 202.
      // The SDK types this as { queued: boolean }, which is a type mismatch — the real
      // response object is returned as-is from response.data.
      const result = await client.hooks.trigger(created.id);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should create an execution record in listExecutions after trigger', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload());
      createdHookIds.push(created.id);

      await client.hooks.trigger(created.id);

      // Poll until the execution record appears
      await waitFor(async () => {
        const executions = await client.hooks.listExecutions(created.id);
        return executions.total >= 1;
      });

      const executions = await client.hooks.listExecutions(created.id);
      expect(executions.total).toBeGreaterThanOrEqual(1);
    });
  });

  // ---------------------------------------------------------------------------
  // listExecutions
  // ---------------------------------------------------------------------------

  describe('listExecutions', () => {
    it('should return empty items and total=0 for a newly created hook', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload());
      createdHookIds.push(created.id);

      const executions = await client.hooks.listExecutions(created.id);

      expect(executions.items).toBeInstanceOf(Array);
      expect(executions.items).toHaveLength(0);
      expect(executions.total).toBe(0);
    });

    it('should return an execution record with correct shape after trigger()', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload());
      createdHookIds.push(created.id);

      await client.hooks.trigger(created.id);

      await waitFor(async () => {
        const executions = await client.hooks.listExecutions(created.id);
        return executions.total >= 1;
      });

      const executions = await client.hooks.listExecutions(created.id);
      const execution = executions.items[0];

      expect(execution.id).toBeDefined();
      expect(execution.hook_id).toBe(created.id);
      expect(execution.trigger_type).toBe('manual');
      expect(['success', 'failed', 'partial']).toContain(execution.status);
      expect(execution.executed_at).toBeDefined();
      expect(typeof execution.actions_executed).toBe('number');
    });

    it('should support limit and offset pagination params', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.hooks.create(createTestHookPayload());
      createdHookIds.push(created.id);

      const executions = await client.hooks.listExecutions(created.id, {
        limit: 10,
        offset: 0,
      });

      expect(executions.items).toBeInstanceOf(Array);
      expect(executions.items.length).toBeLessThanOrEqual(10);
    });
  });
});
