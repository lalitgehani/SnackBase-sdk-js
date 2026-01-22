import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionRuleService } from './collection-rule-service';
import { HttpClient } from './http-client';
import { CollectionRuleUpdate } from '../types/role';

describe('CollectionRuleService', () => {
  let collectionRuleService: CollectionRuleService;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
    };
    collectionRuleService = new CollectionRuleService(mockHttpClient as unknown as HttpClient);
  });

  describe('get', () => {
    it('should call GET /api/v1/collections/:name/rules', async () => {
      const mockRules = { list_rule: '@is_authenticated()' };
      mockHttpClient.get.mockResolvedValue({ data: mockRules });

      const result = await collectionRuleService.get('posts');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/collections/posts/rules');
      expect(result).toEqual(mockRules);
    });
  });

  describe('update', () => {
    it('should call PUT /api/v1/collections/:name/rules', async () => {
      const updateData: CollectionRuleUpdate = { list_rule: '' };
      const mockRules = { list_rule: '' };
      mockHttpClient.put.mockResolvedValue({ data: mockRules });

      const result = await collectionRuleService.update('posts', updateData);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/v1/collections/posts/rules', updateData);
      expect(result).toEqual(mockRules);
    });
  });

  describe('validateRule', () => {
    it('should call POST /api/v1/rules/validate', async () => {
      const mockResponse = { data: { valid: true } };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await collectionRuleService.validateRule('@is_authenticated()', 'list', ['id', 'title']);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/rules/validate', {
        rule: '@is_authenticated()',
        operation: 'list',
        collectionFields: ['id', 'title'],
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('testRule', () => {
    it('should call POST /api/v1/rules/test', async () => {
      const mockResponse = { data: { result: true } };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await collectionRuleService.testRule('@is_authenticated()', { user: { id: '1' } });

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/rules/test', {
        rule: '@is_authenticated()',
        context: { user: { id: '1' } },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
