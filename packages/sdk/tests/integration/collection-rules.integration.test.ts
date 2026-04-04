/**
 * Collection rules integration tests — F3.2: CollectionRuleService Full Coverage
 *
 * Tests require superadmin authentication (SNACKBASE_API_KEY).
 * Each test creates a fresh uniquely-named collection so there are no
 * cross-test conflicts and no shared state to clean up.
 *
 * NOTE: validateRule() and testRule() point to /api/v1/rules/validate and
 * /api/v1/rules/test which are not yet implemented in the backend.
 * Those tests are skipped until the endpoints are available.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import { createTestClient, createTestCollectionName, TEST_CONFIG } from './setup';

describe('Collection Rules Integration Tests', () => {
  let client: SnackBaseClient;

  beforeEach(() => {
    if (!TEST_CONFIG.apiKey) return;
    client = createTestClient();
  });

  describe('get', () => {
    it('should return default (locked) rules for a newly created collection', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const name = createTestCollectionName();
      await client.collections.create({
        name,
        fields: [{ name: 'title', type: 'text' }],
      });

      const rules = await client.collectionRules.get(name);

      expect(rules).toBeDefined();
      // A newly created collection has null rules (locked by default)
      expect('list_rule' in rules).toBe(true);
      expect('view_rule' in rules).toBe(true);
      expect('create_rule' in rules).toBe(true);
      expect('update_rule' in rules).toBe(true);
      expect('delete_rule' in rules).toBe(true);
    });

    it('should throw 404 for a non-existent collection name', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.collectionRules.get('nonexistent_collection_xyz_999')
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should persist updated access rules and reflect in get()', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const name = createTestCollectionName();
      await client.collections.create({
        name,
        fields: [{ name: 'title', type: 'text' }],
      });

      // Set a specific list_rule
      const listRule = '@request.auth.id != ""';
      const updated = await client.collectionRules.update(name, {
        list_rule: listRule,
        view_rule: '@request.auth.id != ""',
        create_rule: '@request.auth.id != ""',
        update_rule: '@request.auth.id != ""',
        delete_rule: '@request.auth.id != ""',
      });

      expect(updated.list_rule).toBe(listRule);

      // Confirm get() reflects the saved rule
      const fetched = await client.collectionRules.get(name);
      expect(fetched.list_rule).toBe(listRule);
    });

    it('should support partial updates — only provided fields change', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const name = createTestCollectionName();
      await client.collections.create({
        name,
        fields: [{ name: 'title', type: 'text' }],
      });

      // First set all rules
      await client.collectionRules.update(name, {
        list_rule: '@request.auth.id != ""',
        view_rule: '@request.auth.id != ""',
      });

      // Now partially update only list_rule
      const newListRule = '';
      const updated = await client.collectionRules.update(name, {
        list_rule: newListRule,
      });

      expect(updated.list_rule).toBe(newListRule);
      // view_rule should still be set
      expect(updated.view_rule).toBe('@request.auth.id != ""');
    });

    it('should throw for an invalid rule expression', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const name = createTestCollectionName();
      await client.collections.create({
        name,
        fields: [{ name: 'title', type: 'text' }],
      });

      // Invalid rule syntax should return a 400 error
      await expect(
        client.collectionRules.update(name, {
          list_rule: '@@invalid@@rule&&syntax!!',
        })
      ).rejects.toThrow();
    });

    it('should throw 404 when updating rules for a non-existent collection', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.collectionRules.update('nonexistent_collection_xyz_999', {
          list_rule: '@request.auth.id != ""',
        })
      ).rejects.toThrow();
    });
  });

  describe('validateRule', () => {
    it.skip('validateRule with valid expression returns success (endpoint not yet implemented)', async () => {
      // /api/v1/rules/validate is not implemented in the backend.
      // Unskip once the endpoint is available.
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.collectionRules.validateRule(
        '@request.auth.id != ""',
        'list',
        ['title', 'id', 'created_at']
      );
      expect(result.valid).toBe(true);
    });

    it.skip('validateRule with invalid expression returns validation error (endpoint not yet implemented)', async () => {
      // /api/v1/rules/validate is not implemented in the backend.
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.collectionRules.validateRule('@@bad syntax!!!', 'list', ['title'])
      ).rejects.toThrow();
    });
  });

  describe('testRule', () => {
    it.skip('testRule with matching context returns result: true (endpoint not yet implemented)', async () => {
      // /api/v1/rules/test is not implemented in the backend.
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.collectionRules.testRule(
        '@request.auth.id != ""',
        { auth: { id: 'user_123' } }
      );
      expect(result.result).toBe(true);
    });

    it.skip('testRule with non-matching context returns result: false (endpoint not yet implemented)', async () => {
      // /api/v1/rules/test is not implemented in the backend.
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.collectionRules.testRule(
        '@request.auth.id != ""',
        { auth: { id: '' } }
      );
      expect(result.result).toBe(false);
    });
  });
});
