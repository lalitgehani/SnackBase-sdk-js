/**
 * WebhookService integration tests — F5.1: WebhookService Full Coverage
 *
 * Tests require superadmin authentication (SNACKBASE_API_KEY).
 * Each test that creates a webhook cleans it up in afterEach.
 *
 * Backend response shapes:
 *   list:           { items: Webhook[], total: number }
 *   get:            Webhook  (secret NOT included)
 *   create:         WebhookCreateResponse (secret returned once only)
 *   update:         Webhook
 *   delete:         204 No Content
 *   test:           WebhookTestResponse  (ephemeral — NO delivery record is created)
 *   listDeliveries: { items: WebhookDelivery[], total: number }
 *
 * IMPORTANT: test() makes a synchronous inline HTTP call to the destination URL
 * and returns the result directly. It does NOT create a delivery record in the DB.
 * Delivery records are only created by real record lifecycle events (create/update/delete).
 *
 * Test URL: http://localhost:8090/health — backend's own health endpoint.
 * Localhost is allowed in development mode.
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

const TEST_WEBHOOK_URL = `${TEST_CONFIG.baseUrl}/health`;
const TEST_WEBHOOK_URL_UPDATED = `${TEST_CONFIG.baseUrl}/ready`;
const TEST_COLLECTION = 'users';

function createTestWebhookPayload(overrides: Record<string, unknown> = {}) {
  return {
    url: TEST_WEBHOOK_URL,
    collection: TEST_COLLECTION,
    events: ['create'] as const,
    enabled: true,
    ...overrides,
  };
}

describe('WebhookService Integration Tests', () => {
  let client: SnackBaseClient;
  const createdWebhookIds: string[] = [];

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
        // already deleted — ignore
      }
    }
    createdWebhookIds.length = 0;
  });

  describe('list', () => {
    it('should return a paginated response with items array and total', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.webhooks.list();

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(typeof result.total).toBe('number');
    });

    it('should include a newly created webhook in the list', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.webhooks.create(createTestWebhookPayload());
      createdWebhookIds.push(created.id);

      const result = await client.webhooks.list();
      const found = result.items.find((w) => w.id === created.id);

      expect(found).toBeDefined();
      expect(found!.url).toBe(TEST_WEBHOOK_URL);
      expect(found!.collection).toBe(TEST_COLLECTION);
    });

    it('should support pagination params', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.webhooks.list({ page: 1, page_size: 5 });

      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBeLessThanOrEqual(5);
    });
  });

  describe('get', () => {
    it('should return full webhook config including url, collection, events, and enabled', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.webhooks.create(
        createTestWebhookPayload({ events: ['create', 'update'] })
      );
      createdWebhookIds.push(created.id);

      const fetched = await client.webhooks.get(created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.url).toBe(TEST_WEBHOOK_URL);
      expect(fetched.collection).toBe(TEST_COLLECTION);
      expect(fetched.events).toContain('create');
      expect(fetched.events).toContain('update');
      expect(fetched.enabled).toBe(true);
      expect(fetched.account_id).toBeDefined();
      expect(fetched.created_at).toBeDefined();
      expect(fetched.updated_at).toBeDefined();
    });

    it('should NOT include the signing secret in get() response', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.webhooks.create(createTestWebhookPayload());
      createdWebhookIds.push(created.id);

      const fetched = await client.webhooks.get(created.id);

      // Secret is returned only at create time; subsequent get should not include it
      expect((fetched as any).secret).toBeUndefined();
    });

    it('should throw for a non-existent webhook ID', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.webhooks.get('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should return the created webhook with a one-time signing secret', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.webhooks.create(createTestWebhookPayload());
      createdWebhookIds.push(created.id);

      expect(created.id).toBeDefined();
      expect(created.url).toBe(TEST_WEBHOOK_URL);
      expect(created.collection).toBe(TEST_COLLECTION);
      expect(created.events).toContain('create');
      expect(created.enabled).toBe(true);
      // Secret is returned once at creation
      expect(created.secret).toBeDefined();
      expect(created.secret.length).toBeGreaterThan(10);
    });

    it('should confirm the webhook exists via get() after create', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.webhooks.create(createTestWebhookPayload());
      createdWebhookIds.push(created.id);

      const fetched = await client.webhooks.get(created.id);
      expect(fetched.id).toBe(created.id);
      expect(fetched.url).toBe(created.url);
      expect(fetched.collection).toBe(created.collection);
    });

    it('should create a webhook with enabled=false when specified', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.webhooks.create(
        createTestWebhookPayload({ enabled: false })
      );
      createdWebhookIds.push(created.id);

      expect(created.enabled).toBe(false);
      const fetched = await client.webhooks.get(created.id);
      expect(fetched.enabled).toBe(false);
    });

    it('should create a webhook with all three event types', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.webhooks.create(
        createTestWebhookPayload({ events: ['create', 'update', 'delete'] })
      );
      createdWebhookIds.push(created.id);

      expect(created.events).toContain('create');
      expect(created.events).toContain('update');
      expect(created.events).toContain('delete');
    });
  });

  describe('update', () => {
    it('should update the webhook URL and reflect it in get()', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.webhooks.create(createTestWebhookPayload());
      createdWebhookIds.push(created.id);

      const updated = await client.webhooks.update(created.id, {
        url: TEST_WEBHOOK_URL_UPDATED,
      });

      expect(updated.url).toBe(TEST_WEBHOOK_URL_UPDATED);

      const fetched = await client.webhooks.get(created.id);
      expect(fetched.url).toBe(TEST_WEBHOOK_URL_UPDATED);
    });

    it('should update the events and reflect the change in get()', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.webhooks.create(
        createTestWebhookPayload({ events: ['create'] })
      );
      createdWebhookIds.push(created.id);

      await client.webhooks.update(created.id, { events: ['update', 'delete'] });

      const fetched = await client.webhooks.get(created.id);
      expect(fetched.events).toContain('update');
      expect(fetched.events).toContain('delete');
      expect(fetched.events).not.toContain('create');
    });

    it('should toggle enabled state via update', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.webhooks.create(
        createTestWebhookPayload({ enabled: true })
      );
      createdWebhookIds.push(created.id);

      await client.webhooks.update(created.id, { enabled: false });
      const disabled = await client.webhooks.get(created.id);
      expect(disabled.enabled).toBe(false);

      await client.webhooks.update(created.id, { enabled: true });
      const enabled = await client.webhooks.get(created.id);
      expect(enabled.enabled).toBe(true);
    });
  });

  describe('delete', () => {
    it('should return success and make get() throw 404 afterwards', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.webhooks.create(createTestWebhookPayload());
      // Not pushed to createdWebhookIds — we delete it in this test

      const result = await client.webhooks.delete(created.id);
      expect(result.success).toBe(true);

      await expect(client.webhooks.get(created.id)).rejects.toThrow();
    });

    it('should no longer appear in list() after delete', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.webhooks.create(createTestWebhookPayload());
      await client.webhooks.delete(created.id);

      const result = await client.webhooks.list();
      const found = result.items.find((w) => w.id === created.id);
      expect(found).toBeUndefined();
    });
  });

  describe('test', () => {
    it('should return a WebhookTestResponse with required fields', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.webhooks.create(createTestWebhookPayload());
      createdWebhookIds.push(created.id);

      const testResult = await client.webhooks.test(created.id);

      expect(testResult).toBeDefined();
      expect(typeof testResult.success).toBe('boolean');
      // status_code may be null if delivery failed entirely, but field must exist
      expect('status_code' in testResult).toBe(true);
      expect('response_body' in testResult).toBe(true);
      expect('error' in testResult).toBe(true);
    });

    it('should NOT create a delivery record — listDeliveries remains empty after test()', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.webhooks.create(createTestWebhookPayload());
      createdWebhookIds.push(created.id);

      await client.webhooks.test(created.id);

      // test() is ephemeral: it makes a synchronous inline HTTP call and returns
      // the result directly without writing a delivery record to the database.
      const deliveries = await client.webhooks.listDeliveries(created.id);
      expect(deliveries.items).toHaveLength(0);
      expect(deliveries.total).toBe(0);
    });
  });

  describe('listDeliveries', () => {
    it('should return items array and total for a webhook with no deliveries', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.webhooks.create(createTestWebhookPayload());
      createdWebhookIds.push(created.id);

      const deliveries = await client.webhooks.listDeliveries(created.id);

      expect(deliveries.items).toBeInstanceOf(Array);
      expect(typeof deliveries.total).toBe('number');
    });

    it('should return delivery with correct shape after a real record create event', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // Create a dedicated collection so we control exactly which events fire
      const collectionName = createTestCollectionName();
      const collection = await client.collections.create({
        name: collectionName,
        fields: [{ name: 'title', type: 'text', required: true }],
        // Open rules so the API-key client can create records without user auth
        create_rule: null,
      });
      trackCollection(collection.id);

      // Create a webhook watching this collection for create events
      const webhook = await client.webhooks.create({
        url: TEST_WEBHOOK_URL,
        collection: collectionName,
        events: ['create'],
      });
      createdWebhookIds.push(webhook.id);

      // Creating a record dispatches a delivery record to the DB synchronously
      // (the background job processes the HTTP call later, but the DB record is immediate)
      await client.records.create(collectionName, { title: 'trigger event' });

      // Poll until the delivery record appears
      await waitFor(async () => {
        const deliveries = await client.webhooks.listDeliveries(webhook.id);
        return deliveries.total >= 1;
      });

      const deliveries = await client.webhooks.listDeliveries(webhook.id);
      expect(deliveries.total).toBeGreaterThanOrEqual(1);

      const delivery = deliveries.items[0];
      expect(delivery.id).toBeDefined();
      expect(delivery.webhook_id).toBe(webhook.id);
      expect(delivery.event).toBeDefined();
      expect(delivery.status).toBeDefined();
      expect(delivery.created_at).toBeDefined();
      expect(typeof delivery.attempt_number).toBe('number');
    });

    it('should support pagination params', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.webhooks.create(createTestWebhookPayload());
      createdWebhookIds.push(created.id);

      const deliveries = await client.webhooks.listDeliveries(created.id, {
        page: 1,
        page_size: 10,
      });

      expect(deliveries.items).toBeInstanceOf(Array);
    });
  });
});
