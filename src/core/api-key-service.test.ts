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
    it('should call GET /api/v1/api-keys and return data', async () => {
      const mockKeys: ApiKey[] = [
        {
          id: 'key-1',
          name: 'Test Key',
          masked_key: 'sk_...1234',
          last_4: '1234',
          expires_at: null,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          revoked_at: null,
        },
      ];
      mockHttpClient.get.mockResolvedValue({ data: mockKeys });

      const result = await apiKeyService.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/api-keys');
      expect(result).toEqual(mockKeys);
    });
  });

  describe('get', () => {
    it('should call GET /api/v1/api-keys/:id and return data', async () => {
      const mockKey: ApiKey = {
        id: 'key-1',
        name: 'Test Key',
        masked_key: 'sk_...1234',
        last_4: '1234',
        expires_at: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        revoked_at: null,
      };
      mockHttpClient.get.mockResolvedValue({ data: mockKey });

      const result = await apiKeyService.get('key-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/api-keys/key-1');
      expect(result).toEqual(mockKey);
    });
  });

  describe('create', () => {
    it('should call POST /api/v1/api-keys with data and return new key', async () => {
      const createData: ApiKeyCreate = { name: 'New Key' };
      const mockNewKey: ApiKey = {
        id: 'key-2',
        name: 'New Key',
        key: 'sk_test_123456789',
        masked_key: 'sk_...6789',
        last_4: '6789',
        expires_at: null,
        created_at: '2023-01-02T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        revoked_at: null,
      };
      mockHttpClient.post.mockResolvedValue({ data: mockNewKey });

      const result = await apiKeyService.create(createData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/api-keys', createData);
      expect(result).toEqual(mockNewKey);
    });
  });

  describe('revoke', () => {
    it('should call DELETE /api/v1/api-keys/:id and return success', async () => {
      mockHttpClient.delete.mockResolvedValue({});

      const result = await apiKeyService.revoke('key-1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/api-keys/key-1');
      expect(result).toEqual({ success: true });
    });
  });
});
