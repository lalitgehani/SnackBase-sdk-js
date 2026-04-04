/**
 * MacroService integration tests — F5.4: MacroService Full Coverage
 *
 * Tests require superadmin authentication (SNACKBASE_API_KEY).
 * Each test that creates a macro cleans it up in afterEach.
 *
 * Backend response shapes:
 *   list:   Macro[]  (plain array — NOT { items, total })
 *   get:    Macro    { id: number, name, description, sql_query, parameters, created_at, updated_at, created_by }
 *   create: Macro    (201 Created)
 *   update: Macro    (PUT — full replacement; all writable fields accepted)
 *   delete: 204 No Content → SDK returns { success: true }
 *   test:   { result: string | null, execution_time: number, rows_affected: number }
 *
 * Notes:
 *   - Macro IDs are integers on the backend; the SDK types them as `number`.
 *   - Macros are global — not scoped to any account.
 *   - Only superadmins can create, update, delete, or test macros.
 *   - Authenticated users (non-admin) can call list() and get().
 *   - The backend validates that sql_query starts with SELECT.
 *   - test() sends { parameters: string[] } positionally matching the macro's
 *     `parameters` name list.
 *
 * MacroListResponse note:
 *   The SDK wraps the response in MacroListResponse ({ items, total }), but the
 *   backend returns a plain array. The list() method returns response.data directly,
 *   so at runtime `result` will be an array. Tests are written against actual runtime
 *   behaviour and document the mismatch via comments.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import { createTestClient, TEST_CONFIG } from './setup';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uniqueSuffix() {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Generate a valid macro name: must be a Python identifier
 * ([a-zA-Z_][a-zA-Z0-9_]*), max 255 chars.
 */
function createTestMacroName() {
  return `test_macro_${uniqueSuffix()}`;
}

function createTestMacroPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: createTestMacroName(),
    description: 'Integration test macro',
    sql_query: 'SELECT 1',
    parameters: [] as string[],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('MacroService Integration Tests', () => {
  let client: SnackBaseClient;
  const createdMacroIds: number[] = [];

  beforeEach(() => {
    if (!TEST_CONFIG.apiKey) return;
    client = createTestClient();
  });

  afterEach(async () => {
    if (!TEST_CONFIG.apiKey || !client) return;
    for (const id of createdMacroIds) {
      try {
        await client.macros.delete(String(id));
      } catch {
        // already deleted or never created — ignore
      }
    }
    createdMacroIds.length = 0;
  });

  // -------------------------------------------------------------------------
  // list
  // -------------------------------------------------------------------------

  describe('list', () => {
    it('should return a defined response', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // NOTE: The backend returns a plain Macro[] array. The SDK MacroListResponse
      // type ({ items, total }) does not match runtime shape — `result` is an array.
      const result = await client.macros.list();

      expect(result).toBeDefined();
    });

    it('should return an array of macros', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.macros.list();

      // Runtime value is Macro[] even though the TypeScript type says MacroListResponse
      expect(Array.isArray(result)).toBe(true);
    });

    it('should include a newly created macro in the list', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.macros.create(createTestMacroPayload());
      createdMacroIds.push(created.id);

      const result = await client.macros.list();
      const macros = Array.isArray(result) ? result : (result as any).items;

      const found = macros.find((m: any) => m.id === created.id);
      expect(found).toBeDefined();
      expect(found.name).toBe(created.name);
    });
  });

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------

  describe('get', () => {
    it('should return the macro with all expected fields', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const payload = createTestMacroPayload({ description: 'get test description' });
      const created = await client.macros.create(payload);
      createdMacroIds.push(created.id);

      const fetched = await client.macros.get(String(created.id));

      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe(payload.name);
      expect(fetched.description).toBe(payload.description);
      expect(fetched.sql_query).toBe(payload.sql_query);
      expect(Array.isArray(fetched.parameters)).toBe(true);
      expect(fetched.created_at).toBeDefined();
      expect(fetched.updated_at).toBeDefined();
    });

    it('should throw for a non-existent macro ID', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(client.macros.get('999999999')).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('should create a macro and return it with an id', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const payload = createTestMacroPayload();
      const created = await client.macros.create(payload);
      createdMacroIds.push(created.id);

      expect(created.id).toBeDefined();
      expect(created.name).toBe(payload.name);
      expect(created.sql_query).toBe(payload.sql_query);
      expect(Array.isArray(created.parameters)).toBe(true);
    });

    it('should confirm the macro exists via get() after create', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.macros.create(createTestMacroPayload());
      createdMacroIds.push(created.id);

      const fetched = await client.macros.get(String(created.id));
      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe(created.name);
    });

    it('should create a macro with parameters', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const payload = createTestMacroPayload({
        sql_query: 'SELECT * FROM users WHERE account_id = :account_id',
        parameters: ['account_id'],
      });
      const created = await client.macros.create(payload);
      createdMacroIds.push(created.id);

      expect(created.parameters).toEqual(['account_id']);
    });

    it('should reject a non-SELECT sql_query with a validation error', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const payload = createTestMacroPayload({
        sql_query: 'DELETE FROM users',
      });

      await expect(client.macros.create(payload)).rejects.toThrow();
    });

    it('should reject a duplicate macro name with a conflict error', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const payload = createTestMacroPayload();
      const created = await client.macros.create(payload);
      createdMacroIds.push(created.id);

      // Second create with same name should conflict (409)
      await expect(client.macros.create(payload)).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------

  describe('update', () => {
    it('should update the description and reflect it in get()', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.macros.create(createTestMacroPayload());
      createdMacroIds.push(created.id);

      const updatedDescription = 'updated description';
      const updated = await client.macros.update(String(created.id), {
        description: updatedDescription,
      });

      expect(updated.description).toBe(updatedDescription);

      const fetched = await client.macros.get(String(created.id));
      expect(fetched.description).toBe(updatedDescription);
    });

    it('should update the sql_query and reflect it in get()', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.macros.create(createTestMacroPayload());
      createdMacroIds.push(created.id);

      const newQuery = 'SELECT 2';
      const updated = await client.macros.update(String(created.id), {
        sql_query: newQuery,
      });

      expect(updated.sql_query).toBe(newQuery);

      const fetched = await client.macros.get(String(created.id));
      expect(fetched.sql_query).toBe(newQuery);
    });

    it('should throw for a non-existent macro ID', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.macros.update('999999999', { description: 'ghost' })
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------

  describe('delete', () => {
    it('should return { success: true } and make get() throw afterwards', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.macros.create(createTestMacroPayload());
      // Not pushed to createdMacroIds — deleted in this test

      const result = await client.macros.delete(String(created.id));
      expect(result.success).toBe(true);

      await expect(client.macros.get(String(created.id))).rejects.toThrow();
    });

    it('should no longer appear in list() after delete', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.macros.create(createTestMacroPayload());
      await client.macros.delete(String(created.id));

      const result = await client.macros.list();
      const macros = Array.isArray(result) ? result : (result as any).items;

      const found = macros.find((m: any) => m.id === created.id);
      expect(found).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // test
  // -------------------------------------------------------------------------

  describe('test', () => {
    it('should execute a parameterless macro and return a result object', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // sql_query "SELECT 42" returns a single scalar; result should be "42"
      const created = await client.macros.create(
        createTestMacroPayload({ sql_query: 'SELECT 42', parameters: [] })
      );
      createdMacroIds.push(created.id);

      // NOTE: SDK sends { parameters: string[] } to backend POST /macros/:id/test
      // Backend returns { result: string | null, execution_time: number, rows_affected: number }
      const testResult = await client.macros.test(String(created.id), []);

      expect(testResult).toBeDefined();
      expect(typeof testResult.execution_time).toBe('number');
      expect(testResult.rows_affected).toBe(0);
      // result is the stringified scalar value from the SELECT
      expect(testResult.result).toBe('42');
    });

    it('should execute a macro with parameters and return a result', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // Backend uses SQLAlchemy named-parameter syntax (:param_name), not positional $1.
      // The parameter name in sql_query must match the name in the parameters list.
      const created = await client.macros.create(
        createTestMacroPayload({
          sql_query: 'SELECT :input_value',
          parameters: ['input_value'],
        })
      );
      createdMacroIds.push(created.id);

      const testResult = await client.macros.test(String(created.id), ['hello']);

      expect(testResult).toBeDefined();
      expect(testResult.result).toBe('hello');
    });

    it('should throw a validation error when parameter count does not match', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // Macro expects 1 parameter but we pass 0
      const created = await client.macros.create(
        createTestMacroPayload({
          sql_query: 'SELECT :required_param',
          parameters: ['required_param'],
        })
      );
      createdMacroIds.push(created.id);

      // Passing empty array when 1 param is expected → 422
      await expect(client.macros.test(String(created.id), [])).rejects.toThrow();
    });

    it('should throw for a non-existent macro ID', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(client.macros.test('999999999', [])).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Global scope verification
  // -------------------------------------------------------------------------

  describe('global scope', () => {
    it('macro created with one client instance is visible via a separate client instance', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const created = await client.macros.create(createTestMacroPayload());
      createdMacroIds.push(created.id);

      // Second independent client (same API key, different instance)
      const secondClient = createTestClient();
      const fetched = await secondClient.macros.get(String(created.id));

      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe(created.name);
    });
  });
});
