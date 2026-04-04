/**
 * EndpointService integration tests — F5.3: EndpointService Full Coverage
 *
 * Tests require superadmin authentication (SNACKBASE_API_KEY).
 * Each test that creates an endpoint cleans it up in afterEach.
 *
 * Backend response shapes:
 *   list:           { items: Endpoint[], total: number }
 *   get:            Endpoint
 *   create:         Endpoint (201 Created)
 *   update:         Endpoint
 *   delete:         204 No Content  →  SDK wraps as { success: true }
 *   toggle:         Endpoint (enabled state flipped)
 *   listExecutions: { items: EndpointExecution[], total: number }
 *
 * Execution URL pattern: /api/v1/x/{account_id}/{path}
 * Custom endpoints with auth_required=false can be invoked without a token.
 *
 * Backend unique constraint: (account_id, path, method) — every test uses a
 * unique path via createTestEndpointPath() to avoid 409 conflicts.
 *
 * Reserved path prefixes (must NOT be used in endpoint path):
 *   /auth, /collections, /accounts, /users, /roles, /permissions, /macros,
 *   /groups, /invitations, /api-keys, /dashboard, /audit-logs, /migrations,
 *   /admin, /oauth, /saml, /collection-rules, /email-templates, /files,
 *   /realtime, /webhooks, /jobs, /hooks, /endpoints, /records, /x
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import { createTestClient, TEST_CONFIG, waitFor } from './setup';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTestEndpointPath() {
  return `/test-ep-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

function createTestEndpointName() {
  return `Test Endpoint ${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

function createTestEndpointPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: createTestEndpointName(),
    method: 'GET',
    path: createTestEndpointPath(),
    enabled: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EndpointService Integration Tests', () => {
  let client: SnackBaseClient;
  const createdEndpointIds: string[] = [];

  beforeEach(() => {
    if (!TEST_CONFIG.apiKey) return;
    client = createTestClient();
  });

  afterEach(async () => {
    if (!TEST_CONFIG.apiKey || !client) return;
    for (const id of createdEndpointIds) {
      try {
        await client.endpoints.delete(id);
      } catch {
        // already deleted — ignore
      }
    }
    createdEndpointIds.length = 0;
  });

  // -------------------------------------------------------------------------
  // list
  // -------------------------------------------------------------------------

  describe('list', () => {
    it('should return a paginated response with items array and total', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.endpoints.list();

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(typeof result.total).toBe('number');
    });

    it('should include a newly created endpoint in the list', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const payload = createTestEndpointPayload();
      const created = await client.endpoints.create(payload as any);
      createdEndpointIds.push(created.id);

      const result = await client.endpoints.list();
      const found = result.items.find((e) => e.id === created.id);

      expect(found).toBeDefined();
      expect(found!.path).toBe(payload.path);
      expect(found!.method).toBe(payload.method);
      expect(found!.name).toBe(payload.name);
    });

    it('should support pagination params', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.endpoints.list({ page: 1, page_size: 5 });

      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBeLessThanOrEqual(5);
    });
  });

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------

  describe('get', () => {
    it('should return endpoint with all core fields', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const payload = createTestEndpointPayload({ method: 'POST' });
      const created = await client.endpoints.create(payload as any);
      createdEndpointIds.push(created.id);

      const fetched = await client.endpoints.get(created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe(payload.name);
      expect(fetched.method).toBe('POST');
      expect(fetched.path).toBe(payload.path);
      expect(fetched.enabled).toBe(true);
      expect(fetched.created_at).toBeDefined();
      expect(fetched.updated_at).toBeDefined();
    });

    it('should throw for a non-existent endpoint ID', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.endpoints.get('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('should return the created endpoint with matching fields', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const payload = createTestEndpointPayload();
      const created = await client.endpoints.create(payload as any);
      createdEndpointIds.push(created.id);

      expect(created.id).toBeDefined();
      expect(created.name).toBe(payload.name);
      expect(created.method).toBe(payload.method);
      expect(created.path).toBe(payload.path);
      expect(created.enabled).toBe(true);
    });

    it('should confirm the endpoint exists via get() after creation', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.endpoints.create(createTestEndpointPayload() as any);
      createdEndpointIds.push(created.id);

      const fetched = await client.endpoints.get(created.id);
      expect(fetched.id).toBe(created.id);
      expect(fetched.path).toBe(created.path);
      expect(fetched.method).toBe(created.method);
    });

    it('should create with enabled=false when specified', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.endpoints.create(
        createTestEndpointPayload({ enabled: false }) as any
      );
      createdEndpointIds.push(created.id);

      expect(created.enabled).toBe(false);

      const fetched = await client.endpoints.get(created.id);
      expect(fetched.enabled).toBe(false);
    });

    it('should create a POST endpoint', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.endpoints.create(
        createTestEndpointPayload({ method: 'POST' }) as any
      );
      createdEndpointIds.push(created.id);

      expect(created.method).toBe('POST');
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------

  describe('update', () => {
    it('should update the endpoint name and reflect it in get()', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.endpoints.create(createTestEndpointPayload() as any);
      createdEndpointIds.push(created.id);

      const newName = createTestEndpointName();
      const updated = await client.endpoints.update(created.id, {
        name: newName,
        method: created.method,
        path: created.path,
      });

      expect(updated.name).toBe(newName);

      const fetched = await client.endpoints.get(created.id);
      expect(fetched.name).toBe(newName);
    });

    it('should update the method and path and reflect changes in get()', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.endpoints.create(
        createTestEndpointPayload({ method: 'GET' }) as any
      );
      createdEndpointIds.push(created.id);

      const newPath = createTestEndpointPath();
      await client.endpoints.update(created.id, {
        name: created.name,
        method: 'POST',
        path: newPath,
      });

      const fetched = await client.endpoints.get(created.id);
      expect(fetched.method).toBe('POST');
      expect(fetched.path).toBe(newPath);
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------

  describe('delete', () => {
    it('should return success and make get() throw afterwards', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.endpoints.create(createTestEndpointPayload() as any);
      // Not tracked — we delete it in this test

      const result = await client.endpoints.delete(created.id);
      expect(result.success).toBe(true);

      await expect(client.endpoints.get(created.id)).rejects.toThrow();
    });

    it('should no longer appear in list() after delete', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.endpoints.create(createTestEndpointPayload() as any);
      await client.endpoints.delete(created.id);

      const result = await client.endpoints.list();
      const found = result.items.find((e) => e.id === created.id);
      expect(found).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // toggle
  // -------------------------------------------------------------------------

  describe('toggle', () => {
    it('should disable an enabled endpoint', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.endpoints.create(
        createTestEndpointPayload({ enabled: true }) as any
      );
      createdEndpointIds.push(created.id);

      const toggled = await client.endpoints.toggle(created.id);
      expect(toggled.enabled).toBe(false);

      const fetched = await client.endpoints.get(created.id);
      expect(fetched.enabled).toBe(false);
    });

    it('should re-enable a disabled endpoint', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.endpoints.create(
        createTestEndpointPayload({ enabled: false }) as any
      );
      createdEndpointIds.push(created.id);

      const toggled = await client.endpoints.toggle(created.id);
      expect(toggled.enabled).toBe(true);

      const fetched = await client.endpoints.get(created.id);
      expect(fetched.enabled).toBe(true);
    });

    it('should toggle twice and return to original state', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.endpoints.create(
        createTestEndpointPayload({ enabled: true }) as any
      );
      createdEndpointIds.push(created.id);

      await client.endpoints.toggle(created.id); // → false
      await client.endpoints.toggle(created.id); // → true

      const fetched = await client.endpoints.get(created.id);
      expect(fetched.enabled).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // listExecutions
  // -------------------------------------------------------------------------

  describe('listExecutions', () => {
    it('should return empty items array for a fresh endpoint', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.endpoints.create(createTestEndpointPayload() as any);
      createdEndpointIds.push(created.id);

      const executions = await client.endpoints.listExecutions(created.id);

      expect(executions.items).toBeInstanceOf(Array);
      expect(executions.items).toHaveLength(0);
      expect(executions.total).toBe(0);
    });

    it('should support pagination params', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.endpoints.create(createTestEndpointPayload() as any);
      createdEndpointIds.push(created.id);

      const executions = await client.endpoints.listExecutions(created.id, {
        page: 1,
        page_size: 10,
      });

      expect(executions.items).toBeInstanceOf(Array);
      expect(typeof executions.total).toBe('number');
    });

    it('should record an execution after invoking the endpoint via HTTP', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // Create an endpoint that:
      //   - requires no auth (so we can invoke it without a token)
      //   - has a static JSON response template
      const path = createTestEndpointPath();
      const created = await client.endpoints.create({
        name: createTestEndpointName(),
        method: 'GET',
        path,
        enabled: true,
        auth_required: false,
        response_template: { status: 200, body: { ok: true } },
      } as any);
      createdEndpointIds.push(created.id);

      // The account_id is returned by the backend (not in the SDK type but present at runtime).
      // The execution URL uses the account slug, so fetch the full account object first.
      const accountId = (created as any).account_id;
      expect(accountId).toBeDefined();

      const account = await client.accounts.get(accountId);
      expect(account.slug).toBeDefined();

      // Invoke the endpoint directly via fetch — no auth token needed because auth_required=false
      const invokeUrl = `${TEST_CONFIG.baseUrl}/api/v1/x/${account.slug}${path}`;
      const response = await fetch(invokeUrl);
      // Expect a successful response (2xx) from the endpoint
      expect(response.ok).toBe(true);

      // Poll until the execution record appears
      await waitFor(async () => {
        const executions = await client.endpoints.listExecutions(created.id);
        return executions.total >= 1;
      });

      const executions = await client.endpoints.listExecutions(created.id);
      expect(executions.total).toBeGreaterThanOrEqual(1);

      const execution = executions.items[0];
      expect(execution.id).toBeDefined();
      expect(execution.endpoint_id).toBe(created.id);
      expect(execution.status).toBeDefined();
      // Backend uses `executed_at` (not `created_at` as typed in the SDK)
      expect((execution as any).executed_at).toBeDefined();
    });
  });
});
