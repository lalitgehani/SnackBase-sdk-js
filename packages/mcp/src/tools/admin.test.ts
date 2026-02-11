import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAdminTool } from '../../src/tools/admin.js';
import { createClient } from '../../src/client.js';

// Mock the client factory
vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_admin tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      admin: {
        getConfigurationStats: vi.fn(),
        getRecentConfigurations: vi.fn(),
        listSystemConfigurations: vi.fn(),
        listAccountConfigurations: vi.fn(),
        getConfigurationValues: vi.fn(),
        updateConfigurationValues: vi.fn(),
        createConfiguration: vi.fn(),
        listProviders: vi.fn(),
        testConnection: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles get_stats action', async () => {
    const mockStats = { system_count: 5, account_count: 10, by_category: {} };
    mockClient.admin.getConfigurationStats.mockResolvedValue(mockStats);

    const result = await handleAdminTool({ action: 'get_stats' }) as any;

    expect(mockClient.admin.getConfigurationStats).toHaveBeenCalled();
    expect(result.content[0].text).toBe(JSON.stringify(mockStats, null, 2));
  });

  it('handles get_recent action', async () => {
    const mockRecent = [{ id: '1', name: 'Test Config' }];
    mockClient.admin.getRecentConfigurations.mockResolvedValue(mockRecent);

    const result = await handleAdminTool({ action: 'get_recent', limit: 5 }) as any;

    expect(mockClient.admin.getRecentConfigurations).toHaveBeenCalledWith(5);
    expect(result.content[0].text).toBe(JSON.stringify(mockRecent, null, 2));
  });

  it('handles list_system action', async () => {
    const mockConfigs = [{ id: '1', name: 'System Config' }];
    mockClient.admin.listSystemConfigurations.mockResolvedValue(mockConfigs);

    const result = await handleAdminTool({ action: 'list_system', category: 'email' }) as any;

    expect(mockClient.admin.listSystemConfigurations).toHaveBeenCalledWith('email');
    expect(result.content[0].text).toBe(JSON.stringify(mockConfigs, null, 2));
  });

  it('handles list_account action', async () => {
    const mockConfigs = [{ id: '1', name: 'Account Config' }];
    mockClient.admin.listAccountConfigurations.mockResolvedValue(mockConfigs);

    const result = await handleAdminTool({ 
      action: 'list_account', 
      account_id: 'acc-123', 
      category: 'storage' 
    }) as any;

    expect(mockClient.admin.listAccountConfigurations).toHaveBeenCalledWith('acc-123', 'storage');
    expect(result.content[0].text).toBe(JSON.stringify(mockConfigs, null, 2));
  });

  it('throws error when account_id is missing for list_account', async () => {
    const result = await handleAdminTool({ action: 'list_account' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('account_id is required');
  });

  it('handles get_values action', async () => {
    const mockValues = { key: 'value' };
    mockClient.admin.getConfigurationValues.mockResolvedValue(mockValues);

    const result = await handleAdminTool({ action: 'get_values', config_id: 'cfg-123' }) as any;

    expect(mockClient.admin.getConfigurationValues).toHaveBeenCalledWith('cfg-123');
    expect(result.content[0].text).toBe(JSON.stringify(mockValues, null, 2));
  });

  it('handles update_values action', async () => {
    const mockValues = { key: 'new-value' };
    mockClient.admin.updateConfigurationValues.mockResolvedValue(mockValues);

    const result = await handleAdminTool({ 
      action: 'update_values', 
      config_id: 'cfg-123', 
      values: mockValues 
    }) as any;

    expect(mockClient.admin.updateConfigurationValues).toHaveBeenCalledWith('cfg-123', mockValues);
    expect(result.content[0].text).toBe(JSON.stringify(mockValues, null, 2));
  });

  it('handles create action', async () => {
    const mockInput = {
      name: 'New Config',
      category: 'email',
      provider_name: 'smtp',
      values: { host: 'localhost' },
      is_system: true,
      enabled: true
    };
    const mockResponse = { id: 'cfg-123', ...mockInput };
    mockClient.admin.createConfiguration.mockResolvedValue(mockResponse);

    const result = await handleAdminTool({ 
      action: 'create', 
      ...mockInput 
    }) as any;

    expect(mockClient.admin.createConfiguration).toHaveBeenCalledWith(mockInput);
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles list_providers action', async () => {
    const mockProviders = [{ name: 'smtp', category: 'email' }];
    mockClient.admin.listProviders.mockResolvedValue(mockProviders);

    const result = await handleAdminTool({ action: 'list_providers', category: 'email' }) as any;

    expect(mockClient.admin.listProviders).toHaveBeenCalledWith('email');
    expect(result.content[0].text).toBe(JSON.stringify(mockProviders, null, 2));
  });

  it('handles test_connection action', async () => {
    const mockResult = { success: true, message: 'Connected' };
    mockClient.admin.testConnection.mockResolvedValue(mockResult);

    const result = await handleAdminTool({ 
      action: 'test_connection', 
      category: 'email', 
      provider_name: 'smtp', 
      config: { host: 'localhost' } 
    }) as any;

    expect(mockClient.admin.testConnection).toHaveBeenCalledWith('email', 'smtp', { host: 'localhost' });
    expect(result.content[0].text).toBe(JSON.stringify(mockResult, null, 2));
  });

  it('maps SDK errors correctly', async () => {
    mockClient.admin.getConfigurationStats.mockRejectedValue(new Error('SDK Error'));

    const result = await handleAdminTool({ action: 'get_stats' }) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('SDK Error');
  });

  it('handles unknown action', async () => {
    const result = await handleAdminTool({ action: 'invalid' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
