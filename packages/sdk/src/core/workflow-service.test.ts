import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowService } from './workflow-service';
import { HttpClient } from './http-client';

describe('WorkflowService', () => {
  let workflowService: WorkflowService;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    workflowService = new WorkflowService(mockHttpClient as unknown as HttpClient);
  });

  describe('list', () => {
    it('should call GET /api/v1/workflows', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await workflowService.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/workflows', { params: undefined });
      expect(result).toEqual(mockResponse.data);
    });

    it('should pass params as query parameters', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const params = { page: 2, page_size: 10 };
      await workflowService.list(params);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/workflows', { params });
    });
  });

  describe('get', () => {
    it('should call GET /api/v1/workflows/{id}', async () => {
      const mockWorkflow = { id: 'wf1', name: 'Test', trigger: { type: 'manual' }, steps: [], enabled: true, created_at: '', updated_at: '' };
      mockHttpClient.get.mockResolvedValue({ data: mockWorkflow });

      const result = await workflowService.get('wf1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/workflows/wf1');
      expect(result).toEqual(mockWorkflow);
    });
  });

  describe('create', () => {
    it('should call POST /api/v1/workflows with data', async () => {
      const createData = { name: 'New Workflow', trigger: { type: 'manual' as const } };
      const mockWorkflow = { id: 'wf1', ...createData, steps: [], enabled: true, created_at: '', updated_at: '' };
      mockHttpClient.post.mockResolvedValue({ data: mockWorkflow });

      const result = await workflowService.create(createData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/workflows', createData);
      expect(result).toEqual(mockWorkflow);
    });
  });

  describe('update', () => {
    it('should call PUT /api/v1/workflows/{id} with data', async () => {
      const updateData = { name: 'Updated Workflow' };
      const mockWorkflow = { id: 'wf1', name: 'Updated Workflow', trigger: { type: 'manual' }, steps: [], enabled: true, created_at: '', updated_at: '' };
      mockHttpClient.put.mockResolvedValue({ data: mockWorkflow });

      const result = await workflowService.update('wf1', updateData);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/v1/workflows/wf1', updateData);
      expect(result).toEqual(mockWorkflow);
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/v1/workflows/{id} and return success', async () => {
      mockHttpClient.delete.mockResolvedValue({});

      const result = await workflowService.delete('wf1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/workflows/wf1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('trigger', () => {
    it('should call POST /api/v1/workflows/{id}/trigger with empty body when no input', async () => {
      const mockInstance = { id: 'inst1', workflow_id: 'wf1', status: 'pending', created_at: '', updated_at: '' };
      mockHttpClient.post.mockResolvedValue({ data: mockInstance });

      const result = await workflowService.trigger('wf1');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/workflows/wf1/trigger', {});
      expect(result).toEqual(mockInstance);
    });

    it('should pass input object in request body', async () => {
      const mockInstance = { id: 'inst1', workflow_id: 'wf1', status: 'pending', created_at: '', updated_at: '' };
      mockHttpClient.post.mockResolvedValue({ data: mockInstance });

      const input = { key: 'val', userId: 'u1' };
      await workflowService.trigger('wf1', input);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/workflows/wf1/trigger', input);
    });
  });

  describe('listInstances', () => {
    it('should call GET /api/v1/workflows/{id}/instances', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await workflowService.listInstances('wf1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/workflows/wf1/instances', { params: undefined });
      expect(result).toEqual(mockResponse.data);
    });

    it('should pass page as query parameter', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      await workflowService.listInstances('wf1', { page: 2 });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/workflows/wf1/instances', { params: { page: 2 } });
    });
  });

  describe('getInstance', () => {
    it('should call GET /api/v1/workflows/{workflowId}/instances/{instanceId}', async () => {
      const mockInstance = { id: 'inst1', workflow_id: 'wf1', status: 'completed', created_at: '', updated_at: '' };
      mockHttpClient.get.mockResolvedValue({ data: mockInstance });

      const result = await workflowService.getInstance('wf1', 'inst1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/workflows/wf1/instances/inst1');
      expect(result).toEqual(mockInstance);
    });
  });

  describe('cancelInstance', () => {
    it('should call POST /api/v1/workflows/{workflowId}/instances/{instanceId}/cancel', async () => {
      const mockInstance = { id: 'i1', workflow_id: 'wf1', status: 'cancelled', created_at: '', updated_at: '' };
      mockHttpClient.post.mockResolvedValue({ data: mockInstance });

      const result = await workflowService.cancelInstance('wf1', 'i1');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/workflows/wf1/instances/i1/cancel');
      expect(result).toEqual(mockInstance);
    });
  });

  describe('retryInstance', () => {
    it('should call POST /api/v1/workflows/{workflowId}/instances/{instanceId}/retry', async () => {
      const mockInstance = { id: 'i1', workflow_id: 'wf1', status: 'pending', created_at: '', updated_at: '' };
      mockHttpClient.post.mockResolvedValue({ data: mockInstance });

      const result = await workflowService.retryInstance('wf1', 'i1');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/workflows/wf1/instances/i1/retry');
      expect(result).toEqual(mockInstance);
    });
  });
});
