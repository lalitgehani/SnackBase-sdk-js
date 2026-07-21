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
    it('should call GET /api/v1/webhooks without pagination params', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await webhookService.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/webhooks');
      expect(mockHttpClient.get.mock.calls[0].length).toBe(1);
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
      const mockResponse = {
        data: { success: true, status_code: 200, response_body: 'ok', error: null },
      };
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

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/webhooks/wh-1/deliveries', {
        params: undefined,
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should pass limit/offset (not page/page_size) to deliveries', async () => {
      const mockResponse = { data: { items: [], total: 5 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const params = { limit: 10, offset: 20 };
      const result = await webhookService.listDeliveries('wh-1', params);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/webhooks/wh-1/deliveries', {
        params,
      });
      const calledParams = mockHttpClient.get.mock.calls[0][1].params;
      expect(calledParams).toEqual({ limit: 10, offset: 20 });
      expect(calledParams).not.toHaveProperty('page');
      expect(calledParams).not.toHaveProperty('page_size');
      expect(result).toEqual(mockResponse.data);
    });
  });
});
