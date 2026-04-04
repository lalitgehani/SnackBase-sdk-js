/**
 * RealTimeService integration tests — F7.3: RealTimeService Full Coverage
 *
 * Tests require superadmin authentication (SNACKBASE_API_KEY).
 *
 * Node.js version requirement:
 *   RealTimeService prefers WebSocket over SSE. WebSocket is a global in Node.js 21+.
 *   On Node.js 18 the service falls back to SSE, where subscriptions are encoded in
 *   the connection URL at connect time — post-connect subscribe() calls are not sent
 *   to the server and event-delivery tests will time out. Run these tests on Node 21+.
 *
 * Backend endpoints used:
 *   WebSocket: ws://host/api/v1/realtime/ws?token=<JWT>
 *   SSE:       GET /api/v1/realtime/subscribe?token=<JWT>&collections=<col>
 *
 * Each test:
 *   - Creates a fresh client, registers + logs in a user, and creates a unique collection.
 *   - Skips silently when SNACKBASE_API_KEY is absent (no user verification possible).
 *   - Disconnects and cleans up all created resources in afterEach.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import {
  createTestClient,
  createTestEmail,
  createTestAccountName,
  createTestCollectionName,
  verifyUser,
  trackUser,
  trackCollection,
  cleanupTestResources,
  waitFor,
  TEST_CONFIG,
} from './setup';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shared per-test state */
interface TestContext {
  client: SnackBaseClient;
  testCollectionName: string;
}

async function setupAuth(ctx: TestContext) {
  const email = createTestEmail();
  const password = 'TestPass123!';
  const account_name = createTestAccountName();
  const account_slug = account_name.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');

  ctx.client = createTestClient();

  const authState = await ctx.client.auth.register({ email, password, account_name });
  // Track immediately so cleanup runs even if subsequent steps throw
  trackUser(authState.user!.id);

  ctx.testCollectionName = createTestCollectionName();
  const collection = await ctx.client.collections.create({
    name: ctx.testCollectionName,
    fields: [{ name: 'title', type: 'text', required: true }],
    list_rule: '@request.auth.id != ""',
    view_rule: '@request.auth.id != ""',
    create_rule: '@request.auth.id != ""',
    update_rule: '@request.auth.id != ""',
    delete_rule: '@request.auth.id != ""',
  });
  trackCollection(collection.id);

  await verifyUser(authState.user!.id);
  await ctx.client.auth.login({ email, password, account: account_slug });
}

