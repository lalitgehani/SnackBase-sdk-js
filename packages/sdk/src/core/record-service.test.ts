import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecordService } from './record-service';
import { HttpClient } from './http-client';
import { BaseRecord, BatchUpdateItem } from '../types/record';

describe('RecordService', () => {
  let httpClient: HttpClient;
  let recordService: RecordService;

  const mockRecord: BaseRecord = {
    id: 'rec-1',
    account_id: 'acc-1',
    name: 'Test Record',
    created_at: '2026-01-18T12:00:00Z',
    updated_at: '2026-01-18T12:00:00Z',
  };

  beforeEach(() => {
    httpClient = new HttpClient({ baseUrl: 'https://api.example.com' });
    recordService = new RecordService(httpClient);
  });

  describe('list', () => {
    it('should fetch records with default params', async () => {
      const mockResponse = {
        items: [mockRecord],
        total: 1,
        skip: 0,
        limit: 10,
      };

      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await recordService.list('posts');

      expect(getSpy).toHaveBeenCalledWith('/api/v1/records/posts', { params: {} });
      expect(result).toEqual(mockResponse);
    });

    it('should serialize complex params correctly', async () => {
      vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: { items: [], total: 0, skip: 0, limit: 10 },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      await recordService.list('posts', {
        skip: 20,
        limit: 5,
        sort: '-created_at',
        fields: ['id', 'title'],
        expand: ['author', 'comments'],
        filter: 'status = "published" && rating > 4',
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/api/v1/records/posts',
        {
          params: {
            skip: 20,
            limit: 5,
            sort: '-created_at',
            fields: 'id,title',
            expand: 'author,comments',
            filter: 'status = "published" && rating > 4',
          },
        }
      );
    });

    it('should pass filter string directly without modification', async () => {
      vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: { items: [], total: 0, skip: 0, limit: 10 },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      await recordService.list('posts', { filter: 'status = "active"' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/api/v1/records/posts',
        { params: { filter: 'status = "active"' } }
      );
    });

    it('should pass cursor param for forward cursor pagination', async () => {
      vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: { items: [], total: 0, skip: 0, limit: 10 },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      await recordService.list('posts', { cursor: 'tok_123' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/api/v1/records/posts',
        { params: { cursor: 'tok_123' } }
      );
    });

    it('should return next_cursor, prev_cursor, and has_more from response', async () => {
      const mockResponse = {
        items: [mockRecord],
        total: 100,
        skip: 0,
        limit: 10,
        next_cursor: 'cursor_next',
        prev_cursor: null,
        has_more: true,
      };

      vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await recordService.list('posts');

      expect(result.next_cursor).toBe('cursor_next');
      expect(result.prev_cursor).toBeNull();
      expect(result.has_more).toBe(true);
    });
  });

  describe('get', () => {
    it('should fetch a single record', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockRecord,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await recordService.get('posts', 'rec-1');

      expect(getSpy).toHaveBeenCalledWith('/api/v1/records/posts/rec-1', { params: {} });
      expect(result).toEqual(mockRecord);
    });

    it('should handle projection and expansion params', async () => {
      vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockRecord,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      await recordService.get('posts', 'rec-1', {
        fields: ['id', 'title'],
        expand: ['author'],
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/api/v1/records/posts/rec-1',
        {
          params: {
            fields: 'id,title',
            expand: 'author',
          },
        }
      );
    });
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: mockRecord,
        status: 201,
        headers: new Headers(),
        request: {} as any,
      });

      const data = { name: 'Test Record' };
      const result = await recordService.create('posts', data);

      expect(postSpy).toHaveBeenCalledWith('/api/v1/records/posts', data);
      expect(result).toEqual(mockRecord);
    });
  });

  describe('update', () => {
    it('should perform full update (PUT)', async () => {
      const putSpy = vi.spyOn(httpClient, 'put').mockResolvedValue({
        data: mockRecord,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const data = { name: 'Updated Name' };
      const result = await recordService.update('posts', 'rec-1', data);

      expect(putSpy).toHaveBeenCalledWith('/api/v1/records/posts/rec-1', data);
      expect(result).toEqual(mockRecord);
    });
  });

  describe('patch', () => {
    it('should perform partial update (PATCH)', async () => {
      const patchSpy = vi.spyOn(httpClient, 'patch').mockResolvedValue({
        data: mockRecord,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const data = { name: 'Patched Name' };
      const result = await recordService.patch('posts', 'rec-1', data);

      expect(patchSpy).toHaveBeenCalledWith('/api/v1/records/posts/rec-1', data);
      expect(result).toEqual(mockRecord);
    });
  });

  describe('delete', () => {
    it('should delete a record', async () => {
      const deleteSpy = vi.spyOn(httpClient, 'delete').mockResolvedValue({
        data: {},
        status: 204,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await recordService.delete('posts', 'rec-1');

      expect(deleteSpy).toHaveBeenCalledWith('/api/v1/records/posts/rec-1');
      expect(result.success).toBe(true);
    });
  });

  describe('getSecrets', () => {
    it('should GET secrets with fields query and return data only', async () => {
      const mockSecrets = { data: { api_token: 'plain' } };
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockSecrets,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await recordService.getSecrets('integrations', 'rec-1', [
        'api_token',
      ]);

      expect(getSpy).toHaveBeenCalledWith(
        '/api/v1/records/integrations/rec-1/secrets',
        { params: { fields: 'api_token' } }
      );
      expect(result).toEqual(mockSecrets);
      expect(result.data.api_token).toBe('plain');
    });

    it('should omit fields param when not provided', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: { data: {} },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      await recordService.getSecrets('integrations', 'rec-1');

      expect(getSpy).toHaveBeenCalledWith(
        '/api/v1/records/integrations/rec-1/secrets',
        { params: {} }
      );
    });
  });

  describe('batchCreate', () => {
    it('should POST records array to batch endpoint', async () => {
      const r1 = { name: 'Record 1' };
      const r2 = { name: 'Record 2' };
      const mockResponse = { created: [mockRecord], count: 2 };

      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: mockResponse,
        status: 201,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await recordService.batchCreate('items', [r1, r2]);

      expect(postSpy).toHaveBeenCalledWith(
        '/api/v1/records/items/batch',
        { records: [r1, r2] }
      );
      expect(result).toEqual(mockResponse);
      expect(result.count).toBe(2);
      expect(result.created).toHaveLength(1);
    });
  });

  describe('batchUpdate', () => {
    it('should PATCH items array wrapped in records key to batch endpoint', async () => {
      const items: BatchUpdateItem[] = [
        { id: 'rec-1', data: { name: 'Updated' } },
      ];
      const mockResponse = { updated: [mockRecord], count: 1 };

      const patchSpy = vi.spyOn(httpClient, 'patch').mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await recordService.batchUpdate('items', items);

      expect(patchSpy).toHaveBeenCalledWith(
        '/api/v1/records/items/batch',
        { records: items }
      );
      expect(result).toEqual(mockResponse);
      expect(result.count).toBe(1);
      expect(result.updated).toHaveLength(1);
    });
  });

  describe('batchDelete', () => {
    it('should DELETE with ids array in request body', async () => {
      const ids = ['rec-1', 'rec-2'];
      const mockResponse = { deleted: ids, count: 2 };

      const deleteSpy = vi.spyOn(httpClient, 'delete').mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await recordService.batchDelete('items', ids);

      expect(deleteSpy).toHaveBeenCalledWith(
        '/api/v1/records/items/batch',
        { body: { ids } }
      );
      expect(result).toEqual(mockResponse);
      expect(result.deleted).toEqual(ids);
      expect(result.count).toBe(2);
    });
  });

  describe('aggregate', () => {
    it('should GET aggregate endpoint with functions param', async () => {
      const mockResponse = { results: [{ 'count()': 42 }], total_groups: 1 };

      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await recordService.aggregate('orders', { functions: 'count()' });

      expect(getSpy).toHaveBeenCalledWith(
        '/api/v1/records/orders/aggregate',
        { params: { functions: 'count()' } }
      );
      expect(result.results).toEqual([{ 'count()': 42 }]);
      expect(result.total_groups).toBe(1);
    });

    it('should pass all four params as query parameters', async () => {
      const mockResponse = { results: [], total_groups: 0 };

      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      await recordService.aggregate('orders', {
        functions: 'count(),sum(total)',
        group_by: 'status',
        filter: 'total > 0',
        having: 'count() > 5',
      });

      expect(getSpy).toHaveBeenCalledWith(
        '/api/v1/records/orders/aggregate',
        {
          params: {
            functions: 'count(),sum(total)',
            group_by: 'status',
            filter: 'total > 0',
            having: 'count() > 5',
          },
        }
      );
    });
  });
});
