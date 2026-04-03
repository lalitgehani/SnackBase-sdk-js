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
    it('should call GET /api/v1/endpoints with params', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await endpointService.list({ page: 1 });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/endpoints', { params: { page: 1 } });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('get', () => {
    it('should call GET /api/v1/endpoints/:id', async () => {
      const mockEndpoint = { id: 'ep1', name: 'My Endpoint', method: 'GET', path: '/hello', enabled: true, created_at: '', updated_at: '' };
      mockHttpClient.get.mockResolvedValue({ data: mockEndpoint });

      const result = await endpointService.get('ep1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/endpoints/ep1');
      expect(result).toEqual(mockEndpoint);
    });
  });

  describe('create', () => {
    it('should call POST /api/v1/endpoints with data', async () => {
      const createData: EndpointCreate = { name: 'My Endpoint', method: 'GET', path: '/hello' };
      const mockEndpoint = { id: 'ep1', ...createData, enabled: true, created_at: '', updated_at: '' };
      mockHttpClient.post.mockResolvedValue({ data: mockEndpoint });

      const result = await endpointService.create(createData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/endpoints', createData);
      expect(result).toEqual(mockEndpoint);
    });
  });

  describe('update', () => {
    it('should call PUT (not PATCH) /api/v1/endpoints/:id with update data', async () => {
      const updateData: EndpointUpdate = { name: 'Updated', method: 'POST', path: '/updated' };
      const mockEndpoint = { id: 'ep1', ...updateData, enabled: true, created_at: '', updated_at: '' };
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
      const mockEndpoint = { id: 'ep1', name: 'My Endpoint', method: 'GET', path: '/hello', enabled: false, created_at: '', updated_at: '' };
      mockHttpClient.patch.mockResolvedValue({ data: mockEndpoint });

      const result = await endpointService.toggle('ep1');

      expect(mockHttpClient.patch).toHaveBeenCalledWith('/api/v1/endpoints/ep1/toggle');
      expect(result).toEqual(mockEndpoint);
    });
  });

  describe('listExecutions', () => {
    it('should call GET /api/v1/endpoints/:id/executions with page param', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await endpointService.listExecutions('ep1', { page: 2 });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/endpoints/ep1/executions', { params: { page: 2 } });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
