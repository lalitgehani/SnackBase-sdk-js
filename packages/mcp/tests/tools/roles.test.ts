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
        getPermissions: vi.fn(),
        getPermissionsMatrix: vi.fn(),
        validateRule: vi.fn(),
        testRule: vi.fn(),
        updatePermissionsBulk: vi.fn(),
        deletePermission: vi.fn(),
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

  it('handles get_permissions action', async () => {
    const permissions = [{ id: 1, collection: 'posts', can_read: true }];
    mockClient.roles.getPermissions.mockResolvedValue(permissions);

    const result = await handleRolesTool({
      action: 'get_permissions',
      role_id: 'role-123',
    });

    expect(mockClient.roles.getPermissions).toHaveBeenCalledWith('role-123');
    expect(result.content[0].text).toBe(JSON.stringify(permissions, null, 2));
  });

  it('errors when role_id is missing for get_permissions', async () => {
    const result = await handleRolesTool({ action: 'get_permissions' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('role_id is required');
  });

  it('handles get_permissions_matrix action', async () => {
    const matrix = { posts: { read: true, write: false } };
    mockClient.roles.getPermissionsMatrix.mockResolvedValue(matrix);

    const result = await handleRolesTool({
      action: 'get_permissions_matrix',
      role_id: 'role-123',
    });

    expect(mockClient.roles.getPermissionsMatrix).toHaveBeenCalledWith('role-123');
    expect(result.content[0].text).toBe(JSON.stringify(matrix, null, 2));
  });

  it('handles validate_rule action', async () => {
    const validation = { valid: true, error: null };
    mockClient.roles.validateRule.mockResolvedValue(validation);

    const result = await handleRolesTool({
      action: 'validate_rule',
      rule: '@has_role("admin")',
    });

    expect(mockClient.roles.validateRule).toHaveBeenCalledWith('@has_role("admin")');
    expect(result.content[0].text).toBe(JSON.stringify(validation, null, 2));
  });

  it('errors when rule is missing for validate_rule', async () => {
    const result = await handleRolesTool({ action: 'validate_rule' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('rule is required');
  });

  it('handles test_rule action and defaults context to an empty object', async () => {
    const outcome = { allowed: true, error: null, evaluation_details: null };
    mockClient.roles.testRule.mockResolvedValue(outcome);

    const result = await handleRolesTool({
      action: 'test_rule',
      rule: '@owns_record()',
    });

    expect(mockClient.roles.testRule).toHaveBeenCalledWith('@owns_record()', {});
    expect(result.content[0].text).toBe(JSON.stringify(outcome, null, 2));
  });

  it('passes the supplied context through for test_rule', async () => {
    mockClient.roles.testRule.mockResolvedValue({ allowed: false });
    const context = { user: { id: 'user-1' } };

    await handleRolesTool({ action: 'test_rule', rule: '@owns_record()', context });

    expect(mockClient.roles.testRule).toHaveBeenCalledWith('@owns_record()', context);
  });

  it('handles update_permissions_bulk action', async () => {
    const bulk = { success_count: 2, failure_count: 0, errors: [] };
    mockClient.roles.updatePermissionsBulk.mockResolvedValue(bulk);
    const updates = [{ collection: 'posts', can_read: true }];

    const result = await handleRolesTool({
      action: 'update_permissions_bulk',
      role_id: 'role-123',
      updates,
    });

    expect(mockClient.roles.updatePermissionsBulk).toHaveBeenCalledWith('role-123', {
      updates,
    });
    expect(result.content[0].text).toBe(JSON.stringify(bulk, null, 2));
  });

  it('errors when updates is not an array for update_permissions_bulk', async () => {
    const result = await handleRolesTool({
      action: 'update_permissions_bulk',
      role_id: 'role-123',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('updates must be an array');
  });

  it('handles delete_permission action', async () => {
    mockClient.roles.deletePermission.mockResolvedValue({ success: true });

    const result = await handleRolesTool({
      action: 'delete_permission',
      permission_id: 42,
    });

    expect(mockClient.roles.deletePermission).toHaveBeenCalledWith(42);
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('accepts permission_id 0 for delete_permission', async () => {
    mockClient.roles.deletePermission.mockResolvedValue({ success: true });

    const result = await handleRolesTool({ action: 'delete_permission', permission_id: 0 });

    expect(result.isError).toBeUndefined();
    expect(mockClient.roles.deletePermission).toHaveBeenCalledWith(0);
  });

  it('errors when permission_id is missing for delete_permission', async () => {
    const result = await handleRolesTool({ action: 'delete_permission' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('permission_id is required');
  });
});
