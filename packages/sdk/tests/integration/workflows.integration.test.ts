/**
 * WorkflowService integration tests — F7.1: WorkflowService Full Coverage
 *
 * Tests require superadmin authentication (SNACKBASE_API_KEY).
 *
 * Backend response shapes:
 *   list:          { items: Workflow[], total: number }
 *   get:           Workflow  (trigger_type + trigger_config, not nested trigger)
 *   create:        Workflow  (201)
 *   update:        Workflow
 *   delete:        204 No Content
 *   trigger:       { message: string, instance_id: string }
 *   listInstances: { items: WorkflowInstance[], total: number }
 *   getInstance:   WorkflowInstanceDetail  (includes step_logs array)
 *   cancelInstance: WorkflowInstance  (status → 'cancelled')
 *   retryInstance:  WorkflowInstance  (wraps /resume endpoint)
 *
 * Test data strategy:
 *   - Simple workflow (manual trigger, no steps) for CRUD + trigger + instance tests.
 *   - Wait-delay workflow (manual trigger, 1d wait_delay step) for cancelInstance test;
 *     triggering it immediately puts the instance into 'waiting' state.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import { createTestClient, TEST_CONFIG, waitFor } from './setup';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uniqueName(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

const MANUAL_WORKFLOW_PAYLOAD = () => ({
  name: uniqueName('wf_manual'),
  trigger: { type: 'manual' as const },
  steps: [],
  enabled: true,
});

const WAIT_DELAY_WORKFLOW_PAYLOAD = () => ({
  name: uniqueName('wf_wait'),
  trigger: { type: 'manual' as const },
  steps: [
    {
      type: 'wait_delay',
      name: 'long_pause',
      duration: '1d',
    },
  ],
  enabled: true,
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('WorkflowService Integration Tests', () => {
  let client: SnackBaseClient;
  const createdWorkflowIds: string[] = [];

  beforeEach(() => {
    if (!TEST_CONFIG.apiKey) return;
    client = createTestClient();
  });

  afterEach(async () => {
    if (!TEST_CONFIG.apiKey || !client) return;
    for (const id of createdWorkflowIds) {
      try {
        await client.workflows.delete(id);
      } catch {
        // already deleted or test cleaned it up
      }
    }
    createdWorkflowIds.length = 0;
  });

  // -------------------------------------------------------------------------
  // list
  // -------------------------------------------------------------------------

  describe('list', () => {
    it('should return WorkflowListResponse with items array and numeric total', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.workflows.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it('should support limit and offset params', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.workflows.list({ limit: 2, offset: 0 });

      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBeLessThanOrEqual(2);
    });

    it('created workflow should appear in list', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const wf = await client.workflows.create(MANUAL_WORKFLOW_PAYLOAD());
      createdWorkflowIds.push(wf.id);

      const result = await client.workflows.list();
      const found = result.items.find((w) => w.id === wf.id);
      expect(found).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------

  describe('get', () => {
    it('should return Workflow with expected fields', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const payload = MANUAL_WORKFLOW_PAYLOAD();
      const wf = await client.workflows.create(payload);
      createdWorkflowIds.push(wf.id);

      const fetched = await client.workflows.get(wf.id);

      expect(fetched.id).toBe(wf.id);
      expect(fetched.name).toBe(payload.name);
      expect(typeof fetched.trigger_type).toBe('string');
      expect(fetched.trigger_type).toBe('manual');
      expect(typeof fetched.trigger_config).toBe('object');
      expect(Array.isArray(fetched.steps)).toBe(true);
      expect(typeof fetched.enabled).toBe('boolean');
      expect(typeof fetched.created_at).toBe('string');
      expect(typeof fetched.updated_at).toBe('string');
    });

    it('should throw on non-existent ID', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.workflows.get('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('should create a workflow and confirm via get()', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const payload = MANUAL_WORKFLOW_PAYLOAD();
      const wf = await client.workflows.create(payload);
      createdWorkflowIds.push(wf.id);

      expect(typeof wf.id).toBe('string');
      expect(wf.name).toBe(payload.name);
      expect(wf.trigger_type).toBe('manual');
      expect(wf.enabled).toBe(true);

      // Confirm persistence
      const fetched = await client.workflows.get(wf.id);
      expect(fetched.id).toBe(wf.id);
      expect(fetched.name).toBe(payload.name);
    });

    it('should create a workflow with steps', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const payload = WAIT_DELAY_WORKFLOW_PAYLOAD();
      const wf = await client.workflows.create(payload);
      createdWorkflowIds.push(wf.id);

      expect(wf.id).toBeDefined();
      expect(Array.isArray(wf.steps)).toBe(true);
      expect(wf.steps.length).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------

  describe('update', () => {
    it('should update workflow name and get() reflects the change', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const wf = await client.workflows.create(MANUAL_WORKFLOW_PAYLOAD());
      createdWorkflowIds.push(wf.id);

      const newName = uniqueName('wf_updated');
      const updated = await client.workflows.update(wf.id, { name: newName });

      expect(updated.name).toBe(newName);

      const fetched = await client.workflows.get(wf.id);
      expect(fetched.name).toBe(newName);
    });

    it('should update enabled state', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const wf = await client.workflows.create(MANUAL_WORKFLOW_PAYLOAD());
      createdWorkflowIds.push(wf.id);

      const updated = await client.workflows.update(wf.id, { enabled: false });
      expect(updated.enabled).toBe(false);

      const fetched = await client.workflows.get(wf.id);
      expect(fetched.enabled).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------

  describe('delete', () => {
    it('should delete a workflow; get() then throws 404', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const wf = await client.workflows.create(MANUAL_WORKFLOW_PAYLOAD());
      // Don't push to createdWorkflowIds — we're deleting it here
      await client.workflows.delete(wf.id);

      await expect(client.workflows.get(wf.id)).rejects.toThrow();
    });

    it('should throw on deleting a non-existent workflow', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.workflows.delete('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // trigger
  // -------------------------------------------------------------------------

  describe('trigger', () => {
    it('should return WorkflowTriggerResponse with message and instance_id', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const wf = await client.workflows.create(MANUAL_WORKFLOW_PAYLOAD());
      createdWorkflowIds.push(wf.id);

      const result = await client.workflows.trigger(wf.id);

      expect(typeof result.message).toBe('string');
      expect(typeof result.instance_id).toBe('string');
    });

    it('should throw 404 when triggering a deleted workflow', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const wf = await client.workflows.create(MANUAL_WORKFLOW_PAYLOAD());
      await client.workflows.delete(wf.id);

      await expect(client.workflows.trigger(wf.id)).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // listInstances
  // -------------------------------------------------------------------------

  describe('listInstances', () => {
    it('should return WorkflowInstanceListResponse including the triggered instance', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const wf = await client.workflows.create(MANUAL_WORKFLOW_PAYLOAD());
      createdWorkflowIds.push(wf.id);

      const { instance_id } = await client.workflows.trigger(wf.id);

      // Poll until the instance appears
      let found = false;
      await waitFor(async () => {
        const result = await client.workflows.listInstances(wf.id);
        found = result.items.some((i) => i.id === instance_id);
        return found;
      }, 10000, 300);

      expect(found).toBe(true);
    });

    it('should return correct response shape', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const wf = await client.workflows.create(MANUAL_WORKFLOW_PAYLOAD());
      createdWorkflowIds.push(wf.id);

      await client.workflows.trigger(wf.id);

      const result = await client.workflows.listInstances(wf.id);
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');

      if (result.items.length > 0) {
        const instance = result.items[0];
        expect(typeof instance.id).toBe('string');
        expect(typeof instance.workflow_id).toBe('string');
        expect(typeof instance.status).toBe('string');
      }
    });

    it('should support status filter', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const wf = await client.workflows.create(MANUAL_WORKFLOW_PAYLOAD());
      createdWorkflowIds.push(wf.id);

      await client.workflows.trigger(wf.id);

      // Filter accepted without error; all returned items match status
      const result = await client.workflows.listInstances(wf.id, { status: 'completed' });
      expect(Array.isArray(result.items)).toBe(true);
      for (const item of result.items) {
        expect(item.status).toBe('completed');
      }
    });
  });

  // -------------------------------------------------------------------------
  // getInstance
  // -------------------------------------------------------------------------

  describe('getInstance', () => {
    it('should return WorkflowInstanceDetail with step_logs array', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const wf = await client.workflows.create(MANUAL_WORKFLOW_PAYLOAD());
      createdWorkflowIds.push(wf.id);

      const { instance_id } = await client.workflows.trigger(wf.id);

      // Wait for instance to settle (completed or failed)
      await waitFor(async () => {
        const detail = await client.workflows.getInstance(instance_id);
        return ['completed', 'failed', 'cancelled', 'waiting'].includes(detail.status);
      }, 10000, 300);

      const detail = await client.workflows.getInstance(instance_id);

      expect(typeof detail.id).toBe('string');
      expect(detail.id).toBe(instance_id);
      expect(typeof detail.workflow_id).toBe('string');
      expect(typeof detail.status).toBe('string');
      expect(Array.isArray(detail.step_logs)).toBe(true);
    });

    it('should throw on non-existent instance ID', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.workflows.getInstance('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // cancelInstance
  // -------------------------------------------------------------------------

  describe('cancelInstance', () => {
    it('should cancel a waiting instance; getInstance shows cancelled', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // Wait-delay workflow → instance enters 'waiting' immediately
      const wf = await client.workflows.create(WAIT_DELAY_WORKFLOW_PAYLOAD());
      createdWorkflowIds.push(wf.id);

      const { instance_id } = await client.workflows.trigger(wf.id);

      // Wait for 'waiting' or 'running' status
      await waitFor(async () => {
        const detail = await client.workflows.getInstance(instance_id);
        return detail.status === 'waiting' || detail.status === 'running';
      }, 10000, 300);

      const cancelled = await client.workflows.cancelInstance(instance_id);
      expect(cancelled.status).toBe('cancelled');

      const detail = await client.workflows.getInstance(instance_id);
      expect(detail.status).toBe('cancelled');
    }, 20000);

    it('should throw on non-existent instance ID', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.workflows.cancelInstance('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // retryInstance (maps to /resume)
  // -------------------------------------------------------------------------

  describe('retryInstance', () => {
    it('should throw on non-existent instance ID', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.workflows.retryInstance('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });

    it('should throw when attempting to resume a cancelled instance', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // Create a wait-delay workflow, trigger, then cancel the instance
      const wf = await client.workflows.create(WAIT_DELAY_WORKFLOW_PAYLOAD());
      createdWorkflowIds.push(wf.id);

      const { instance_id } = await client.workflows.trigger(wf.id);

      await waitFor(async () => {
        const detail = await client.workflows.getInstance(instance_id);
        return detail.status === 'waiting' || detail.status === 'running';
      }, 10000, 300);

      await client.workflows.cancelInstance(instance_id);

      // Resuming a cancelled instance should be rejected by the backend
      await expect(
        client.workflows.retryInstance(instance_id)
      ).rejects.toThrow();
    }, 20000);
  });
});
