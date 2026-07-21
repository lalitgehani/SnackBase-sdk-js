import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleWebhooksTool } from '../../src/tools/webhooks.js';
import { createClient } from '../../src/client.js';

vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_webhooks tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      webhooks: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        test: vi.fn(),
        listDeliveries: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles list action with zero args', async () => {
    const mockWebhooks = { items: [{ id: 'wh-1', url: 'https://example.com/hook' }], total: 1 };
    mockClient.webhooks.list.mockResolvedValue(mockWebhooks);

    const result = await handleWebhooksTool({ action: 'list' }) as any;

    expect(mockClient.webhooks.list).toHaveBeenCalledWith();
    expect(result.content[0].text).toBe(JSON.stringify(mockWebhooks, null, 2));
  });

  it('handles get action', async () => {
    const mockWebhook = { id: 'wh-1', url: 'https://example.com/hook' };
    mockClient.webhooks.get.mockResolvedValue(mockWebhook);

    const result = await handleWebhooksTool({ action: 'get', webhook_id: 'wh-1' }) as any;

    expect(mockClient.webhooks.get).toHaveBeenCalledWith('wh-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockWebhook, null, 2));
  });

  it('throws error when webhook_id is missing for get', async () => {
    const result = await handleWebhooksTool({ action: 'get' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('webhook_id is required');
  });

  it('handles create with WebhookCreate shape (url, collection, events; no name)', async () => {
    const mockInput = {
      url: 'https://example.com/hook',
      collection: 'posts',
      events: ['record.create'],
      enabled: true,
    };
    const mockResponse = { id: 'wh-2', secret: 'abc123', ...mockInput };
    mockClient.webhooks.create.mockResolvedValue(mockResponse);

    const result = await handleWebhooksTool({ action: 'create', ...mockInput }) as any;

    expect(mockClient.webhooks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        url: mockInput.url,
        collection: mockInput.collection,
        events: mockInput.events,
        enabled: true,
      }),
    );
    const callArg = mockClient.webhooks.create.mock.calls[0][0];
    expect(callArg).not.toHaveProperty('name');
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('throws error when url, collection, or events are missing for create', async () => {
    const result = await handleWebhooksTool({
      action: 'create',
      url: 'https://example.com',
    }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('url, collection, and events are required');
  });

  it('handles update action', async () => {
    const mockResponse = { id: 'wh-1', url: 'https://updated.com/hook' };
    mockClient.webhooks.update.mockResolvedValue(mockResponse);

    const result = await handleWebhooksTool({
      action: 'update',
      webhook_id: 'wh-1',
      url: 'https://updated.com/hook',
    }) as any;

    expect(mockClient.webhooks.update).toHaveBeenCalledWith('wh-1', expect.any(Object));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles delete action', async () => {
    mockClient.webhooks.delete.mockResolvedValue({ success: true });

    const result = await handleWebhooksTool({ action: 'delete', webhook_id: 'wh-1' }) as any;

    expect(mockClient.webhooks.delete).toHaveBeenCalledWith('wh-1');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('handles test action', async () => {
    const mockResult = { success: true, status_code: 200, response_body: null, error: null };
    mockClient.webhooks.test.mockResolvedValue(mockResult);

    const result = await handleWebhooksTool({ action: 'test', webhook_id: 'wh-1' }) as any;

    expect(mockClient.webhooks.test).toHaveBeenCalledWith('wh-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockResult, null, 2));
  });

  it('handles list_deliveries with limit/offset', async () => {
    const mockDeliveries = { items: [{ id: 'd-1', status: 'delivered' }], total: 1 };
    mockClient.webhooks.listDeliveries.mockResolvedValue(mockDeliveries);

    const result = await handleWebhooksTool({
      action: 'list_deliveries',
      webhook_id: 'wh-1',
      limit: 10,
      offset: 0,
    }) as any;

    expect(mockClient.webhooks.listDeliveries).toHaveBeenCalledWith('wh-1', {
      limit: 10,
      offset: 0,
    });
    expect(result.content[0].text).toBe(JSON.stringify(mockDeliveries, null, 2));
  });

  it('maps SDK errors correctly', async () => {
    mockClient.webhooks.list.mockRejectedValue(new Error('SDK Error'));

    const result = await handleWebhooksTool({ action: 'list' }) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('SDK Error');
  });

  it('handles unknown action', async () => {
    const result = await handleWebhooksTool({ action: 'invalid' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
