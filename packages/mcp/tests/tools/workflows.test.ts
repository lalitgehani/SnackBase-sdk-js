import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleWorkflowsTool } from '../../src/tools/workflows.js';
import { createClient } from '../../src/client.js';

vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_workflows tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      workflows: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        trigger: vi.fn(),
        listInstances: vi.fn(),
        getInstance: vi.fn(),
        cancelInstance: vi.fn(),
        retryInstance: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles list action', async () => {
    const mockWorkflows = [{ id: 'wf-1', name: 'my-workflow' }];
    mockClient.workflows.list.mockResolvedValue(mockWorkflows);

    const result = await handleWorkflowsTool({ action: 'list' }) as any;

    expect(mockClient.workflows.list).toHaveBeenCalled();
    expect(result.content[0].text).toBe(JSON.stringify(mockWorkflows, null, 2));
  });

  it('handles get action', async () => {
    const mockWorkflow = { id: 'wf-1', name: 'my-workflow' };
    mockClient.workflows.get.mockResolvedValue(mockWorkflow);

    const result = await handleWorkflowsTool({ action: 'get', workflow_id: 'wf-1' }) as any;

    expect(mockClient.workflows.get).toHaveBeenCalledWith('wf-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockWorkflow, null, 2));
  });

  it('throws error when workflow_id is missing for get', async () => {
    const result = await handleWorkflowsTool({ action: 'get' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('workflow_id is required');
  });

  it('handles create action', async () => {
    const mockInput = {
      name: 'approval-flow',
      trigger: { type: 'manual' },
    };
    const mockResponse = { id: 'wf-2', enabled: true, ...mockInput };
    mockClient.workflows.create.mockResolvedValue(mockResponse);

    const result = await handleWorkflowsTool({ action: 'create', ...mockInput }) as any;

    expect(mockClient.workflows.create).toHaveBeenCalledWith(expect.objectContaining(mockInput));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('throws error when name or trigger are missing for create', async () => {
    const result = await handleWorkflowsTool({ action: 'create', name: 'my-flow' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('name and trigger are required');
  });

  it('handles update action', async () => {
    const mockResponse = { id: 'wf-1', name: 'updated-flow' };
    mockClient.workflows.update.mockResolvedValue(mockResponse);

    const result = await handleWorkflowsTool({ action: 'update', workflow_id: 'wf-1', name: 'updated-flow' }) as any;

    expect(mockClient.workflows.update).toHaveBeenCalledWith('wf-1', expect.any(Object));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('throws error when workflow_id is missing for update', async () => {
    const result = await handleWorkflowsTool({ action: 'update' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('workflow_id is required');
  });

  it('handles delete action', async () => {
    mockClient.workflows.delete.mockResolvedValue({ success: true });

    const result = await handleWorkflowsTool({ action: 'delete', workflow_id: 'wf-1' }) as any;

    expect(mockClient.workflows.delete).toHaveBeenCalledWith('wf-1');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('handles trigger action', async () => {
    const mockInstance = { id: 'inst-1', status: 'running', workflow_id: 'wf-1' };
    mockClient.workflows.trigger.mockResolvedValue(mockInstance);

    const result = await handleWorkflowsTool({
      action: 'trigger',
      workflow_id: 'wf-1',
      input: { user_id: 'u-123' },
    }) as any;

    expect(mockClient.workflows.trigger).toHaveBeenCalledWith('wf-1', { user_id: 'u-123' });
    expect(result.content[0].text).toBe(JSON.stringify(mockInstance, null, 2));
  });

  it('throws error when workflow_id is missing for trigger', async () => {
    const result = await handleWorkflowsTool({ action: 'trigger' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('workflow_id is required');
  });

  it('handles list_instances action', async () => {
    const mockInstances = { items: [{ id: 'inst-1', status: 'completed' }], total: 1 };
    mockClient.workflows.listInstances.mockResolvedValue(mockInstances);

    const result = await handleWorkflowsTool({ action: 'list_instances', workflow_id: 'wf-1' }) as any;

    expect(mockClient.workflows.listInstances).toHaveBeenCalledWith('wf-1', expect.any(Object));
    expect(result.content[0].text).toBe(JSON.stringify(mockInstances, null, 2));
  });

  it('handles get_instance action', async () => {
    const mockInstance = { id: 'inst-1', status: 'completed', workflow_id: 'wf-1' };
    mockClient.workflows.getInstance.mockResolvedValue(mockInstance);

    const result = await handleWorkflowsTool({
      action: 'get_instance',
      workflow_id: 'wf-1',
      instance_id: 'inst-1',
    }) as any;

    expect(mockClient.workflows.getInstance).toHaveBeenCalledWith('wf-1', 'inst-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockInstance, null, 2));
  });

  it('throws error when workflow_id or instance_id is missing for get_instance', async () => {
    const result = await handleWorkflowsTool({ action: 'get_instance', workflow_id: 'wf-1' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('workflow_id and instance_id are required');
  });

  it('handles cancel_instance action', async () => {
    const mockInstance = { id: 'inst-1', status: 'cancelled', workflow_id: 'wf-1' };
    mockClient.workflows.cancelInstance.mockResolvedValue(mockInstance);

    const result = await handleWorkflowsTool({
      action: 'cancel_instance',
      workflow_id: 'wf-1',
      instance_id: 'inst-1',
    }) as any;

    expect(mockClient.workflows.cancelInstance).toHaveBeenCalledWith('wf-1', 'inst-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockInstance, null, 2));
  });

  it('handles retry_instance action', async () => {
    const mockInstance = { id: 'inst-1', status: 'running', workflow_id: 'wf-1' };
    mockClient.workflows.retryInstance.mockResolvedValue(mockInstance);

    const result = await handleWorkflowsTool({
      action: 'retry_instance',
      workflow_id: 'wf-1',
      instance_id: 'inst-1',
    }) as any;

    expect(mockClient.workflows.retryInstance).toHaveBeenCalledWith('wf-1', 'inst-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockInstance, null, 2));
  });

  it('maps SDK errors correctly', async () => {
    mockClient.workflows.list.mockRejectedValue(new Error('SDK Error'));

    const result = await handleWorkflowsTool({ action: 'list' }) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('SDK Error');
  });

  it('handles unknown action', async () => {
    const result = await handleWorkflowsTool({ action: 'invalid' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
