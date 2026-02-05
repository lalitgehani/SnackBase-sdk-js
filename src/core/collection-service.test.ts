import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollectionService } from './collection-service';
import { HttpClient } from './http-client';
import { Collection } from '../types/collection';

describe('CollectionService', () => {
  let httpClient: HttpClient;
  let collectionService: CollectionService;

  const mockCollection: Collection = {
    id: 'col-1',
    name: 'products',
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'price', type: 'number', required: true }
    ],
    record_count: 10,
    field_count: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    httpClient = new HttpClient({ baseUrl: 'https://api.example.com' });
    collectionService = new CollectionService(httpClient);
  });

  describe('list', () => {
    it('should fetch all collections', async () => {
      const mockResponse = [mockCollection];

      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await collectionService.list();

      expect(getSpy).toHaveBeenCalledWith('/api/v1/collections');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('get', () => {
    it('should fetch collection schema', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockCollection,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await collectionService.get('col-1');

      expect(getSpy).toHaveBeenCalledWith('/api/v1/collections/col-1');
      expect(result).toEqual(mockCollection);
    });
  });

  describe('create', () => {
    it('should create a new collection', async () => {
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: mockCollection,
        status: 201,
        headers: new Headers(),
        request: {} as any,
      });

      const data = { 
        name: 'products', 
        fields: [
          { name: 'name', type: 'text' as const },
          { name: 'price', type: 'number' as const }
        ] 
      };
      const result = await collectionService.create(data);

      expect(postSpy).toHaveBeenCalledWith('/api/v1/collections', data);
      expect(result).toEqual(mockCollection);
    });
  });

  describe('update', () => {
    it('should update an existing collection', async () => {
      const patchSpy = vi.spyOn(httpClient, 'patch').mockResolvedValue({
        data: { ...mockCollection, name: 'updated_products' },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const data = { name: 'updated_products' };
      const result = await collectionService.update('col-1', data);

      expect(patchSpy).toHaveBeenCalledWith('/api/v1/collections/col-1', data);
      expect(result.name).toBe('updated_products');
    });
  });

  describe('delete', () => {
    it('should delete a collection', async () => {
      const deleteSpy = vi.spyOn(httpClient, 'delete').mockResolvedValue({
        data: {},
        status: 204,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await collectionService.delete('col-1');

      expect(deleteSpy).toHaveBeenCalledWith('/api/v1/collections/col-1');
      expect(result.success).toBe(true);
    });
  });

  describe('export', () => {
    it('should export all collections when no params provided', async () => {
      const mockExportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        exported_by: 'admin@example.com',
        collections: []
      };

      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockExportData,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await collectionService.export();

      expect(getSpy).toHaveBeenCalledWith('/api/v1/collections/export', { params: {} });
      expect(result).toEqual(mockExportData);
    });

    it('should export specific collections when collection_ids provided', async () => {
      const collectionIds = ['id1', 'id2'];
      const mockExportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        exported_by: 'admin@example.com',
        collections: []
      };

      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockExportData,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await collectionService.export({ collection_ids: collectionIds });

      expect(getSpy).toHaveBeenCalledWith('/api/v1/collections/export', { 
        params: { collection_ids: 'id1,id2' } 
      });
      expect(result).toEqual(mockExportData);
    });

    it('should handle empty collection_ids array', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: { collections: [] },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      await collectionService.export({ collection_ids: [] });

      expect(getSpy).toHaveBeenCalledWith('/api/v1/collections/export', { params: {} });
    });
  });

  describe('import', () => {
    const mockImportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      exported_by: 'admin@example.com',
      collections: []
    };

    const mockImportResult = {
      success: true,
      imported_count: 1,
      skipped_count: 0,
      updated_count: 0,
      failed_count: 0,
      collections: [],
      migrations_created: ['rev1']
    };

    it('should import collections with error strategy', async () => {
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: mockImportResult,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const request = { data: mockImportData, strategy: 'error' as const };
      const result = await collectionService.import(request);

      expect(postSpy).toHaveBeenCalledWith('/api/v1/collections/import', request);
      expect(result).toEqual(mockImportResult);
    });

    it('should import collections with skip strategy', async () => {
      vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: { ...mockImportResult, imported_count: 0, skipped_count: 1 },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await collectionService.import({ data: mockImportData, strategy: 'skip' });

      expect(result.skipped_count).toBe(1);
    });

    it('should import collections with update strategy', async () => {
      vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: { ...mockImportResult, imported_count: 0, updated_count: 1 },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await collectionService.import({ data: mockImportData, strategy: 'update' });

      expect(result.updated_count).toBe(1);
    });

    it('should handle import failures', async () => {
      vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: { ...mockImportResult, success: false, failed_count: 1 },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await collectionService.import({ data: mockImportData });

      expect(result.success).toBe(false);
      expect(result.failed_count).toBe(1);
    });
  });
});
