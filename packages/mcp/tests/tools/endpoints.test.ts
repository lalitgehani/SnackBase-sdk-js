import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleEndpointsTool } from '../../src/tools/endpoints.js';
import { createClient } from '../../src/client.js';

vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_endpoints tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      endpoints: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        toggle: vi.fn(),
        listExecutions: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles list action', async () => {
    const mockEndpoints = [{ id: 'ep-1', name: 'my-endpoint', method: 'GET', path: '/hello' }];
    mockClient.endpoints.list.mockResolvedValue(mockEndpoints);

    const result = await handleEndpointsTool({ action: 'list' }) as any;

    expect(mockClient.endpoints.list).toHaveBeenCalled();
    expect(result.content[0].text).toBe(JSON.stringify(mockEndpoints, null, 2));
  });

  it('handles get action', async () => {
    const mockEndpoint = { id: 'ep-1', name: 'my-endpoint' };
    mockClient.endpoints.get.mockResolvedValue(mockEndpoint);

    const result = await handleEndpointsTool({ action: 'get', endpoint_id: 'ep-1' }) as any;

    expect(mockClient.endpoints.get).toHaveBeenCalledWith('ep-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockEndpoint, null, 2));
  });

  it('throws error when endpoint_id is missing for get', async () => {
    const result = await handleEndpointsTool({ action: 'get' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('endpoint_id is required');
  });

  it('handles create action', async () => {
    const mockInput = { name: 'hello', method: 'GET', path: '/hello' };
    const mockResponse = { id: 'ep-2', enabled: true, ...mockInput };
    mockClient.endpoints.create.mockResolvedValue(mockResponse);

    const result = await handleEndpointsTool({ action: 'create', ...mockInput }) as any;

    expect(mockClient.endpoints.create).toHaveBeenCalledWith(expect.objectContaining(mockInput));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('throws error when required fields are missing for create', async () => {
    const result = await handleEndpointsTool({ action: 'create', name: 'hello', method: 'GET' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('name, method, and path are required');
  });

  it('handles update action', async () => {
    const mockResponse = { id: 'ep-1', name: 'updated', method: 'POST', path: '/updated' };
    mockClient.endpoints.update.mockResolvedValue(mockResponse);

    const result = await handleEndpointsTool({
      action: 'update',
      endpoint_id: 'ep-1',
      name: 'updated',
      method: 'POST',
      path: '/updated',
    }) as any;

    expect(mockClient.endpoints.update).toHaveBeenCalledWith('ep-1', expect.any(Object));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('throws error when endpoint_id is missing for update', async () => {
    const result = await handleEndpointsTool({ action: 'update' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('endpoint_id is required');
  });

  it('handles delete action', async () => {
    mockClient.endpoints.delete.mockResolvedValue({ success: true });

    const result = await handleEndpointsTool({ action: 'delete', endpoint_id: 'ep-1' }) as any;

    expect(mockClient.endpoints.delete).toHaveBeenCalledWith('ep-1');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('handles toggle action', async () => {
    const mockResponse = { id: 'ep-1', enabled: false };
    mockClient.endpoints.toggle.mockResolvedValue(mockResponse);

    const result = await handleEndpointsTool({ action: 'toggle', endpoint_id: 'ep-1' }) as any;

    expect(mockClient.endpoints.toggle).toHaveBeenCalledWith('ep-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('throws error when endpoint_id is missing for toggle', async () => {
    const result = await handleEndpointsTool({ action: 'toggle' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('endpoint_id is required');
  });

  it('handles list_executions action', async () => {
    const mockExecutions = { items: [{ id: 'exec-1', status: 'completed' }], total: 1 };
    mockClient.endpoints.listExecutions.mockResolvedValue(mockExecutions);

    const result = await handleEndpointsTool({ action: 'list_executions', endpoint_id: 'ep-1' }) as any;

    expect(mockClient.endpoints.listExecutions).toHaveBeenCalledWith('ep-1', expect.any(Object));
    expect(result.content[0].text).toBe(JSON.stringify(mockExecutions, null, 2));
  });

  it('throws error when endpoint_id is missing for list_executions', async () => {
    const result = await handleEndpointsTool({ action: 'list_executions' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('endpoint_id is required');
  });

  it('maps SDK errors correctly', async () => {
    mockClient.endpoints.list.mockRejectedValue(new Error('SDK Error'));

    const result = await handleEndpointsTool({ action: 'list' }) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('SDK Error');
  });

  it('handles unknown action', async () => {
    const result = await handleEndpointsTool({ action: 'invalid' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
