import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookService } from './webhook-service';
import { HttpClient } from './http-client';
import { WebhookCreate, WebhookUpdate } from '../types/webhook';

describe('WebhookService', () => {
  let webhookService: WebhookService;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    webhookService = new WebhookService(mockHttpClient as unknown as HttpClient);
  });

  describe('list', () => {
    it('should call GET /api/v1/webhooks and return response.data', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await webhookService.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/webhooks', { params: undefined });
      expect(result).toEqual(mockResponse.data);
    });

    it('should pass params to GET /api/v1/webhooks', async () => {
      const mockResponse = { data: { items: [], total: 0, page: 2, page_size: 10 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const params = { page: 2, page_size: 10 };
      const result = await webhookService.list(params);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/webhooks', { params });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('get', () => {
    it('should call GET /api/v1/webhooks/:id and return response.data', async () => {
      const mockWebhook = {
        id: 'wh-1',
        account_id: 'AB1234',
        url: 'https://example.com/hook',
        collection: 'posts',
        events: ['create' as const],
        filter: null,
        enabled: true,
        headers: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: null,
      };
      mockHttpClient.get.mockResolvedValue({ data: mockWebhook });

      const result = await webhookService.get('wh-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/webhooks/wh-1');
      expect(result).toEqual(mockWebhook);
    });
  });

  describe('create', () => {
    it('should call POST /api/v1/webhooks with data and return WebhookCreateResponse including secret', async () => {
      const createData: WebhookCreate = {
        url: 'https://example.com/hook',
        collection: 'posts',
        events: ['create'],
      };
      const mockResponse = {
        data: {
          id: 'wh-1',
          account_id: 'AB1234',
          url: 'https://example.com/hook',
          collection: 'posts',
          events: ['create'],
          filter: null,
          enabled: true,
          headers: null,
          created_by: null,
          secret: 'whsec_abc123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await webhookService.create(createData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/webhooks', createData);
      expect(result).toEqual(mockResponse.data);
      expect(result.secret).toBe('whsec_abc123');
    });
  });

  describe('update', () => {
    it('should call PUT (not PATCH) /api/v1/webhooks/:id with update data', async () => {
      const updateData: WebhookUpdate = { enabled: false };
      const mockResponse = {
        data: {
          id: 'wh-1',
          account_id: 'AB1234',
          url: 'https://example.com/hook',
          collection: 'posts',
          events: ['create'],
          filter: null,
          enabled: false,
          headers: null,
          created_by: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      };
      mockHttpClient.put.mockResolvedValue(mockResponse);

      const result = await webhookService.update('wh-1', updateData);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/v1/webhooks/wh-1', updateData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/v1/webhooks/:id and return { success: true }', async () => {
      mockHttpClient.delete.mockResolvedValue({});

      const result = await webhookService.delete('wh-1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/webhooks/wh-1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('test', () => {
    it('should call POST /api/v1/webhooks/:id/test and return response.data', async () => {
      const mockResponse = { data: { success: true, status_code: 200, duration_ms: 42 } };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await webhookService.test('wh-1');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/webhooks/wh-1/test');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('listDeliveries', () => {
    it('should call GET /api/v1/webhooks/:id/deliveries and return response.data', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await webhookService.listDeliveries('wh-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/webhooks/wh-1/deliveries', { params: undefined });
      expect(result).toEqual(mockResponse.data);
    });

    it('should pass pagination params to GET /api/v1/webhooks/:id/deliveries', async () => {
      const mockResponse = { data: { items: [], total: 5, page: 2, page_size: 10 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const params = { page: 2, page_size: 10 };
      const result = await webhookService.listDeliveries('wh-1', params);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/webhooks/wh-1/deliveries', { params });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
