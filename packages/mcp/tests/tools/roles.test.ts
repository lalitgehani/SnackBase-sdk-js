import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleRolesTool } from '../../src/tools/roles.js';
import { createClient } from '../../src/client.js';

// Mock the client factory
vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_roles tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      roles: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles list action', async () => {
    const mockRoles = { items: [{ id: '1', name: 'Admin' }], total: 1 };
    mockClient.roles.list.mockResolvedValue(mockRoles);

    const result = await handleRolesTool({ action: 'list' });

    expect(mockClient.roles.list).toHaveBeenCalled();
    expect(result.content[0].text).toBe(JSON.stringify(mockRoles, null, 2));
  });

  it('handles get action', async () => {
    const mockRole = { id: 'role-123', name: 'Admin' };
    mockClient.roles.get.mockResolvedValue(mockRole);

    const result = await handleRolesTool({ 
      action: 'get', 
      role_id: 'role-123' 
    });

    expect(mockClient.roles.get).toHaveBeenCalledWith('role-123');
    expect(result.content[0].text).toBe(JSON.stringify(mockRole, null, 2));
  });

  it('throws error when role_id is missing for get', async () => {
    const result = await handleRolesTool({ action: 'get' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('role_id is required');
  });

  it('handles create action', async () => {
    const mockInput = {
      name: 'New Role',
      description: 'A test role',
    };
    const mockResponse = { id: 'role-456', ...mockInput };
    mockClient.roles.create.mockResolvedValue(mockResponse);

    const result = await handleRolesTool({ 
      action: 'create', 
      ...mockInput 
    });

    expect(mockClient.roles.create).toHaveBeenCalledWith(expect.objectContaining(mockInput));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles update action', async () => {
    const mockUpdate = { name: 'Updated Role' };
    const mockResponse = { id: 'role-123', ...mockUpdate };
    mockClient.roles.update.mockResolvedValue(mockResponse);

    const result = await handleRolesTool({ 
      action: 'update', 
      role_id: 'role-123',
      ...mockUpdate
    });

    expect(mockClient.roles.update).toHaveBeenCalledWith('role-123', expect.objectContaining(mockUpdate));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles delete action', async () => {
    mockClient.roles.delete.mockResolvedValue({ success: true });

    const result = await handleRolesTool({ 
      action: 'delete', 
      role_id: 'role-123' 
    });

    expect(mockClient.roles.delete).toHaveBeenCalledWith('role-123');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('maps SDK errors correctly', async () => {
    const { ServerError } = await import('@snackbase/sdk');
    const error = new ServerError('API Error', 500);
    mockClient.roles.list.mockRejectedValue(error);

    const result = await handleRolesTool({ action: 'list' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Server error (500): API Error');
  });

  it('handles unknown action', async () => {
    const result = await handleRolesTool({ action: 'invalid' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
