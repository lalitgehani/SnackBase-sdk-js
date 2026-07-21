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

  it('handles list with limit/offset and filters', async () => {
    const mockEndpoints = { items: [{ id: 'ep-1', name: 'my-endpoint' }], total: 1 };
    mockClient.endpoints.list.mockResolvedValue(mockEndpoints);

    const result = await handleEndpointsTool({
      action: 'list',
      method: 'GET',
      enabled: true,
      limit: 10,
      offset: 0,
    }) as any;

    expect(mockClient.endpoints.list).toHaveBeenCalledWith({
      method: 'GET',
      enabled: true,
      limit: 10,
      offset: 0,
    });
    const callArg = mockClient.endpoints.list.mock.calls[0][0];
    expect(callArg).not.toHaveProperty('page');
    expect(callArg).not.toHaveProperty('page_size');
    expect(result.content[0].text).toBe(JSON.stringify(mockEndpoints, null, 2));
  });

  it('handles get action', async () => {
    const mockEndpoint = { id: 'ep-1', name: 'my-endpoint' };
    mockClient.endpoints.get.mockResolvedValue(mockEndpoint);

    const result = await handleEndpointsTool({ action: 'get', endpoint_id: 'ep-1' }) as any;

    expect(mockClient.endpoints.get).toHaveBeenCalledWith('ep-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockEndpoint, null, 2));
  });

  it('handles create with full EndpointCreate body including actions', async () => {
    const mockInput = {
      name: 'hello',
      method: 'POST',
      path: '/hello',
      description: 'Say hello',
      auth_required: true,
      condition: 'true',
      actions: [{ type: 'respond', body: { ok: true } }],
      response_template: { status: 200 },
      enabled: true,
    };
    const mockResponse = { id: 'ep-2', ...mockInput };
    mockClient.endpoints.create.mockResolvedValue(mockResponse);

    const result = await handleEndpointsTool({ action: 'create', ...mockInput }) as any;

    expect(mockClient.endpoints.create).toHaveBeenCalledWith(expect.objectContaining(mockInput));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('throws when required create fields missing', async () => {
    const result = await handleEndpointsTool({
      action: 'create',
      name: 'hello',
      method: 'GET',
    }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('name, method, and path are required');
  });

  it('handles toggle and list_executions with limit/offset', async () => {
    mockClient.endpoints.toggle.mockResolvedValue({ id: 'ep-1', enabled: false });
    mockClient.endpoints.listExecutions.mockResolvedValue({ items: [], total: 0 });

    await handleEndpointsTool({ action: 'toggle', endpoint_id: 'ep-1' });
    expect(mockClient.endpoints.toggle).toHaveBeenCalledWith('ep-1');

    await handleEndpointsTool({
      action: 'list_executions',
      endpoint_id: 'ep-1',
      limit: 5,
      offset: 2,
    });
    expect(mockClient.endpoints.listExecutions).toHaveBeenCalledWith('ep-1', {
      limit: 5,
      offset: 2,
    });
  });

  it('handles delete action', async () => {
    mockClient.endpoints.delete.mockResolvedValue({ success: true });
    const result = await handleEndpointsTool({ action: 'delete', endpoint_id: 'ep-1' }) as any;
    expect(mockClient.endpoints.delete).toHaveBeenCalledWith('ep-1');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });
});
