/**
 * Records integration tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import {
  createTestClient,
  createTestEmail,
  createTestAccountName,
  createTestCollectionName,
  trackUser,
  trackCollection,
  verifyUser,
  cleanupTestResources,
} from './setup';

describe('Records Integration Tests', () => {
  let client: SnackBaseClient;
  let testUserId: string | null = null;
  let testCollectionId: string | null = null;
  let testCollectionName: string | null = null;

  beforeEach(async () => {
    client = createTestClient();

    const email = createTestEmail();
    const password = 'TestPass123!';
    const account_name = createTestAccountName();
    const account_slug = account_name.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');

    // Create a test user
    const authState = await client.auth.register({
      email,
      password,
      account_name,
    });
    testUserId = authState.user!.id;
    trackUser(testUserId);

    // Create a test collection using API Key (unauthenticated client yet)
    testCollectionName = createTestCollectionName();
    const collection = await client.collections.create({
      name: testCollectionName,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'text' },
        { name: 'status', type: 'text' },
      ],
      list_rule: '@request.auth.id != ""',
      view_rule: '@request.auth.id != ""',
      create_rule: '@request.auth.id != ""',
      update_rule: '@request.auth.id != ""',
      delete_rule: '@request.auth.id != ""',
    });
    testCollectionId = collection.id;
    trackCollection(testCollectionId);

    // Verify and login user
    await verifyUser(testUserId);
    await client.auth.login({
      email,
      password,
      account: account_slug,
    });
  });

  afterEach(async () => {
    await cleanupTestResources(client);
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const record = await client.records.create(testCollectionName!, {
        title: 'Test Record',
        content: 'Test content',
        status: 'draft',
      });

      expect(record).toBeDefined();
      expect(record.id).toBeDefined();
      expect(record.title).toBe('Test Record');
      expect(record.content).toBe('Test content');
      expect(record.status).toBe('draft');
    });

    it('should fail with missing required field', async () => {
      await expect(
        client.records.create(testCollectionName!, {
          content: 'Test content',
        })
      ).rejects.toThrow();
    });
  });

  describe('get', () => {
    it('should get a single record by id', async () => {
      const created = await client.records.create(testCollectionName!, {
        title: 'Test Record',
        content: 'Test content',
      });

      const record = await client.records.get(testCollectionName!, created.id);

      expect(record).toBeDefined();
      expect(record.id).toBe(created.id);
      expect(record.title).toBe('Test Record');
    });

    it('should fail with non-existent record', async () => {
      const nonExistentId = '000000000000000000000000'; // Assuming ID format
      await expect(
        client.records.get(testCollectionName!, nonExistentId)
      ).rejects.toThrow();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Create some test records
      await client.records.create(testCollectionName!, {
        title: 'First Record',
        content: 'First content',
        status: 'published',
      });
      await client.records.create(testCollectionName!, {
        title: 'Second Record',
        content: 'Second content',
        status: 'draft',
      });
      await client.records.create(testCollectionName!, {
        title: 'Third Record',
        content: 'Third content',
        status: 'published',
      });
    });

    it('should list all records', async () => {
      const result = await client.records.list(testCollectionName!);

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBeGreaterThanOrEqual(3);
      expect(result.total).toBeGreaterThanOrEqual(3);
    });

    it('should support pagination', async () => {
      const page1 = await client.records.list(testCollectionName!, {
        skip: 0,
        limit: 2,
      });

      expect(page1.items.length).toBeLessThanOrEqual(2);

      const page2 = await client.records.list(testCollectionName!, {
        skip: 2,
        limit: 2,
      });

      expect(page2.items).toBeDefined();
    });

    it('should support filtering', async () => {
      const result = await client.records.list(testCollectionName!, {
        filter: 'status="published"',
      });

      if (!result.items.every((r: any) => r.status === 'published')) {
        console.log('Filter failed. Items:', JSON.stringify(result.items, null, 2));
      }

      expect(result.items.every((r: any) => r.status === 'published')).toBe(true);
    });

    it('should support sorting', async () => {
      const result = await client.records.list(testCollectionName!, {
        sort: '-created_at',
      });

      // Check that items are sorted by created_at descending
      for (let i = 1; i < result.items.length; i++) {
        const prev = new Date(result.items[i - 1].created_at);
        const curr = new Date(result.items[i].created_at);
        expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
      }
    });

    it('should support field selection', async () => {
      const result = await client.records.list(testCollectionName!, {
        fields: ['id', 'title'],
      });

      expect(result.items[0]).toBeDefined();
      expect(result.items[0].id).toBeDefined();
      expect(result.items[0].title).toBeDefined();
      // content should not be present
      expect(result.items[0].content).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update a record', async () => {
      const created = await client.records.create(testCollectionName!, {
        title: 'Original Title',
        content: 'Original content',
        status: 'draft',
      });

      const updated = await client.records.update(testCollectionName!, created.id, {
        title: 'Updated Title',
        status: 'published',
      });

      expect(updated.id).toBe(created.id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.status).toBe('published');
      expect(updated.content).toBe('Original content'); // Unchanged
    });
  });

  describe('delete', () => {
    it('should delete a record', async () => {
      const created = await client.records.create(testCollectionName!, {
        title: 'To Delete',
        content: 'This will be deleted',
      });

      await client.records.delete(testCollectionName!, created.id);

      // Verify it's deleted
      await expect(
        client.records.get(testCollectionName!, created.id)
      ).rejects.toThrow();
    });
  });

  describe('Query Builder', () => {
    beforeEach(async () => {
      await client.records.create(testCollectionName!, {
        title: 'Published Post 1',
        status: 'published',
      });
      await client.records.create(testCollectionName!, {
        title: 'Published Post 2',
        status: 'published',
      });
      await client.records.create(testCollectionName!, {
        title: 'Draft Post',
        status: 'draft',
      });
    });

    it('should execute complex queries', async () => {
      const result = await client.records
        .query(testCollectionName!)
        .filter('status', '=', 'published')
        // .filter('views', '>', 50)
        // .sort('views', 'desc')
        .get();

      expect(result.items.length).toBeGreaterThanOrEqual(1);
      expect(result.items.every((r: any) => r.status === 'published')).toBe(true);
    });

    it('should select specific fields', async () => {
      const result = await client.records
        .query(testCollectionName!)
        .select(['id', 'title'])
        .get();

      expect(result.items[0].id).toBeDefined();
      expect(result.items[0].title).toBeDefined();
      expect(result.items[0].status).toBeUndefined();
    });

    it('should get first result', async () => {
      const record = await client.records
        .query(testCollectionName!)
        .filter('title', '=', 'Published Post 1')
        .first();

      expect(record).toBeDefined();
      expect(record!.title).toBe('Published Post 1');
    });

    it('should return null for no results on first()', async () => {
      const record = await client.records
        .query(testCollectionName!)
        .filter('title', '=', 'Non Existent')
        .first();

      expect(record).toBeNull();
    });
  });
});
