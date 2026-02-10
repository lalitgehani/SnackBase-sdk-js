import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCollectionsTool } from '../../src/tools/collections.js';
import { createClient } from '../../src/client.js';
import { SnackBaseError } from '@snackbase/sdk';

// Mock the client factory
vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_collections tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      collections: {
        list: vi.fn(),
        listNames: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        export: vi.fn(),
        import: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles list action', async () => {
    const mockCollections = [{ id: '1', name: 'test' }];
    mockClient.collections.list.mockResolvedValue(mockCollections);

    const result = await handleCollectionsTool({ action: 'list' });

    expect(mockClient.collections.list).toHaveBeenCalled();
    expect(result.content[0].text).toBe(JSON.stringify(mockCollections, null, 2));
  });

  it('handles list_names action', async () => {
    const mockNames = ['test1', 'test2'];
    mockClient.collections.listNames.mockResolvedValue(mockNames);

    const result = await handleCollectionsTool({ action: 'list_names' });

    expect(mockClient.collections.listNames).toHaveBeenCalled();
    expect(result.content[0].text).toBe(JSON.stringify(mockNames, null, 2));
  });

  it('handles get action', async () => {
    const mockCollection = { id: 'col-123', name: 'test' };
    mockClient.collections.get.mockResolvedValue(mockCollection);

    const result = await handleCollectionsTool({ 
      action: 'get', 
      collection_id: 'col-123' 
    });

    expect(mockClient.collections.get).toHaveBeenCalledWith('col-123');
    expect(result.content[0].text).toBe(JSON.stringify(mockCollection, null, 2));
  });

  it('throws error when collection_id is missing for get', async () => {
    const result = await handleCollectionsTool({ action: 'get' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('collection_id is required');
  });

  it('handles create action', async () => {
    const mockInput = {
      name: 'users',
      fields: [{ name: 'email', type: 'email' }]
    };
    const mockResponse = { id: 'col-456', ...mockInput };
    mockClient.collections.create.mockResolvedValue(mockResponse);

    const result = await handleCollectionsTool({ 
      action: 'create', 
      ...mockInput 
    });

    expect(mockClient.collections.create).toHaveBeenCalledWith(expect.objectContaining(mockInput));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles update action', async () => {
    const mockUpdate = { name: 'updated_name' };
    const mockResponse = { id: 'col-123', ...mockUpdate };
    mockClient.collections.update.mockResolvedValue(mockResponse);

    const result = await handleCollectionsTool({ 
      action: 'update', 
      collection_id: 'col-123',
      ...mockUpdate
    });

    expect(mockClient.collections.update).toHaveBeenCalledWith('col-123', expect.objectContaining(mockUpdate));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles delete action', async () => {
    mockClient.collections.delete.mockResolvedValue({ success: true });

    const result = await handleCollectionsTool({ 
      action: 'delete', 
      collection_id: 'col-123' 
    });

    expect(mockClient.collections.delete).toHaveBeenCalledWith('col-123');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('handles export action', async () => {
    const mockExport = { collections: [] };
    mockClient.collections.export.mockResolvedValue(mockExport);

    const result = await handleCollectionsTool({ 
      action: 'export', 
      collection_ids: ['1', '2'] 
    });

    expect(mockClient.collections.export).toHaveBeenCalledWith({ collection_ids: ['1', '2'] });
    expect(result.content[0].text).toBe(JSON.stringify(mockExport, null, 2));
  });

  it('handles import action', async () => {
    const mockData = { collections: [] };
    const mockResult = { success: true };
    mockClient.collections.import.mockResolvedValue(mockResult);

    const result = await handleCollectionsTool({ 
      action: 'import', 
      data: mockData,
      strategy: 'update'
    });

    expect(mockClient.collections.import).toHaveBeenCalledWith({ data: mockData, strategy: 'update' });
    expect(result.content[0].text).toBe(JSON.stringify(mockResult, null, 2));
  });

  it('maps SDK errors correctly', async () => {
    const { ServerError } = await import('@snackbase/sdk');
    const error = new ServerError('API Error', 500);
    mockClient.collections.list.mockRejectedValue(error);

    const result = await handleCollectionsTool({ action: 'list' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Server error (500): API Error');
  });

  it('handles unknown action', async () => {
    const result = await handleCollectionsTool({ action: 'invalid' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
