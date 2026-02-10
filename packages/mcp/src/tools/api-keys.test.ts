import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleApiKeysTool } from '../../src/tools/api-keys.js';
import { createClient } from '../../src/client.js';

// Mock the client factory
vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_api_keys tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      apiKeys: {
        list: vi.fn(),
        create: vi.fn(),
        revoke: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles list action', async () => {
    const mockKeys = [{ id: '1', name: 'Test Key', last_4: '1234' }];
    mockClient.apiKeys.list.mockResolvedValue(mockKeys);

    const result = await handleApiKeysTool({ action: 'list' }) as any;

    expect(mockClient.apiKeys.list).toHaveBeenCalled();
    expect(result.content[0].text).toBe(JSON.stringify(mockKeys, null, 2));
  });

  it('handles create action', async () => {
    const mockInput = {
      name: 'New Key',
      expires_at: '2025-01-01T00:00:00Z',
    };
    const mockResponse = { id: 'key-123', key: 'sb_full_key_123', ...mockInput };
    mockClient.apiKeys.create.mockResolvedValue(mockResponse);

    const result = await handleApiKeysTool({ 
      action: 'create', 
      ...mockInput 
    }) as any;

    expect(mockClient.apiKeys.create).toHaveBeenCalledWith(expect.objectContaining(mockInput));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('throws error when name is missing for create', async () => {
    const result = await handleApiKeysTool({ action: 'create' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('name is required');
  });

  it('handles revoke action', async () => {
    mockClient.apiKeys.revoke.mockResolvedValue({ success: true });

    const result = await handleApiKeysTool({ 
      action: 'revoke', 
      key_id: 'key-123' 
    }) as any;

    expect(mockClient.apiKeys.revoke).toHaveBeenCalledWith('key-123');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('throws error when key_id is missing for revoke', async () => {
    const result = await handleApiKeysTool({ action: 'revoke' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('key_id is required');
  });

  it('maps SDK errors correctly', async () => {
    mockClient.apiKeys.list.mockRejectedValue(new Error('SDK Error'));

    const result = await handleApiKeysTool({ action: 'list' }) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('SDK Error');
  });

  it('handles unknown action', async () => {
    const result = await handleApiKeysTool({ action: 'invalid' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
