import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryBuilder } from './query-builder';
import { RecordService } from './record-service';
import { HttpClient } from './http-client';

describe('QueryBuilder', () => {
  let mockHttpClient: any;
  let mockRecordService: any;
  let queryBuilder: QueryBuilder<any>;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
    } as unknown as HttpClient;

    mockRecordService = new RecordService(mockHttpClient);
    // Mock the list method
    mockRecordService.list = vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      skip: 0,
      limit: 30
    });

    queryBuilder = new QueryBuilder(mockRecordService, 'posts');
  });

  describe('parameter building', () => {
    it('should build select parameters', async () => {
      await queryBuilder.select(['title', 'slug']).get();

      expect(mockRecordService.list).toHaveBeenCalledWith('posts', expect.objectContaining({
        fields: 'title,slug'
      }));
    });

    it('should build expand parameters', async () => {
      await queryBuilder.expand('author').expand(['comments']).get();

      expect(mockRecordService.list).toHaveBeenCalledWith('posts', expect.objectContaining({
        expand: 'author,comments'
      }));
    });

    it('should build sort parameters', async () => {
      await queryBuilder.sort('created_at', 'desc').sort('title').get();

      expect(mockRecordService.list).toHaveBeenCalledWith('posts', expect.objectContaining({
        sort: '-created_at,+title'
      }));
    });

    it('should build filter parameters with fluent api', async () => {
      await queryBuilder
        .filter('active', '=', true)
        .filter('age', '>', 21)
        .get();

      expect(mockRecordService.list).toHaveBeenCalledWith('posts', expect.objectContaining({
        filter: 'active = true && age > 21'
      }));
    });

    it('should support raw filter strings', async () => {
      await queryBuilder.filter('active = true OR id = 1').get();

      expect(mockRecordService.list).toHaveBeenCalledWith('posts', expect.objectContaining({
        filter: '(active = true OR id = 1)'
      }));
    });

    it('should format string values correctly', async () => {
      await queryBuilder.filter('title', '=', "It's a me, Mario").get();

      expect(mockRecordService.list).toHaveBeenCalledWith('posts', expect.objectContaining({
        filter: "title = 'It\\'s a me, Mario'"
      }));
    });
  });

  describe('pagination', () => {
    it('should use page/perPage by default', async () => {
      await queryBuilder.page(2, 10).get();

      expect(mockRecordService.list).toHaveBeenCalledWith('posts', expect.objectContaining({
        skip: 10,
        limit: 10
      }));
    });

    it('should switch to skip/limit if used', async () => {
      await queryBuilder.skip(50).limit(25).get();

      expect(mockRecordService.list).toHaveBeenCalledWith('posts', expect.objectContaining({
        skip: 50,
        limit: 25
      }));
    });
  });

  describe('execution', () => {
    it('should return list result on get()', async () => {
      const mockResult = {
        items: [{ id: '1' }],
        total: 1,
        skip: 0,
        limit: 30
      };
      mockRecordService.list.mockResolvedValue(mockResult);

      const result = await queryBuilder.get();
      expect(result).toBe(mockResult);
    });

    it('should return first item on first()', async () => {
      const mockResult = {
        items: [{ id: '1', title: 'First' }],
        total: 1,
        skip: 0,
        limit: 1
      };
      // We expect first() to force limit=1
      mockRecordService.list.mockResolvedValue(mockResult);

      const result = await queryBuilder.first();
      
      expect(mockRecordService.list).toHaveBeenCalledWith('posts', expect.objectContaining({
        limit: 1,
        skip: 0
      }));
      expect(result).toEqual({ id: '1', title: 'First' });
    });

    it('should return null on first() if empty', async () => {
      const mockResult = {
        items: [],
        total: 0,
        skip: 0,
        limit: 1
      };
      mockRecordService.list.mockResolvedValue(mockResult);

      const result = await queryBuilder.first();
      expect(result).toBeNull();
    });
  });

  describe('RecordService integration', () => {
    it('should create query builder from service', () => {
      const qb = mockRecordService.query('users');
      expect(qb).toBeInstanceOf(QueryBuilder);
      // @ts-ignore - check private property to ensure it's bound correctly
      expect(qb.collection).toBe('users');
    });
  });
});
