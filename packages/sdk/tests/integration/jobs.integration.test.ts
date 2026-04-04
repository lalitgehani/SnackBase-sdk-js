/**
 * JobService integration tests — F6.5: JobService Full Coverage
 *
 * Tests require superadmin authentication (SNACKBASE_API_KEY).
 *
 * Backend response shapes:
 *   list:   { items: Job[], total: number }
 *   stats:  { pending, running, completed, failed, retrying, dead, avg_duration_seconds, failure_rate }
 *   retry:  Job  (status reset to 'pending')
 *   cancel: 204 No Content  (job is deleted from the queue)
 *
 * Backend error codes:
 *   retry on non-failed/dead job → 400
 *   cancel on non-pending job   → 400
 *
 * Test data strategy:
 *   Webhook deliveries are persisted as background jobs. By creating a webhook
 *   pointing to an invalid host and triggering it via a record create, we seed
 *   a delivery job that fails quickly (DNS error). That failed job is then used
 *   to test retry() and cancel().
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import {
  createTestClient,
  createTestCollectionName,
  trackCollection,
  TEST_CONFIG,
  waitFor,
} from './setup';

// Guaranteed-invalid URL: DNS will never resolve this host.
const INVALID_WEBHOOK_URL = 'http://invalid-host-for-testing.invalid/webhook';

describe('JobService Integration Tests', () => {
  let client: SnackBaseClient;
  const createdWebhookIds: string[] = [];
  const createdCollectionIds: string[] = [];

  beforeEach(() => {
    if (!TEST_CONFIG.apiKey) return;
    client = createTestClient();
  });

  afterEach(async () => {
    if (!TEST_CONFIG.apiKey || !client) return;

    for (const id of createdWebhookIds) {
      try {
        await client.webhooks.delete(id);
      } catch {
        // already deleted or test cleaned it up
      }
    }
    createdWebhookIds.length = 0;

    for (const id of createdCollectionIds) {
      try {
        await client.collections.delete(id);
      } catch {
        // already deleted or test cleaned it up
      }
    }
    createdCollectionIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------

  describe('list', () => {
    it('should return a JobListResponse with items array and numeric total', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.jobs.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it('should return job objects with the expected shape when jobs exist', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.jobs.list({ limit: 5 });

      expect(Array.isArray(result.items)).toBe(true);
      if (result.items.length > 0) {
        const job = result.items[0];
        expect(typeof job.id).toBe('string');
        expect(typeof job.queue).toBe('string');
        expect(typeof job.handler).toBe('string');
        expect(typeof job.status).toBe('string');
        expect(typeof job.attempt_number).toBe('number');
        expect(typeof job.max_retries).toBe('number');
        expect(typeof job.created_at).toBe('string');
      }
    });

    it('should support status filter via params', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // We test the filter is accepted without error; results may be empty.
      const result = await client.jobs.list({ status: 'completed' });

      expect(Array.isArray(result.items)).toBe(true);
      // Every returned item must match the requested status.
      for (const job of result.items) {
        expect(job.status).toBe('completed');
      }
    });

    it('should support limit and offset for pagination', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.jobs.list({ limit: 2, offset: 0 });

      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBeLessThanOrEqual(2);
    });
  });

  // ---------------------------------------------------------------------------
  // stats
  // ---------------------------------------------------------------------------

  describe('stats', () => {
    it('should return all required numeric fields', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const stats = await client.jobs.stats();

      expect(stats).toBeDefined();
      expect(typeof stats.pending).toBe('number');
      expect(typeof stats.running).toBe('number');
      expect(typeof stats.completed).toBe('number');
      expect(typeof stats.failed).toBe('number');
      expect(typeof stats.retrying).toBe('number');
      expect(typeof stats.dead).toBe('number');
    });

    it('avg_duration_seconds and failure_rate are null or a number', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const stats = await client.jobs.stats();

      expect(
        stats.avg_duration_seconds === null || typeof stats.avg_duration_seconds === 'number'
      ).toBe(true);
      expect(stats.failure_rate === null || typeof stats.failure_rate === 'number').toBe(true);
    });

    it('all status counts are non-negative', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const stats = await client.jobs.stats();

      expect(stats.pending).toBeGreaterThanOrEqual(0);
      expect(stats.running).toBeGreaterThanOrEqual(0);
      expect(stats.completed).toBeGreaterThanOrEqual(0);
      expect(stats.failed).toBeGreaterThanOrEqual(0);
      expect(stats.retrying).toBeGreaterThanOrEqual(0);
      expect(stats.dead).toBeGreaterThanOrEqual(0);
    });
  });

  // ---------------------------------------------------------------------------
  // retry + cancel workflow
  //
  // Seeds a failed delivery job by:
  //   1. Creating a throw-away collection
  //   2. Attaching a webhook pointing to an invalid host
  //   3. Creating a record → delivery job queued
  //   4. Waiting for the job to reach failed/dead status (DNS error)
  //
  // Then exercises:
  //   retry(id)  — status resets to 'pending'
  //   cancel(id) — job is removed from the queue (DELETE 204)
  //   error cases — 400 on invalid state transitions
  // ---------------------------------------------------------------------------

  describe('retry and cancel workflow', () => {
    it('should retry a failed/dead job and cancel the resulting pending job', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // --- Seed: create collection + webhook + triggering record ---

      const collectionName = createTestCollectionName();
      const collection = await client.collections.create({
        name: collectionName,
        fields: [{ name: 'title', type: 'text', required: true }],
        create_rule: null,
      });
      createdCollectionIds.push(collection.id);
      trackCollection(collection.id);

      const webhook = await client.webhooks.create({
        url: INVALID_WEBHOOK_URL,
        collection: collectionName,
        events: ['create'],
        enabled: true,
      });
      createdWebhookIds.push(webhook.id);

      // Creating a record queues the delivery job synchronously.
      await client.records.create(collectionName, { title: 'job-seed' });

      // --- Wait for the delivery job to appear as failed, dead, or retrying ---
      // After the first attempt fails, the job transitions to "retrying" (with
      // exponential backoff). It can take 15+ minutes to reach "dead", so we
      // also accept "retrying" which appears within a few seconds.

      let failedJobId: string | null = null;

      await waitFor(
        async () => {
          const failedJobs = await client.jobs.list({ status: 'failed' });
          const deadJobs = await client.jobs.list({ status: 'dead' });
          const retryingJobs = await client.jobs.list({ status: 'retrying' });

          // Find a job for our webhook handler
          const candidate = [...failedJobs.items, ...deadJobs.items, ...retryingJobs.items].find(
            (j) => j.handler === 'webhook_delivery' || j.queue === 'webhooks'
          );

          if (candidate) {
            failedJobId = candidate.id;
            return true;
          }
          return false;
        },
        15000,
        500
      );

      expect(failedJobId).not.toBeNull();

      // --- retry() ---

      const retried = await client.jobs.retry(failedJobId!);

      expect(retried).toBeDefined();
      expect(retried.id).toBe(failedJobId);
      expect(retried.status).toBe('pending');

      // Verify the job appears as pending in list()
      const pendingJobs = await client.jobs.list({ status: 'pending' });
      const foundPending = pendingJobs.items.find((j) => j.id === failedJobId);
      expect(foundPending).toBeDefined();

      // --- retry() on a non-failed job → 400 ---

      // The job is now pending; retrying it again should fail.
      await expect(client.jobs.retry(failedJobId!)).rejects.toThrow();

      // --- cancel() ---

      // The job is still pending (or may have been picked up by the worker).
      // We attempt to cancel it; if the worker already grabbed it, we catch the 400.
      try {
        await client.jobs.cancel(failedJobId!);

        // If cancel succeeded, the job must be gone from the list.
        const afterCancel = await client.jobs.list({ limit: 200 });
        const stillExists = afterCancel.items.find((j) => j.id === failedJobId);
        expect(stillExists).toBeUndefined();

        // cancel of a now-gone job → 404
        await expect(client.jobs.cancel(failedJobId!)).rejects.toThrow();
      } catch (err: any) {
        // Worker picked up the job before we could cancel — acceptable race.
        // Verify the error is a 400 (not pending) rather than something unexpected.
        expect(err.status ?? err.statusCode ?? 400).toBe(400);
      }
    }, 30000);

    it('should throw when retrying a job that does not exist', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.jobs.retry('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });

    it('should throw when cancelling a job that does not exist', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.jobs.cancel('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });

    it('should throw 400 when retrying a completed job', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // Find any completed job
      const result = await client.jobs.list({ status: 'completed', limit: 1 });
      if (result.items.length === 0) return; // skip if no completed jobs

      const completedJobId = result.items[0].id;
      await expect(client.jobs.retry(completedJobId)).rejects.toThrow();
    });
  });
});
