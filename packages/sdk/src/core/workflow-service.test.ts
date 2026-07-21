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
      patch: vi.fn(),
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

    it('should pass limit/offset and filters (not page/page_size)', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const params = { limit: 10, offset: 20, trigger_type: 'manual' as const, enabled: true };
      await workflowService.list(params);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/workflows', { params });
      const calledParams = mockHttpClient.get.mock.calls[0][1].params;
      expect(calledParams).toHaveProperty('limit', 10);
      expect(calledParams).toHaveProperty('offset', 20);
      expect(calledParams).not.toHaveProperty('page');
      expect(calledParams).not.toHaveProperty('page_size');
    });
  });

  describe('get', () => {
    it('should call GET /api/v1/workflows/{id}', async () => {
      const mockWorkflow = {
        id: 'wf1',
        account_id: 'AB1234',
        name: 'Test',
        description: null,
        trigger_type: 'manual',
        trigger_config: {},
        steps: [],
        enabled: true,
        created_at: '',
        updated_at: '',
        created_by: null,
      };
      mockHttpClient.get.mockResolvedValue({ data: mockWorkflow });

      const result = await workflowService.get('wf1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/workflows/wf1');
      expect(result).toEqual(mockWorkflow);
    });
  });

  describe('create', () => {
    it('should call POST /api/v1/workflows with data including step positions', async () => {
      const createData = {
        name: 'New Workflow',
        trigger: { type: 'manual' as const },
        steps: [
          {
            name: 'step1',
            type: 'action',
            action_type: 'send_email',
            position_x: 100,
            position_y: 200,
          },
        ],
      };
      const mockWorkflow = {
        id: 'wf1',
        account_id: 'AB1234',
        name: 'New Workflow',
        description: null,
        trigger_type: 'manual',
        trigger_config: {},
        steps: createData.steps,
        enabled: true,
        created_at: '',
        updated_at: '',
        created_by: null,
      };
      mockHttpClient.post.mockResolvedValue({ data: mockWorkflow });

      const result = await workflowService.create(createData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/workflows', createData);
      expect(result.steps[0].position_x).toBe(100);
    });
  });

  describe('update', () => {
    it('should call PUT /api/v1/workflows/{id} with data', async () => {
      const updateData = { name: 'Updated Workflow' };
      const mockWorkflow = {
        id: 'wf1',
        account_id: 'AB1234',
        name: 'Updated Workflow',
        description: null,
        trigger_type: 'manual',
        trigger_config: {},
        steps: [],
        enabled: true,
        created_at: '',
        updated_at: '',
        created_by: null,
      };
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

  describe('toggle', () => {
    it('should call PATCH /api/v1/workflows/{id}/toggle', async () => {
      const mockWorkflow = {
        id: 'wf1',
        account_id: 'AB1234',
        name: 'Test',
        description: null,
        trigger_type: 'manual',
        trigger_config: {},
        steps: [],
        enabled: false,
        created_at: '',
        updated_at: '',
        created_by: null,
      };
      mockHttpClient.patch.mockResolvedValue({ data: mockWorkflow });

      const result = await workflowService.toggle('wf1');

      expect(mockHttpClient.patch).toHaveBeenCalledWith('/api/v1/workflows/wf1/toggle');
      expect(result.enabled).toBe(false);
    });
  });

  describe('trigger', () => {
    it('should call POST /api/v1/workflows/{id}/trigger with empty body when no input', async () => {
      const mockResponse = { message: 'queued', instance_id: 'inst1' };
      mockHttpClient.post.mockResolvedValue({ data: mockResponse });

      const result = await workflowService.trigger('wf1');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/workflows/wf1/trigger', {});
      expect(result).toEqual(mockResponse);
    });

    it('should pass input object in request body', async () => {
      const mockResponse = { message: 'queued', instance_id: 'inst1' };
      mockHttpClient.post.mockResolvedValue({ data: mockResponse });

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

    it('should pass limit/offset and status filter (not page)', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const params = { limit: 25, offset: 5, status: 'failed' as const };
      await workflowService.listInstances('wf1', params);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/workflows/wf1/instances', { params });
      const calledParams = mockHttpClient.get.mock.calls[0][1].params;
      expect(calledParams).not.toHaveProperty('page');
      expect(calledParams).toEqual(params);
    });
  });

  describe('getInstance', () => {
    it('should call GET /api/v1/workflow-instances/{instanceId}', async () => {
      const mockInstance = {
        id: 'inst1',
        workflow_id: 'wf1',
        account_id: 'AB1234',
        status: 'completed',
        current_step: null,
        context: {},
        started_at: '',
        completed_at: null,
        error_message: null,
        resume_job_id: null,
        step_logs: [],
      };
      mockHttpClient.get.mockResolvedValue({ data: mockInstance });

      const result = await workflowService.getInstance('inst1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/workflow-instances/inst1');
      expect(result).toEqual(mockInstance);
    });
  });

  describe('cancelInstance', () => {
    it('should call POST /api/v1/workflow-instances/{instanceId}/cancel', async () => {
      const mockInstance = {
        id: 'i1',
        workflow_id: 'wf1',
        account_id: 'AB1234',
        status: 'cancelled',
        current_step: null,
        context: {},
        started_at: '',
        completed_at: null,
        error_message: null,
        resume_job_id: null,
      };
      mockHttpClient.post.mockResolvedValue({ data: mockInstance });

      const result = await workflowService.cancelInstance('i1');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/workflow-instances/i1/cancel');
      expect(result).toEqual(mockInstance);
    });
  });

  describe('retryInstance / resumeInstance', () => {
    it('should call POST /api/v1/workflow-instances/{instanceId}/resume via retryInstance', async () => {
      const mockInstance = {
        id: 'i1',
        workflow_id: 'wf1',
        account_id: 'AB1234',
        status: 'running',
        current_step: null,
        context: {},
        started_at: '',
        completed_at: null,
        error_message: null,
        resume_job_id: null,
      };
      mockHttpClient.post.mockResolvedValue({ data: mockInstance });

      const result = await workflowService.retryInstance('i1');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/workflow-instances/i1/resume');
      expect(result).toEqual(mockInstance);
    });

    it('should call POST resume via resumeInstance', async () => {
      const mockInstance = {
        id: 'i1',
        workflow_id: 'wf1',
        account_id: 'AB1234',
        status: 'running',
        current_step: null,
        context: {},
        started_at: '',
        completed_at: null,
        error_message: null,
        resume_job_id: null,
      };
      mockHttpClient.post.mockResolvedValue({ data: mockInstance });

      await workflowService.resumeInstance('i1');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/workflow-instances/i1/resume');
    });
  });
});
