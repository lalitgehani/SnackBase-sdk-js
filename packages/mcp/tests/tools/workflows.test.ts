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
        toggle: vi.fn(),
        trigger: vi.fn(),
        listInstances: vi.fn(),
        getInstance: vi.fn(),
        cancelInstance: vi.fn(),
        retryInstance: vi.fn(),
        resumeInstance: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles list action with limit/offset filters', async () => {
    const mockWorkflows = { items: [{ id: 'wf-1', name: 'my-workflow' }], total: 1 };
    mockClient.workflows.list.mockResolvedValue(mockWorkflows);

    const result = await handleWorkflowsTool({
      action: 'list',
      limit: 20,
      offset: 5,
      enabled: true,
      trigger_type: 'manual',
    }) as any;

    expect(mockClient.workflows.list).toHaveBeenCalledWith({
      limit: 20,
      offset: 5,
      enabled: true,
      trigger_type: 'manual',
    });
    expect(result.content[0].text).toBe(JSON.stringify(mockWorkflows, null, 2));
  });

  it('handles get action', async () => {
    const mockWorkflow = { id: 'wf-1', name: 'my-workflow' };
    mockClient.workflows.get.mockResolvedValue(mockWorkflow);

    const result = await handleWorkflowsTool({ action: 'get', workflow_id: 'wf-1' }) as any;

    expect(mockClient.workflows.get).toHaveBeenCalledWith('wf-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockWorkflow, null, 2));
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

  it('handles toggle action', async () => {
    const mockResponse = { id: 'wf-1', enabled: false };
    mockClient.workflows.toggle.mockResolvedValue(mockResponse);

    const result = await handleWorkflowsTool({ action: 'toggle', workflow_id: 'wf-1' }) as any;

    expect(mockClient.workflows.toggle).toHaveBeenCalledWith('wf-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles trigger with input', async () => {
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

  it('handles list_instances with status filter', async () => {
    const mockInstances = { items: [{ id: 'inst-1', status: 'completed' }], total: 1 };
    mockClient.workflows.listInstances.mockResolvedValue(mockInstances);

    const result = await handleWorkflowsTool({
      action: 'list_instances',
      workflow_id: 'wf-1',
      limit: 10,
      offset: 0,
      status: 'completed',
    }) as any;

    expect(mockClient.workflows.listInstances).toHaveBeenCalledWith('wf-1', {
      limit: 10,
      offset: 0,
      status: 'completed',
    });
    expect(result.content[0].text).toBe(JSON.stringify(mockInstances, null, 2));
  });

  it('get_instance uses single instance_id arg', async () => {
    const mockInstance = { id: 'inst-1', status: 'completed', workflow_id: 'wf-1' };
    mockClient.workflows.getInstance.mockResolvedValue(mockInstance);

    const result = await handleWorkflowsTool({
      action: 'get_instance',
      instance_id: 'inst-1',
    }) as any;

    expect(mockClient.workflows.getInstance).toHaveBeenCalledWith('inst-1');
    expect(mockClient.workflows.getInstance.mock.calls[0]).toHaveLength(1);
    expect(result.content[0].text).toBe(JSON.stringify(mockInstance, null, 2));
  });

  it('cancel_instance uses single instance_id arg', async () => {
    const mockInstance = { id: 'inst-1', status: 'cancelled' };
    mockClient.workflows.cancelInstance.mockResolvedValue(mockInstance);

    await handleWorkflowsTool({
      action: 'cancel_instance',
      instance_id: 'inst-1',
    });

    expect(mockClient.workflows.cancelInstance).toHaveBeenCalledWith('inst-1');
    expect(mockClient.workflows.cancelInstance.mock.calls[0]).toHaveLength(1);
  });

  it('retry_instance uses single instance_id arg', async () => {
    const mockInstance = { id: 'inst-1', status: 'running' };
    mockClient.workflows.retryInstance.mockResolvedValue(mockInstance);

    await handleWorkflowsTool({
      action: 'retry_instance',
      instance_id: 'inst-1',
    });

    expect(mockClient.workflows.retryInstance).toHaveBeenCalledWith('inst-1');
    expect(mockClient.workflows.retryInstance.mock.calls[0]).toHaveLength(1);
  });

  it('handles resume_instance', async () => {
    const mockInstance = { id: 'inst-1', status: 'running' };
    mockClient.workflows.resumeInstance.mockResolvedValue(mockInstance);

    const result = await handleWorkflowsTool({
      action: 'resume_instance',
      instance_id: 'inst-1',
    }) as any;

    expect(mockClient.workflows.resumeInstance).toHaveBeenCalledWith('inst-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockInstance, null, 2));
  });

  it('throws when instance_id missing for get_instance', async () => {
    const result = await handleWorkflowsTool({ action: 'get_instance' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('instance_id is required');
  });

  it('maps SDK errors correctly', async () => {
    mockClient.workflows.list.mockRejectedValue(new Error('SDK Error'));

    const result = await handleWorkflowsTool({ action: 'list' }) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('SDK Error');
  });
});
