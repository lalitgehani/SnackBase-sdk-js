import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecordService } from './record-service';
import { HttpClient } from './http-client';
import { BaseRecord } from '../types/record';

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

      expect(getSpy).toHaveBeenCalledWith('/api/v1/collections/posts/records', { params: {} });
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
        filter: { status: 'published', rating: { $gt: 4 } },
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/api/v1/collections/posts/records',
        {
          params: {
            skip: 20,
            limit: 5,
            sort: '-created_at',
            fields: 'id,title',
            expand: 'author,comments',
            filter: '{"status":"published","rating":{"$gt":4}}',
          },
        }
      );
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

      expect(getSpy).toHaveBeenCalledWith('/api/v1/collections/posts/records/rec-1', { params: {} });
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
        '/api/v1/collections/posts/records/rec-1',
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

      expect(postSpy).toHaveBeenCalledWith('/api/v1/collections/posts/records', data);
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

      expect(putSpy).toHaveBeenCalledWith('/api/v1/collections/posts/records/rec-1', data);
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

      expect(patchSpy).toHaveBeenCalledWith('/api/v1/collections/posts/records/rec-1', data);
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

      expect(deleteSpy).toHaveBeenCalledWith('/api/v1/collections/posts/records/rec-1');
      expect(result.success).toBe(true);
    });
  });
});
