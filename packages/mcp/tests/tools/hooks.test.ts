import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleHooksTool } from '../../src/tools/hooks.js';
import { createClient } from '../../src/client.js';

vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_hooks tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      hooks: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        toggle: vi.fn(),
        trigger: vi.fn(),
        listExecutions: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles list action with limit/offset and filters', async () => {
    const mockHooks = { items: [{ id: 'h-1', name: 'on-create' }], total: 1 };
    mockClient.hooks.list.mockResolvedValue(mockHooks);

    const result = await handleHooksTool({
      action: 'list',
      limit: 10,
      offset: 5,
      trigger_type: 'event',
      enabled: true,
    }) as any;

    expect(mockClient.hooks.list).toHaveBeenCalledWith({
      limit: 10,
      offset: 5,
      trigger_type: 'event',
      enabled: true,
    });
    expect(result.content[0].text).toBe(JSON.stringify(mockHooks, null, 2));
  });

  it('handles get action', async () => {
    const mockHook = { id: 'h-1', name: 'on-create' };
    mockClient.hooks.get.mockResolvedValue(mockHook);

    const result = await handleHooksTool({ action: 'get', hook_id: 'h-1' }) as any;

    expect(mockClient.hooks.get).toHaveBeenCalledWith('h-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockHook, null, 2));
  });

  it('throws error when hook_id is missing for get', async () => {
    const result = await handleHooksTool({ action: 'get' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('hook_id is required');
  });

  it('handles create action', async () => {
    const mockInput = {
      name: 'on-record-create',
      trigger: { type: 'event', event: 'record.create', collection: 'posts' },
    };
    const mockResponse = { id: 'h-2', enabled: true, ...mockInput };
    mockClient.hooks.create.mockResolvedValue(mockResponse);

    const result = await handleHooksTool({ action: 'create', ...mockInput }) as any;

    expect(mockClient.hooks.create).toHaveBeenCalledWith(expect.objectContaining(mockInput));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('throws error when name or trigger are missing for create', async () => {
    const result = await handleHooksTool({ action: 'create', name: 'my-hook' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('name and trigger are required');
  });

  it('handles update action', async () => {
    const mockResponse = { id: 'h-1', name: 'updated-hook' };
    mockClient.hooks.update.mockResolvedValue(mockResponse);

    const result = await handleHooksTool({ action: 'update', hook_id: 'h-1', name: 'updated-hook' }) as any;

    expect(mockClient.hooks.update).toHaveBeenCalledWith('h-1', expect.any(Object));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('throws error when hook_id is missing for update', async () => {
    const result = await handleHooksTool({ action: 'update' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('hook_id is required');
  });

  it('handles delete action', async () => {
    mockClient.hooks.delete.mockResolvedValue({ success: true });

    const result = await handleHooksTool({ action: 'delete', hook_id: 'h-1' }) as any;

    expect(mockClient.hooks.delete).toHaveBeenCalledWith('h-1');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('handles toggle action', async () => {
    const mockResponse = { id: 'h-1', enabled: false };
    mockClient.hooks.toggle.mockResolvedValue(mockResponse);

    const result = await handleHooksTool({ action: 'toggle', hook_id: 'h-1' }) as any;

    expect(mockClient.hooks.toggle).toHaveBeenCalledWith('h-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('throws error when hook_id is missing for toggle', async () => {
    const result = await handleHooksTool({ action: 'toggle' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('hook_id is required');
  });

  it('handles trigger action', async () => {
    const mockResponse = { queued: true };
    mockClient.hooks.trigger.mockResolvedValue(mockResponse);

    const result = await handleHooksTool({ action: 'trigger', hook_id: 'h-1' }) as any;

    expect(mockClient.hooks.trigger).toHaveBeenCalledWith('h-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles list_executions action with limit/offset', async () => {
    const mockExecutions = { items: [{ id: 'e-1', status: 'completed' }], total: 1 };
    mockClient.hooks.listExecutions.mockResolvedValue(mockExecutions);

    const result = await handleHooksTool({
      action: 'list_executions',
      hook_id: 'h-1',
      limit: 20,
      offset: 0,
    }) as any;

    expect(mockClient.hooks.listExecutions).toHaveBeenCalledWith('h-1', {
      limit: 20,
      offset: 0,
    });
    expect(result.content[0].text).toBe(JSON.stringify(mockExecutions, null, 2));
  });

  it('throws error when hook_id is missing for list_executions', async () => {
    const result = await handleHooksTool({ action: 'list_executions' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('hook_id is required');
  });

  it('maps SDK errors correctly', async () => {
    mockClient.hooks.list.mockRejectedValue(new Error('SDK Error'));

    const result = await handleHooksTool({ action: 'list' }) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('SDK Error');
  });

  it('handles unknown action', async () => {
    const result = await handleHooksTool({ action: 'invalid' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