async function teardownAuth(ctx: TestContext) {
  if (!ctx.client) return;
  try {
    ctx.client.realtime.disconnect();
  } catch {
    // Already disconnected or never connected — safe to ignore
  }
  await cleanupTestResources(ctx.client);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('RealTimeService Integration Tests', () => {
  // ---------------------------------------------------------------------------
  // 1. Connection lifecycle
  // ---------------------------------------------------------------------------

  describe('connection lifecycle', () => {
    const ctx: TestContext = {} as TestContext;

    beforeEach(async () => {
      if (!TEST_CONFIG.apiKey) return;
      await setupAuth(ctx);
    });

    afterEach(async () => {
      if (!TEST_CONFIG.apiKey) return;
      await teardownAuth(ctx);
    });

    it('getState() returns "disconnected" on a fresh client', () => {
      if (!TEST_CONFIG.apiKey) return;
      expect(ctx.client.realtime.getState()).toBe('disconnected');
    });

    it('connect() transitions state to "connected"', async () => {
      if (!TEST_CONFIG.apiKey) return;
      await ctx.client.realtime.connect();
      expect(ctx.client.realtime.getState()).toBe('connected');
    });

    it('disconnect() transitions state to "disconnected"', async () => {
      if (!TEST_CONFIG.apiKey) return;
      await ctx.client.realtime.connect();
      ctx.client.realtime.disconnect();
      expect(ctx.client.realtime.getState()).toBe('disconnected');
    });

    it('disconnect() does not throw when connected', async () => {
      if (!TEST_CONFIG.apiKey) return;
      await ctx.client.realtime.connect();
      expect(() => ctx.client.realtime.disconnect()).not.toThrow();
    });

    it('disconnect() clears all active subscriptions', async () => {
      if (!TEST_CONFIG.apiKey) return;
      await ctx.client.realtime.connect();
      await ctx.client.realtime.subscribe(ctx.testCollectionName);
      expect(ctx.client.realtime.getSubscriptions()).toContain(ctx.testCollectionName);

      ctx.client.realtime.disconnect();
      expect(ctx.client.realtime.getSubscriptions()).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Subscription management
  // ---------------------------------------------------------------------------

  describe('subscription management', () => {
    const ctx: TestContext = {} as TestContext;

    beforeEach(async () => {
      if (!TEST_CONFIG.apiKey) return;
      await setupAuth(ctx);
      await ctx.client.realtime.connect();
    });

    afterEach(async () => {
      if (!TEST_CONFIG.apiKey) return;
      await teardownAuth(ctx);
    });

    it('getSubscriptions() returns empty array on a fresh connection', () => {
      if (!TEST_CONFIG.apiKey) return;
      expect(ctx.client.realtime.getSubscriptions()).toEqual([]);
    });

    it('subscribe() adds the collection to getSubscriptions()', async () => {
      if (!TEST_CONFIG.apiKey) return;
      await ctx.client.realtime.subscribe(ctx.testCollectionName);
      expect(ctx.client.realtime.getSubscriptions()).toContain(ctx.testCollectionName);
    });

    it('subscribe() with explicit operations resolves and adds collection', async () => {
      if (!TEST_CONFIG.apiKey) return;
      await ctx.client.realtime.subscribe(ctx.testCollectionName, ['create', 'update']);
      expect(ctx.client.realtime.getSubscriptions()).toContain(ctx.testCollectionName);
    });

    it('unsubscribe() removes the collection from getSubscriptions()', async () => {
      if (!TEST_CONFIG.apiKey) return;
      await ctx.client.realtime.subscribe(ctx.testCollectionName);
      expect(ctx.client.realtime.getSubscriptions()).toContain(ctx.testCollectionName);

      await ctx.client.realtime.unsubscribe(ctx.testCollectionName);
      expect(ctx.client.realtime.getSubscriptions()).not.toContain(ctx.testCollectionName);
    });

    it('unsubscribe() on an unregistered collection does not throw', async () => {
      if (!TEST_CONFIG.apiKey) return;
      await expect(
        ctx.client.realtime.unsubscribe('nonexistent_collection')
      ).resolves.not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. End-to-end event delivery
  // ---------------------------------------------------------------------------

  describe('end-to-end event delivery', () => {
    const ctx: TestContext = {} as TestContext;

    beforeEach(async () => {
      if (!TEST_CONFIG.apiKey) return;
      await setupAuth(ctx);
      await ctx.client.realtime.connect();
      await ctx.client.realtime.subscribe(ctx.testCollectionName);
    });

    afterEach(async () => {
      if (!TEST_CONFIG.apiKey) return;
      await teardownAuth(ctx);
    });

    it('on("col.create") handler is called when a record is created', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const received: any[] = [];
      const handler = (data: any) => received.push(data);
      ctx.client.realtime.on(`${ctx.testCollectionName}.create`, handler);

      await ctx.client.records.create(ctx.testCollectionName, { title: 'RT Create Test' });
      await waitFor(() => received.length > 0, 10000);

      expect(received[0]).toBeDefined();
      ctx.client.realtime.off(`${ctx.testCollectionName}.create`, handler);
    });

    it('on("col.update") handler is called when a record is updated', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const record = await ctx.client.records.create(ctx.testCollectionName, {
        title: 'Before Update',
      });

      const received: any[] = [];
      const handler = (data: any) => received.push(data);
      ctx.client.realtime.on(`${ctx.testCollectionName}.update`, handler);

      await ctx.client.records.update(ctx.testCollectionName, record.id, {
        title: 'After Update',
      });
      await waitFor(() => received.length > 0, 10000);

      expect(received[0]).toBeDefined();
      ctx.client.realtime.off(`${ctx.testCollectionName}.update`, handler);
    });

    it('on("col.delete") handler is called when a record is deleted', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const record = await ctx.client.records.create(ctx.testCollectionName, {
        title: 'To Delete',
      });

      const received: any[] = [];
      const handler = (data: any) => received.push(data);
      ctx.client.realtime.on(`${ctx.testCollectionName}.delete`, handler);

      await ctx.client.records.delete(ctx.testCollectionName, record.id);
      await waitFor(() => received.length > 0, 10000);

      expect(received[0]).toBeDefined();
      ctx.client.realtime.off(`${ctx.testCollectionName}.delete`, handler);
    });

    it('on("col.*") collection wildcard fires for any operation', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const received: any[] = [];
      const handler = (data: any) => received.push(data);
      ctx.client.realtime.on(`${ctx.testCollectionName}.*`, handler);

      await ctx.client.records.create(ctx.testCollectionName, { title: 'RT Wildcard Test' });
      await waitFor(() => received.length > 0, 10000);

      expect(received[0]).toBeDefined();
      ctx.client.realtime.off(`${ctx.testCollectionName}.*`, handler);
    });

    it('on("*") global wildcard fires for any operation', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const received: any[] = [];
      const handler = (data: any) => received.push(data);
      ctx.client.realtime.on('*', handler);

      await ctx.client.records.create(ctx.testCollectionName, { title: 'RT Global Wildcard' });
      await waitFor(() => received.length > 0, 10000);

      expect(received[0]).toBeDefined();
      ctx.client.realtime.off('*', handler);
    });

    it('handler receives the correct record data shape on create', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const received: any[] = [];
      const handler = (data: any) => received.push(data);
      ctx.client.realtime.on(`${ctx.testCollectionName}.create`, handler);

      await ctx.client.records.create(ctx.testCollectionName, { title: 'RT Shape Test' });
      await waitFor(() => received.length > 0, 10000);

      const event = received[0];
      expect(event).toBeDefined();
      expect(typeof event.id).toBe('string');
      expect(event.title).toBe('RT Shape Test');

      ctx.client.realtime.off(`${ctx.testCollectionName}.create`, handler);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Event removal: off()
  // ---------------------------------------------------------------------------

  describe('event removal: off()', () => {
    const ctx: TestContext = {} as TestContext;

    beforeEach(async () => {
      if (!TEST_CONFIG.apiKey) return;
      await setupAuth(ctx);
      await ctx.client.realtime.connect();
      await ctx.client.realtime.subscribe(ctx.testCollectionName);
    });

    afterEach(async () => {
      if (!TEST_CONFIG.apiKey) return;
      await teardownAuth(ctx);
    });

    it('off() prevents handler from being called on subsequent events', async () => {
      if (!TEST_CONFIG.apiKey) return;

      let callCount = 0;
      const handler = () => { callCount++; };
      const eventName = `${ctx.testCollectionName}.create`;

      // Baseline: verify the handler fires before we remove it
      ctx.client.realtime.on(eventName, handler);
      await ctx.client.records.create(ctx.testCollectionName, { title: 'Baseline' });
      await waitFor(() => callCount > 0, 10000);
      expect(callCount).toBe(1);

      // Remove the handler, then create another record
      ctx.client.realtime.off(eventName, handler);
      await ctx.client.records.create(ctx.testCollectionName, { title: 'After off' });
      await new Promise((r) => setTimeout(r, 2000));

      expect(callCount).toBe(1); // Must not have increased
    });

    it('unsubscribe function returned by on() also removes the handler', async () => {
      if (!TEST_CONFIG.apiKey) return;

      let callCount = 0;
      const eventName = `${ctx.testCollectionName}.create`;

      // Baseline: verify the handler fires, storing the returned unsub fn
      const unsub = ctx.client.realtime.on(eventName, () => { callCount++; });
      await ctx.client.records.create(ctx.testCollectionName, { title: 'Baseline unsub' });
      await waitFor(() => callCount > 0, 10000);
      expect(callCount).toBe(1);

      // Use the returned function to remove the handler
      unsub();
      await ctx.client.records.create(ctx.testCollectionName, { title: 'After unsub fn' });
      await new Promise((r) => setTimeout(r, 2000));

      expect(callCount).toBe(1);
    });

    it('off() only removes the specified handler, not other handlers on the same event', async () => {
      if (!TEST_CONFIG.apiKey) return;

      let countA = 0;
      let countB = 0;
      const eventName = `${ctx.testCollectionName}.create`;
      const handlerA = () => { countA++; };
      const handlerB = () => { countB++; };

      ctx.client.realtime.on(eventName, handlerA);
      ctx.client.realtime.on(eventName, handlerB);

      // Remove only A
      ctx.client.realtime.off(eventName, handlerA);

      await ctx.client.records.create(ctx.testCollectionName, { title: 'Only B' });
      await waitFor(() => countB > 0, 10000);

      expect(countB).toBeGreaterThan(0); // B was called
      expect(countA).toBe(0);           // A was NOT called

      ctx.client.realtime.off(eventName, handlerB);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Reconnect after disconnect
  // ---------------------------------------------------------------------------

  describe('reconnect after disconnect', () => {
    const ctx: TestContext = {} as TestContext;

    beforeEach(async () => {
      if (!TEST_CONFIG.apiKey) return;
      await setupAuth(ctx);
    });

    afterEach(async () => {
      if (!TEST_CONFIG.apiKey) return;
      await teardownAuth(ctx);
    });

    it('can reconnect after an explicit disconnect', async () => {
      if (!TEST_CONFIG.apiKey) return;
      await ctx.client.realtime.connect();
      expect(ctx.client.realtime.getState()).toBe('connected');

      ctx.client.realtime.disconnect();
      expect(ctx.client.realtime.getState()).toBe('disconnected');

      await ctx.client.realtime.connect();
      expect(ctx.client.realtime.getState()).toBe('connected');
    });

    it('subscriptions are NOT restored after disconnect + reconnect', async () => {
      if (!TEST_CONFIG.apiKey) return;
      await ctx.client.realtime.connect();
      await ctx.client.realtime.subscribe(ctx.testCollectionName);
      expect(ctx.client.realtime.getSubscriptions()).toContain(ctx.testCollectionName);

      ctx.client.realtime.disconnect();
      await ctx.client.realtime.connect();

      // disconnect() clears the subscription set — reconnect does not replay them
      expect(ctx.client.realtime.getSubscriptions()).toHaveLength(0);
    });

    it('can subscribe again after reconnect', async () => {
      if (!TEST_CONFIG.apiKey) return;
      await ctx.client.realtime.connect();
      ctx.client.realtime.disconnect();

      await ctx.client.realtime.connect();
      await ctx.client.realtime.subscribe(ctx.testCollectionName);
      expect(ctx.client.realtime.getSubscriptions()).toContain(ctx.testCollectionName);
    });

    it('events arrive after reconnect + re-subscribe', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await ctx.client.realtime.connect();
      ctx.client.realtime.disconnect();
      await ctx.client.realtime.connect();
      await ctx.client.realtime.subscribe(ctx.testCollectionName);

      const received: any[] = [];
      const handler = (data: any) => received.push(data);
      ctx.client.realtime.on(`${ctx.testCollectionName}.create`, handler);

      await ctx.client.records.create(ctx.testCollectionName, { title: 'After Reconnect' });
      await waitFor(() => received.length > 0, 10000);

      expect(received[0]).toBeDefined();
      ctx.client.realtime.off(`${ctx.testCollectionName}.create`, handler);
    }, 15000);
  });
});
