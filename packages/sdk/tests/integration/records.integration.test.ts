/**
 * Records integration tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import {
  createTestClient,
  createTestEmail,
  createTestAccountName,
  createTestCollectionName,
  verifyUser,
} from './setup';

describe('Records Integration Tests', () => {
  let client: SnackBaseClient;
  let testCollectionName: string | null = null;

  beforeEach(async () => {
    client = createTestClient();

    const email = createTestEmail();
    const password = 'TestPass123!';
    const account_name = createTestAccountName();
    const account_slug = account_name.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');

    // Register a fresh user with a unique email + account name each run
    const authState = await client.auth.register({
      email,
      password,
      account_name,
    });

    // Create a uniquely-named collection — no conflicts across runs
    testCollectionName = createTestCollectionName();
    await client.collections.create({
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

    // Verify and login user
    await verifyUser(authState.user!.id);
    await client.auth.login({
      email,
      password,
      account: account_slug,
    });
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

  describe('patch', () => {
    it('should partially update a record — only provided fields change', async () => {
      const created = await client.records.create(testCollectionName!, {
        title: 'Original Title',
        content: 'Original content',
        status: 'draft',
      });

      const patched = await client.records.patch(testCollectionName!, created.id, {
        status: 'published',
      });

      expect(patched.id).toBe(created.id);
      expect(patched.status).toBe('published');
      expect(patched.title).toBe('Original Title');   // unchanged
      expect(patched.content).toBe('Original content'); // unchanged
    });

    it('should return 404 for non-existent record', async () => {
      await expect(
        client.records.patch(testCollectionName!, '000000000000000000000000', { status: 'published' })
      ).rejects.toThrow();
    });
  });

  describe('batchCreate', () => {
    it('should atomically create multiple records', async () => {
      const result = await client.records.batchCreate(testCollectionName!, [
        { title: 'Batch 1', status: 'draft' },
        { title: 'Batch 2', status: 'draft' },
        { title: 'Batch 3', status: 'published' },
        { title: 'Batch 4', status: 'published' },
        { title: 'Batch 5', status: 'draft' },
      ]);

      expect(result.count).toBe(5);
      expect(result.created).toHaveLength(5);
      expect(result.created[0].title).toBe('Batch 1');
      expect(result.created[4].title).toBe('Batch 5');
      // All should have system fields
      result.created.forEach((r) => {
        expect(r.id).toBeDefined();
        expect(r.account_id).toBeDefined();
      });
    });

    it('should roll back all records when one fails validation', async () => {
      const listBefore = await client.records.list(testCollectionName!);
      const countBefore = listBefore.total;

      // One record is missing the required 'title' field
      await expect(
        client.records.batchCreate(testCollectionName!, [
          { title: 'Valid 1', status: 'draft' },
          { title: 'Valid 2', status: 'draft' },
          { status: 'draft' }, // missing required title
        ])
      ).rejects.toThrow();

      // Count must be unchanged — no partial writes
      const listAfter = await client.records.list(testCollectionName!);
      expect(listAfter.total).toBe(countBefore);
    });
  });

  describe('batchUpdate', () => {
    it('should atomically update multiple records in one call', async () => {
      const r1 = await client.records.create(testCollectionName!, { title: 'BU Record 1', status: 'draft' });
      const r2 = await client.records.create(testCollectionName!, { title: 'BU Record 2', status: 'draft' });

      const result = await client.records.batchUpdate(testCollectionName!, [
        { id: r1.id, data: { status: 'published' } },
        { id: r2.id, data: { status: 'archived' } },
      ]);

      expect(result.count).toBe(2);
      expect(result.updated).toHaveLength(2);

      const fetched1 = await client.records.get(testCollectionName!, r1.id);
      const fetched2 = await client.records.get(testCollectionName!, r2.id);
      expect(fetched1.status).toBe('published');
      expect(fetched2.status).toBe('archived');
    });
  });

  describe('batchDelete', () => {
    it('should atomically delete multiple records', async () => {
      const r1 = await client.records.create(testCollectionName!, { title: 'BD Record 1' });
      const r2 = await client.records.create(testCollectionName!, { title: 'BD Record 2' });
      const r3 = await client.records.create(testCollectionName!, { title: 'BD Record 3' });

      const result = await client.records.batchDelete(testCollectionName!, [r1.id, r2.id, r3.id]);

      expect(result.count).toBe(3);
      expect(result.deleted).toContain(r1.id);
      expect(result.deleted).toContain(r2.id);
      expect(result.deleted).toContain(r3.id);

      // All three should be gone
      await expect(client.records.get(testCollectionName!, r1.id)).rejects.toThrow();
      await expect(client.records.get(testCollectionName!, r2.id)).rejects.toThrow();
      await expect(client.records.get(testCollectionName!, r3.id)).rejects.toThrow();
    });
  });

  describe('aggregate', () => {
    beforeEach(async () => {
      // Collection has text fields; create a separate collection with a numeric field for aggregate tests
      // We reuse the same collection — aggregate count() works on any collection
      await client.records.batchCreate(testCollectionName!, [
        { title: 'Agg 1', status: 'published' },
        { title: 'Agg 2', status: 'published' },
        { title: 'Agg 3', status: 'draft' },
      ]);
    });

    it('should return correct count for all records', async () => {
      const listResult = await client.records.list(testCollectionName!);
      const expectedCount = listResult.total;

      const aggResult = await client.records.aggregate(testCollectionName!, {
        functions: 'count()',
      });

      expect(aggResult.results).toBeDefined();
      expect(aggResult.results.length).toBeGreaterThanOrEqual(1);
      // count() result key is typically "count()"
      const countValue = aggResult.results[0]['count'];
      expect(Number(countValue)).toBe(expectedCount);
    });

    it('should return correct count with a filter', async () => {
      const aggResult = await client.records.aggregate(testCollectionName!, {
        functions: 'count()',
        filter: 'status="published"',
      });

      const listResult = await client.records.list(testCollectionName!, {
        filter: 'status="published"',
      });

      const countValue = aggResult.results[0]['count'];
      expect(Number(countValue)).toBe(listResult.total);
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
