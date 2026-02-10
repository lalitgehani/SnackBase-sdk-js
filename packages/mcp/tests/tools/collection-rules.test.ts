import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCollectionRulesTool } from '../../src/tools/collection-rules.js';
import { createClient } from '../../src/client.js';

// Mock the client factory
vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_collection_rules tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      collectionRules: {
        get: vi.fn(),
        update: vi.fn(),
        validateRule: vi.fn(),
        testRule: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles get action', async () => {
    const mockRules = { list_rule: 'true' };
    mockClient.collectionRules.get.mockResolvedValue(mockRules);

    const result = await handleCollectionRulesTool({ 
      action: 'get', 
      collection_name: 'test' 
    });

    expect(mockClient.collectionRules.get).toHaveBeenCalledWith('test');
    expect(result.content[0].text).toBe(JSON.stringify(mockRules, null, 2));
  });

  it('throws error when collection_name is missing for get', async () => {
    const result = await handleCollectionRulesTool({ action: 'get' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('collection_name is required');
  });

  it('handles update action', async () => {
    const mockData = { list_rule: 'auth != null' };
    const mockResponse = { ...mockData };
    mockClient.collectionRules.update.mockResolvedValue(mockResponse);

    const result = await handleCollectionRulesTool({ 
      action: 'update', 
      collection_name: 'test',
      data: mockData
    });

    expect(mockClient.collectionRules.update).toHaveBeenCalledWith('test', mockData);
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles validate action', async () => {
    const mockResult = { valid: true };
    mockClient.collectionRules.validateRule.mockResolvedValue(mockResult);

    const result = await handleCollectionRulesTool({ 
      action: 'validate', 
      rule: 'auth != null',
      operation: 'list',
      collection_fields: ['id', 'name']
    });

    expect(mockClient.collectionRules.validateRule).toHaveBeenCalledWith('auth != null', 'list', ['id', 'name']);
    expect(result.content[0].text).toBe(JSON.stringify(mockResult, null, 2));
  });

  it('handles test action', async () => {
    const mockResult = { result: true };
    mockClient.collectionRules.testRule.mockResolvedValue(mockResult);

    const result = await handleCollectionRulesTool({ 
      action: 'test', 
      rule: 'auth != null',
      context: { auth: { id: '1' } }
    });

    expect(mockClient.collectionRules.testRule).toHaveBeenCalledWith('auth != null', { auth: { id: '1' } });
    expect(result.content[0].text).toBe(JSON.stringify(mockResult, null, 2));
  });

  it('maps SDK errors correctly', async () => {
    // We can't easily import SnackBaseError here without properly setting up the workspace in vitest,
    // but we can mock handleToolError or just check that it's called (it's tried in handleCollectionRulesTool)
    // For now, let's just trigger a generic error and check if handleToolError is effective.
    const error = new Error('Generic Error');
    mockClient.collectionRules.get.mockRejectedValue(error);

    const result = await handleCollectionRulesTool({ action: 'get', collection_name: 'test' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unexpected error: Generic Error');
  });

  it('handles unknown action', async () => {
    const result = await handleCollectionRulesTool({ action: 'invalid' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
