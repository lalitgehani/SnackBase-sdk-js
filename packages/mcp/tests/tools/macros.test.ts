import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleMacrosTool } from '../../src/tools/macros.js';
import { createClient } from '../../src/client.js';

// Mock the client factory
vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_macros tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      macros: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        test: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles list action', async () => {
    const mockMacros = [{ id: '1', name: 'macro1' }];
    mockClient.macros.list.mockResolvedValue(mockMacros);

    const result = await handleMacrosTool({ action: 'list' }) as any;

    expect(mockClient.macros.list).toHaveBeenCalled();
    expect(result.content[0].text).toBe(JSON.stringify(mockMacros, null, 2));
  });

  it('handles get action', async () => {
    const mockMacro = { id: 'm-123', name: 'macro1' };
    mockClient.macros.get.mockResolvedValue(mockMacro);

    const result = await handleMacrosTool({ 
      action: 'get', 
      macro_id: 'm-123' 
    }) as any;

    expect(mockClient.macros.get).toHaveBeenCalledWith('m-123');
    expect(result.content[0].text).toBe(JSON.stringify(mockMacro, null, 2));
  });

  it('throws error when macro_id is missing for get', async () => {
    const result = await handleMacrosTool({ action: 'get' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('macro_id is required');
  });

  it('handles create action', async () => {
    const mockInput = {
      name: 'is_owner',
      description: 'Check if user owns record',
      sql_query: 'SELECT owner_id = @user_id',
      parameters: ['user_id']
    };
    const mockResponse = { id: 'm-456', ...mockInput };
    mockClient.macros.create.mockResolvedValue(mockResponse);

    const result = await handleMacrosTool({ 
      action: 'create', 
      ...mockInput 
    }) as any;

    expect(mockClient.macros.create).toHaveBeenCalledWith(mockInput);
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles update action', async () => {
    const mockUpdate = { name: 'updated_macro' };
    const mockResponse = { id: 'm-123', ...mockUpdate };
    mockClient.macros.update.mockResolvedValue(mockResponse);

    const result = await handleMacrosTool({ 
      action: 'update', 
      macro_id: 'm-123',
      ...mockUpdate
    }) as any;

    expect(mockClient.macros.update).toHaveBeenCalledWith('m-123', mockUpdate);
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles delete action', async () => {
    mockClient.macros.delete.mockResolvedValue({ success: true });

    const result = await handleMacrosTool({ 
      action: 'delete', 
      macro_id: 'm-123' 
    }) as any;

    expect(mockClient.macros.delete).toHaveBeenCalledWith('m-123');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('handles test action', async () => {
    const mockResult = { success: true, result: true };
    mockClient.macros.test.mockResolvedValue(mockResult);

    const result = await handleMacrosTool({ 
      action: 'test', 
      macro_id: 'm-123',
      params: { user_id: 'u-123' }
    }) as any;

    expect(mockClient.macros.test).toHaveBeenCalledWith('m-123', { user_id: 'u-123' });
    expect(result.content[0].text).toBe(JSON.stringify(mockResult, null, 2));
  });

  it('maps SDK errors correctly', async () => {
    mockClient.macros.list.mockRejectedValue(new Error('SDK Error'));

    const result = await handleMacrosTool({ action: 'list' }) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('SDK Error');
  });

  it('handles unknown action', async () => {
    const result = await handleMacrosTool({ action: 'invalid' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
