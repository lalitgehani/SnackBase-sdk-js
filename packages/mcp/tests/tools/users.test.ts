import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleUsersTool } from '../../src/tools/users.js';
import { createClient } from '../../src/client.js';

// Mock the client factory
vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_users tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      users: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        setPassword: vi.fn(),
        verifyEmail: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles list action', async () => {
    const mockUsers = { items: [{ id: '1', email: 'test@example.com' }], total: 1 };
    mockClient.users.list.mockResolvedValue(mockUsers);

    const result = await handleUsersTool({ action: 'list', page: 1, page_size: 10 });

    expect(mockClient.users.list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, page_size: 10 }));
    expect(result.content[0].text).toBe(JSON.stringify(mockUsers, null, 2));
  });

  it('handles get action', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockClient.users.get.mockResolvedValue(mockUser);

    const result = await handleUsersTool({ 
      action: 'get', 
      user_id: 'user-123' 
    });

    expect(mockClient.users.get).toHaveBeenCalledWith('user-123');
    expect(result.content[0].text).toBe(JSON.stringify(mockUser, null, 2));
  });

  it('throws error when user_id is missing for get', async () => {
    const result = await handleUsersTool({ action: 'get' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('user_id is required');
  });

  it('handles create action', async () => {
    const mockInput = {
      email: 'new@example.com',
      account_id: 'acc-123',
      password: 'password123',
    };
    const mockResponse = { id: 'user-456', ...mockInput };
    mockClient.users.create.mockResolvedValue(mockResponse);

    const result = await handleUsersTool({ 
      action: 'create', 
      ...mockInput 
    });

    expect(mockClient.users.create).toHaveBeenCalledWith(expect.objectContaining(mockInput));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles update action', async () => {
    const mockUpdate = { email: 'updated@example.com', is_active: false };
    const mockResponse = { id: 'user-123', ...mockUpdate };
    mockClient.users.update.mockResolvedValue(mockResponse);

    const result = await handleUsersTool({ 
      action: 'update', 
      user_id: 'user-123',
      ...mockUpdate
    });

    expect(mockClient.users.update).toHaveBeenCalledWith('user-123', expect.objectContaining(mockUpdate));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles delete action', async () => {
    mockClient.users.delete.mockResolvedValue({ success: true });

    const result = await handleUsersTool({ 
      action: 'delete', 
      user_id: 'user-123' 
    });

    expect(mockClient.users.delete).toHaveBeenCalledWith('user-123');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('handles set_password action', async () => {
    mockClient.users.setPassword.mockResolvedValue({ success: true });

    const result = await handleUsersTool({ 
      action: 'set_password', 
      user_id: 'user-123',
      password: 'newpassword'
    });

    expect(mockClient.users.setPassword).toHaveBeenCalledWith('user-123', 'newpassword');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('handles verify_email action', async () => {
    mockClient.users.verifyEmail.mockResolvedValue({ success: true });

    const result = await handleUsersTool({ 
      action: 'verify_email', 
      user_id: 'user-123' 
    });

    expect(mockClient.users.verifyEmail).toHaveBeenCalledWith('user-123');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('maps SDK errors correctly', async () => {
    const { ServerError } = await import('@snackbase/sdk');
    const error = new ServerError('API Error', 500);
    mockClient.users.list.mockRejectedValue(error);

    const result = await handleUsersTool({ action: 'list' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Server error (500): API Error');
  });

  it('handles unknown action', async () => {
    const result = await handleUsersTool({ action: 'invalid' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
