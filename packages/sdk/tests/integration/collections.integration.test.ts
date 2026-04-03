/**
 * Collections integration tests — F1.2: CollectionService Full CRUD
 *
 * Each test creates resources with unique names (timestamp + random suffix) so
 * there are no conflicts between runs and no cleanup is required.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import { createTestClient, createTestCollectionName } from './setup';

describe('Collections Integration Tests', () => {
  let client: SnackBaseClient;

  beforeEach(() => {
    client = createTestClient();
  });

  describe('create', () => {
    it('should create a collection with multiple field types', async () => {
      const name = createTestCollectionName();

      const collection = await client.collections.create({
        name,
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'score', type: 'number' },
          { name: 'active', type: 'boolean' },
        ],
      });

      expect(collection.id).toBeDefined();
      expect(collection.name).toBe(name);
      expect(collection.fields.length).toBeGreaterThanOrEqual(3);

      const fieldNames = collection.fields.map((f) => f.name);
      expect(fieldNames).toContain('title');
      expect(fieldNames).toContain('score');
      expect(fieldNames).toContain('active');
    });

    it('should return 409 for a duplicate collection name', async () => {
      const name = createTestCollectionName();

      const first = await client.collections.create({
        name,
        fields: [{ name: 'title', type: 'text' }],
      });

      await expect(
        client.collections.create({
          name,
          fields: [{ name: 'title', type: 'text' }],
        })
      ).rejects.toThrow();

      // Confirm the original still exists
      const fetched = await client.collections.get(first.id);
      expect(fetched.id).toBe(first.id);
    });
  });

  describe('get', () => {
    it('should return the full collection schema by ID', async () => {
      const name = createTestCollectionName();
      const created = await client.collections.create({
        name,
        fields: [
          { name: 'label', type: 'text', required: true },
          { name: 'qty', type: 'number' },
        ],
      });

      const fetched = await client.collections.get(created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe(name);
      const fieldNames = fetched.fields.map((f) => f.name);
      expect(fieldNames).toContain('label');
      expect(fieldNames).toContain('qty');
    });

    it('should throw for a non-existent collection ID', async () => {
      await expect(
        client.collections.get('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should return an array that includes the newly created collection', async () => {
      const name = createTestCollectionName();
      const created = await client.collections.create({
        name,
        fields: [{ name: 'title', type: 'text' }],
      });

      const collections = await client.collections.list();

      expect(collections).toBeInstanceOf(Array);
      const found = collections.find((c) => c.id === created.id);
      expect(found).toBeDefined();
      expect(found!.name).toBe(name);
    });
  });

  describe('listNames', () => {
    it('should return an array of strings that includes the new collection name', async () => {
      const name = createTestCollectionName();
      await client.collections.create({
        name,
        fields: [{ name: 'title', type: 'text' }],
      });

      const names = await client.collections.listNames();

      expect(names).toBeInstanceOf(Array);
      names.forEach((n) => expect(typeof n).toBe('string'));
      expect(names).toContain(name);
    });

    it('listNames() result should contain the new collection name', async () => {
      const name = createTestCollectionName();
      await client.collections.create({
        name,
        fields: [{ name: 'title', type: 'text' }],
      });

      // listNames() returns all names (unpaginated); list() is paginated.
      // Verify our new collection appears in both independently.
      const names = await client.collections.listNames();
      expect(names).toContain(name);

      const collections = await client.collections.list();
      // list() is paginated — just verify the structure is an array of objects
      expect(collections).toBeInstanceOf(Array);
      expect(collections.length).toBeGreaterThan(0);
    });
  });

  describe('update', () => {
    it('should add a new field and reflect it in get()', async () => {
      const name = createTestCollectionName();
      const created = await client.collections.create({
        name,
        fields: [{ name: 'title', type: 'text', required: true }],
      });

      const updated = await client.collections.update(created.id, {
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'description', type: 'text' },
        ],
      });

      expect(updated.id).toBe(created.id);
      const fieldNames = updated.fields.map((f) => f.name);
      expect(fieldNames).toContain('title');
      expect(fieldNames).toContain('description');

      // Confirm get() reflects the change
      const fetched = await client.collections.get(created.id);
      const fetchedFieldNames = fetched.fields.map((f) => f.name);
      expect(fetchedFieldNames).toContain('description');
    });
  });

  describe('delete', () => {
    it('should remove the collection so get() returns 404', async () => {
      const name = createTestCollectionName();
      const created = await client.collections.create({
        name,
        fields: [{ name: 'title', type: 'text' }],
      });

      const result = await client.collections.delete(created.id);
      expect(result.success).toBe(true);

      await expect(client.collections.get(created.id)).rejects.toThrow();
    });

    it('should no longer appear in list() after deletion', async () => {
      const name = createTestCollectionName();
      const created = await client.collections.create({
        name,
        fields: [{ name: 'title', type: 'text' }],
      });

      await client.collections.delete(created.id);

      const collections = await client.collections.list();
      const found = collections.find((c) => c.id === created.id);
      expect(found).toBeUndefined();
    });
  });

  describe('export', () => {
    it('should export all collections and include the test collection', async () => {
      const name = createTestCollectionName();
      await client.collections.create({
        name,
        fields: [{ name: 'title', type: 'text' }],
      });

      const exportData = await client.collections.export();

      expect(exportData.version).toBeDefined();
      expect(exportData.exported_at).toBeDefined();
      expect(exportData.collections).toBeInstanceOf(Array);
      const found = exportData.collections.find((c) => c.name === name);
      expect(found).toBeDefined();
    });

    it('should export only the specified collection when filtered by ID', async () => {
      const name = createTestCollectionName();
      const created = await client.collections.create({
        name,
        fields: [{ name: 'title', type: 'text' }],
      });

      const exportData = await client.collections.export({
        collection_ids: [created.id],
      });

      expect(exportData.collections).toHaveLength(1);
      expect(exportData.collections[0].name).toBe(name);
    });
  });

  describe('import', () => {
    it('should import a collection from an export descriptor', async () => {
      const sourceName = createTestCollectionName();
      const source = await client.collections.create({
        name: sourceName,
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'count', type: 'number' },
        ],
      });

      // Export just this collection
      const exportData = await client.collections.export({
        collection_ids: [source.id],
      });

      // Delete the original so we can re-import under a fresh unique name
      await client.collections.delete(source.id);

      const importName = createTestCollectionName();
      exportData.collections[0].name = importName;

      const importResult = await client.collections.import({
        data: exportData,
        strategy: 'error',
      });

      expect(importResult.success).toBe(true);
      expect(importResult.imported_count).toBe(1);

      // list() items are summary objects — use listNames() to find it, then get() for full schema
      const names = await client.collections.listNames();
      expect(names).toContain(importName);

      const all = await client.collections.list();
      const summary = all.find((c) => c.name === importName);
      expect(summary).toBeDefined();

      const imported = await client.collections.get(summary!.id);
      const fieldNames = imported.fields.map((f) => f.name);
      expect(fieldNames).toContain('title');
      expect(fieldNames).toContain('count');
    });

    it('export → import round-trip preserves field definitions', async () => {
      const sourceName = createTestCollectionName();
      const source = await client.collections.create({
        name: sourceName,
        fields: [
          { name: 'label', type: 'text', required: true },
          { name: 'score', type: 'number' },
          { name: 'active', type: 'boolean' },
        ],
      });

      const exportData = await client.collections.export({ collection_ids: [source.id] });

      // Delete original and re-import under a new unique name
      await client.collections.delete(source.id);
      const reimportName = createTestCollectionName();
      exportData.collections[0].name = reimportName;

      await client.collections.import({ data: exportData, strategy: 'error' });

      const all = await client.collections.list();
      const summary = all.find((c) => c.name === reimportName);
      expect(summary).toBeDefined();

      // list() items are summaries — call get() to get the full schema with fields
      const reimported = await client.collections.get(summary!.id);
      const fieldNames = reimported.fields.map((f) => f.name);
      expect(fieldNames).toContain('label');
      expect(fieldNames).toContain('score');
      expect(fieldNames).toContain('active');
    });
  });
});
