import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiKeyService } from './api-key-service';
import { HttpClient } from './http-client';
import { ApiKey, ApiKeyCreate } from '../types/api-key';

describe('ApiKeyService', () => {
  let apiKeyService: ApiKeyService;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };
    apiKeyService = new ApiKeyService(mockHttpClient as unknown as HttpClient);
  });

  describe('list', () => {
    it('should call GET /api/v1/admin/api-keys and return paginated data', async () => {
      const mockKeys: ApiKey[] = [
        {
          id: 'key-1',
          name: 'Test Key',
          key: 'sb_ak....1234',
          last_used_at: null,
          expires_at: null,
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
        },
      ];
      const mockResponse = { data: { items: mockKeys, total: 1 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await apiKeyService.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/admin/api-keys', { params: undefined });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('get', () => {
    it('should call GET /api/v1/admin/api-keys/:id and return data', async () => {
      const mockKey: ApiKey = {
        id: 'key-1',
        name: 'Test Key',
        key: 'sb_ak....1234',
        last_used_at: null,
        expires_at: null,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };
      mockHttpClient.get.mockResolvedValue({ data: mockKey });

      const result = await apiKeyService.get('key-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/admin/api-keys/key-1');
      expect(result).toEqual(mockKey);
    });
  });

  describe('create', () => {
    it('should call POST /api/v1/admin/api-keys with data and return new key', async () => {
      const createData: ApiKeyCreate = { name: 'New Key' };
      const mockNewKey: ApiKey = {
        id: 'key-2',
        name: 'New Key',
        key: 'sb_ak.test_123456789.abcdef',
        last_used_at: null,
        expires_at: null,
        is_active: true,
        created_at: '2023-01-02T00:00:00Z',
      };
      mockHttpClient.post.mockResolvedValue({ data: mockNewKey });

      const result = await apiKeyService.create(createData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/admin/api-keys', createData);
      expect(result).toEqual(mockNewKey);
    });
  });

  describe('revoke', () => {
    it('should call DELETE /api/v1/admin/api-keys/:id and return void', async () => {
      mockHttpClient.delete.mockResolvedValue({ data: undefined, status: 204 });

      await apiKeyService.revoke('key-1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/admin/api-keys/key-1');
    });
  });
});
