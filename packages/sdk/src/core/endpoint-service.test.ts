import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EndpointService } from './endpoint-service';
import { HttpClient } from './http-client';
import { EndpointCreate, EndpointUpdate } from '../types/endpoint';

describe('EndpointService', () => {
  let endpointService: EndpointService;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };
    endpointService = new EndpointService(mockHttpClient as unknown as HttpClient);
  });

  describe('list', () => {
    it('should call GET /api/v1/endpoints with limit/offset and filters (not page/page_size)', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const params = { limit: 20, offset: 0, method: 'GET', enabled: true };
      const result = await endpointService.list(params);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/endpoints', { params });
      const calledParams = mockHttpClient.get.mock.calls[0][1].params;
      expect(calledParams).toHaveProperty('limit', 20);
      expect(calledParams).toHaveProperty('offset', 0);
      expect(calledParams).not.toHaveProperty('page');
      expect(calledParams).not.toHaveProperty('page_size');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('get', () => {
    it('should call GET /api/v1/endpoints/:id', async () => {
      const mockEndpoint = {
        id: 'ep1',
        account_id: 'AB1234',
        name: 'My Endpoint',
        description: null,
        method: 'GET',
        path: '/hello',
        auth_required: true,
        condition: null,
        actions: [],
        response_template: null,
        enabled: true,
        created_at: '',
        updated_at: '',
        created_by: null,
      };
      mockHttpClient.get.mockResolvedValue({ data: mockEndpoint });

      const result = await endpointService.get('ep1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/endpoints/ep1');
      expect(result).toEqual(mockEndpoint);
    });
  });

  describe('create', () => {
    it('should call POST /api/v1/endpoints with full create body including actions and auth_required', async () => {
      const createData: EndpointCreate = {
        name: 'Notify',
        method: 'POST',
        path: '/notify/:id',
        description: 'Fire a webhook',
        auth_required: true,
        condition: 'status = "active"',
        actions: [{ type: 'send_webhook', url: 'https://example.com/hook' }],
        response_template: { status: 200, body: { ok: true } },
        enabled: true,
      };
      const mockEndpoint = {
        id: 'ep1',
        account_id: 'AB1234',
        ...createData,
        description: createData.description ?? null,
        condition: createData.condition ?? null,
        actions: createData.actions ?? [],
        response_template: createData.response_template ?? null,
        created_at: '',
        updated_at: '',
        created_by: null,
      };
      mockHttpClient.post.mockResolvedValue({ data: mockEndpoint });

      const result = await endpointService.create(createData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/endpoints', createData);
      const body = mockHttpClient.post.mock.calls[0][1] as EndpointCreate;
      expect(body.actions).toEqual(createData.actions);
      expect(body.auth_required).toBe(true);
      expect(body.response_template).toEqual(createData.response_template);
      expect(result).toEqual(mockEndpoint);
    });
  });

  describe('update', () => {
    it('should call PUT (not PATCH) /api/v1/endpoints/:id with update data', async () => {
      const updateData: EndpointUpdate = {
        name: 'Updated',
        method: 'POST',
        path: '/updated',
        actions: [{ type: 'enqueue_job', handler: 'do_work' }],
      };
      const mockEndpoint = {
        id: 'ep1',
        account_id: 'AB1234',
        name: 'Updated',
        description: null,
        method: 'POST',
        path: '/updated',
        auth_required: true,
        condition: null,
        actions: updateData.actions,
        response_template: null,
        enabled: true,
        created_at: '',
        updated_at: '',
        created_by: null,
      };
      mockHttpClient.put.mockResolvedValue({ data: mockEndpoint });

      const result = await endpointService.update('ep1', updateData);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/v1/endpoints/ep1', updateData);
      expect(mockHttpClient.patch).not.toHaveBeenCalled();
      expect(result).toEqual(mockEndpoint);
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/v1/endpoints/:id and return success', async () => {
      mockHttpClient.delete.mockResolvedValue({ data: null });

      const result = await endpointService.delete('ep1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/endpoints/ep1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('toggle', () => {
    it('should call PATCH /api/v1/endpoints/:id/toggle with no body', async () => {
      const mockEndpoint = {
        id: 'ep1',
        account_id: 'AB1234',
        name: 'My Endpoint',
        description: null,
        method: 'GET',
        path: '/hello',
        auth_required: true,
        condition: null,
        actions: [],
        response_template: null,
        enabled: false,
        created_at: '',
        updated_at: '',
        created_by: null,
      };
      mockHttpClient.patch.mockResolvedValue({ data: mockEndpoint });

      const result = await endpointService.toggle('ep1');

      expect(mockHttpClient.patch).toHaveBeenCalledWith('/api/v1/endpoints/ep1/toggle');
      expect(result).toEqual(mockEndpoint);
    });
  });

  describe('listExecutions', () => {
    it('should call GET executions with limit/offset (not page/page_size)', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const params = { limit: 50, offset: 10 };
      const result = await endpointService.listExecutions('ep1', params);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/endpoints/ep1/executions', { params });
      const calledParams = mockHttpClient.get.mock.calls[0][1].params;
      expect(calledParams).toEqual({ limit: 50, offset: 10 });
      expect(calledParams).not.toHaveProperty('page');
      expect(result).toEqual(mockResponse.data);
    });
  });
});
