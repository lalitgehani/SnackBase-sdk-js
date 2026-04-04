/**
 * API Keys integration tests — F3.3: ApiKeyService Full Coverage
 *
 * Tests require superadmin authentication (SNACKBASE_API_KEY).
 * Each test that creates a key cleans it up in afterEach.
 *
 * Backend response shapes:
 *   list:   { items: ApiKey[], total: number }
 *   get:    ApiKey  (key is masked, includes updated_at)
 *   create: ApiKey  (key is plaintext — returned once only)
 *   revoke: 204 No Content
 *
 * Key lifecycle:
 *   create → verify it can authenticate → revoke → verify it can no longer authenticate
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import { createTestClient, TEST_CONFIG } from './setup';

function createTestKeyName() {
  return `test_key_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

describe('API Keys Integration Tests', () => {
  let client: SnackBaseClient;
  const createdKeyIds: string[] = [];

  beforeEach(() => {
    if (!TEST_CONFIG.apiKey) return;
    client = createTestClient();
  });

  afterEach(async () => {
    if (!TEST_CONFIG.apiKey || !client) return;
    for (const id of createdKeyIds) {
      try {
        await client.apiKeys.revoke(id);
      } catch {
        // key may already be revoked — ignore
      }
    }
    createdKeyIds.length = 0;
  });

  describe('list', () => {
    it('should return a paginated response with items array and total', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.apiKeys.list();

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(typeof result.total).toBe('number');
    });

    it('should include a newly created key in the list', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const name = createTestKeyName();
      const created = await client.apiKeys.create({ name });
      createdKeyIds.push(created.id);

      const result = await client.apiKeys.list();
      const found = result.items.find((k) => k.id === created.id);

      expect(found).toBeDefined();
      expect(found!.name).toBe(name);
      expect(found!.is_active).toBe(true);
    });
  });

  describe('get', () => {
    it('should return key metadata without the raw plaintext secret', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const name = createTestKeyName();
      const created = await client.apiKeys.create({ name });
      createdKeyIds.push(created.id);

      const fetched = await client.apiKeys.get(created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe(name);
      // key field is present but should be masked (not the original plaintext)
      expect(fetched.key).toBeDefined();
      expect(fetched.key).not.toBe(created.key);
      expect(fetched.is_active).toBe(true);
    });

    it('should throw 404 for a non-existent key ID', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.apiKeys.get('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should return key metadata including the plaintext secret (one-time)', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const name = createTestKeyName();
      const apiKey = await client.apiKeys.create({ name });
      createdKeyIds.push(apiKey.id);

      expect(apiKey.id).toBeDefined();
      expect(apiKey.name).toBe(name);
      // Plaintext key is only returned at creation — not in subsequent get/list responses
      expect(apiKey.key).toBeDefined();
      expect(apiKey.key.length).toBeGreaterThan(10);
    });

    it('should create a key that can successfully authenticate requests', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const name = createTestKeyName();
      const apiKey = await client.apiKeys.create({ name });
      createdKeyIds.push(apiKey.id);

      // Create a new client authenticated solely with the new API key
      const keyClient = new SnackBaseClient({
        baseUrl: TEST_CONFIG.baseUrl,
        apiKey: apiKey.key,
        enableLogging: false,
      });

      // A valid API key should be able to list collections (superadmin-scoped endpoint)
      const result = await keyClient.collections.list();
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('revoke', () => {
    it('should revoke a key so subsequent requests with that key return 401', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const name = createTestKeyName();
      const apiKey = await client.apiKeys.create({ name });
      // Not pushed to createdKeyIds — we revoke in this test

      // Verify the key authenticates before revocation
      const keyClient = new SnackBaseClient({
        baseUrl: TEST_CONFIG.baseUrl,
        apiKey: apiKey.key,
        enableLogging: false,
      });
      await expect(keyClient.collections.list()).resolves.toBeInstanceOf(Array);

      // Revoke the key
      await client.apiKeys.revoke(apiKey.id);

      // Requests with the revoked key should now fail
      await expect(keyClient.collections.list()).rejects.toThrow();
    });

    it('should mark the key as inactive in the list after revocation', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const name = createTestKeyName();
      const apiKey = await client.apiKeys.create({ name });

      await client.apiKeys.revoke(apiKey.id);

      const result = await client.apiKeys.list();
      const found = result.items.find((k) => k.id === apiKey.id);
      // Either absent from list or marked as inactive
      if (found) {
        expect(found.is_active).toBe(false);
      }
    });
  });
});
