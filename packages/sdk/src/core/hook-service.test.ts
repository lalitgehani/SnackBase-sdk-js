import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HookService } from './hook-service';
import { HttpClient } from './http-client';
import { HookCreate, HookUpdate, HookTriggerConfig } from '../types/hook';

describe('HookService', () => {
  let hookService: HookService;
  let mockHttpClient: any;

  const mockHook = {
    id: 'h1',
    name: 'My Hook',
    trigger: { type: 'manual' as const },
    actions: [],
    enabled: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };
    hookService = new HookService(mockHttpClient as unknown as HttpClient);
  });

  describe('list', () => {
    it('should call GET /api/v1/hooks and return response.data', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await hookService.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/hooks', { params: undefined });
      expect(result).toEqual(mockResponse.data);
    });

    it('should pass params to GET /api/v1/hooks', async () => {
      const mockResponse = { data: { items: [mockHook], total: 1 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const params = { trigger_type: 'manual' as const, limit: 10, offset: 0 };
      const result = await hookService.list(params);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/hooks', { params });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('get', () => {
    it('should call GET /api/v1/hooks/:id and return response.data', async () => {
      mockHttpClient.get.mockResolvedValue({ data: mockHook });

      const result = await hookService.get('h1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/hooks/h1');
      expect(result).toEqual(mockHook);
    });
  });

  describe('create', () => {
    it('should call POST /api/v1/hooks with data and return response.data', async () => {
      const createData: HookCreate = {
        name: 'My Hook',
        trigger: { type: 'manual' },
      };
      mockHttpClient.post.mockResolvedValue({ data: mockHook });

      const result = await hookService.create(createData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/hooks', createData);
      expect(result).toEqual(mockHook);
    });
  });

  describe('update', () => {
    it('should call PATCH (not PUT) /api/v1/hooks/:id with update data', async () => {
      const updateData: HookUpdate = { enabled: false };
      const updatedHook = { ...mockHook, enabled: false };
      mockHttpClient.patch.mockResolvedValue({ data: updatedHook });

      const result = await hookService.update('h1', updateData);

      expect(mockHttpClient.patch).toHaveBeenCalledWith('/api/v1/hooks/h1', updateData);
      expect(result).toEqual(updatedHook);
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/v1/hooks/:id and return { success: true }', async () => {
      mockHttpClient.delete.mockResolvedValue({});

      const result = await hookService.delete('h1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/hooks/h1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('toggle', () => {
    it('should call PATCH /api/v1/hooks/:id/toggle with no body', async () => {
      const toggledHook = { ...mockHook, enabled: false };
      mockHttpClient.patch.mockResolvedValue({ data: toggledHook });

      const result = await hookService.toggle('h1');

      expect(mockHttpClient.patch).toHaveBeenCalledWith('/api/v1/hooks/h1/toggle');
      expect(result).toEqual(toggledHook);
    });
  });

  describe('trigger', () => {
    it('should call POST /api/v1/hooks/:id/trigger with no body', async () => {
      mockHttpClient.post.mockResolvedValue({ data: { queued: true } });

      const result = await hookService.trigger('h1');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/hooks/h1/trigger');
      expect(result).toEqual({ queued: true });
    });
  });

  describe('listExecutions', () => {
    it('should call GET /api/v1/hooks/:id/executions and return response.data', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await hookService.listExecutions('h1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/hooks/h1/executions', { params: undefined });
      expect(result).toEqual(mockResponse.data);
    });

    it('should pass pagination params to GET /api/v1/hooks/:id/executions', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const params = { limit: 10, offset: 20 };
      const result = await hookService.listExecutions('h1', params);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/hooks/h1/executions', { params });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('HookTriggerConfig discriminated union', () => {
    it('schedule trigger requires cron field', () => {
      const trigger: HookTriggerConfig = { type: 'schedule', cron: '0 9 * * MON' };
      expect(trigger.type).toBe('schedule');
      if (trigger.type === 'schedule') {
        expect(trigger.cron).toBe('0 9 * * MON');
      }
    });

    it('event trigger requires event field and allows optional collection', () => {
      const trigger: HookTriggerConfig = { type: 'event', event: 'records.create', collection: 'products' };
      expect(trigger.type).toBe('event');
      if (trigger.type === 'event') {
        expect(trigger.event).toBe('records.create');
        expect(trigger.collection).toBe('products');
      }
    });

    it('manual trigger has no extra fields', () => {
      const trigger: HookTriggerConfig = { type: 'manual' };
      expect(trigger.type).toBe('manual');
    });
  });
});
