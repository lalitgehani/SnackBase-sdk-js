import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAccountsTool } from '../../src/tools/accounts.js';
import { createClient } from '../../src/client.js';

// Mock the client factory
vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_accounts tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      accounts: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        getUsers: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles list action', async () => {
    const mockAccounts = { items: [{ id: '1', name: 'Test Account' }], total: 1 };
    mockClient.accounts.list.mockResolvedValue(mockAccounts);

    const result = await handleAccountsTool({ action: 'list', page: 1, page_size: 10 });

    expect(mockClient.accounts.list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, page_size: 10 }));
    expect(result.content[0].text).toBe(JSON.stringify(mockAccounts, null, 2));
  });

  it('handles get action', async () => {
    const mockAccount = { id: 'acc-123', name: 'Test Account' };
    mockClient.accounts.get.mockResolvedValue(mockAccount);

    const result = await handleAccountsTool({ 
      action: 'get', 
      account_id: 'acc-123' 
    });

    expect(mockClient.accounts.get).toHaveBeenCalledWith('acc-123');
    expect(result.content[0].text).toBe(JSON.stringify(mockAccount, null, 2));
  });

  it('throws error when account_id is missing for get', async () => {
    const result = await handleAccountsTool({ action: 'get' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('account_id is required');
  });

  it('handles create action', async () => {
    const mockInput = {
      name: 'New Account',
      slug: 'new-account',
    };
    const mockResponse = { id: 'acc-456', ...mockInput };
    mockClient.accounts.create.mockResolvedValue(mockResponse);

    const result = await handleAccountsTool({ 
      action: 'create', 
      ...mockInput 
    });

    expect(mockClient.accounts.create).toHaveBeenCalledWith(expect.objectContaining(mockInput));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles update action', async () => {
    const mockUpdate = { name: 'Updated Account' };
    const mockResponse = { id: 'acc-123', ...mockUpdate };
    mockClient.accounts.update.mockResolvedValue(mockResponse);

    const result = await handleAccountsTool({ 
      action: 'update', 
      account_id: 'acc-123',
      ...mockUpdate
    });

    expect(mockClient.accounts.update).toHaveBeenCalledWith('acc-123', expect.objectContaining(mockUpdate));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles delete action', async () => {
    mockClient.accounts.delete.mockResolvedValue({ success: true });

    const result = await handleAccountsTool({ 
      action: 'delete', 
      account_id: 'acc-123' 
    });

    expect(mockClient.accounts.delete).toHaveBeenCalledWith('acc-123');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('handles get_users action', async () => {
    const mockUsers = { items: [{ id: 'user-1', email: 'user@example.com' }], total: 1 };
    mockClient.accounts.getUsers.mockResolvedValue(mockUsers);

    const result = await handleAccountsTool({ 
      action: 'get_users', 
      account_id: 'acc-123',
      page: 1,
      page_size: 10
    });

    expect(mockClient.accounts.getUsers).toHaveBeenCalledWith('acc-123', expect.objectContaining({ page: 1, page_size: 10 }));
    expect(result.content[0].text).toBe(JSON.stringify(mockUsers, null, 2));
  });

  it('maps SDK errors correctly', async () => {
    const { ServerError } = await import('@snackbase/sdk');
    const error = new ServerError('API Error', 500);
    mockClient.accounts.list.mockRejectedValue(error);

    const result = await handleAccountsTool({ action: 'list' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Server error (500): API Error');
  });

  it('handles unknown action', async () => {
    const result = await handleAccountsTool({ action: 'invalid' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
