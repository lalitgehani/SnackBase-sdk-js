import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleGroupsTool } from '../../src/tools/groups.js';
import { createClient } from '../../src/client.js';

// Mock the client factory
vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_groups tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      groups: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        addMember: vi.fn(),
        removeMember: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles list action', async () => {
    const mockGroups = { items: [{ id: '1', name: 'Admins' }], total: 1 };
    mockClient.groups.list.mockResolvedValue(mockGroups);

    const result = await handleGroupsTool({ action: 'list', page: 1, page_size: 10 });

    expect(mockClient.groups.list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, page_size: 10 }));
    expect(result.content[0].text).toBe(JSON.stringify(mockGroups, null, 2));
  });

  it('handles get action', async () => {
    const mockGroup = { id: 'group-123', name: 'Admins' };
    mockClient.groups.get.mockResolvedValue(mockGroup);

    const result = await handleGroupsTool({ 
      action: 'get', 
      group_id: 'group-123' 
    });

    expect(mockClient.groups.get).toHaveBeenCalledWith('group-123');
    expect(result.content[0].text).toBe(JSON.stringify(mockGroup, null, 2));
  });

  it('throws error when group_id is missing for get', async () => {
    const result = await handleGroupsTool({ action: 'get' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('group_id is required');
  });

  it('handles create action', async () => {
    const mockInput = {
      name: 'New Group',
      description: 'A test group',
    };
    const mockResponse = { id: 'group-456', ...mockInput };
    mockClient.groups.create.mockResolvedValue(mockResponse);

    const result = await handleGroupsTool({ 
      action: 'create', 
      ...mockInput 
    });

    expect(mockClient.groups.create).toHaveBeenCalledWith(expect.objectContaining(mockInput));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles update action', async () => {
    const mockUpdate = { name: 'Updated Group' };
    const mockResponse = { id: 'group-123', ...mockUpdate };
    mockClient.groups.update.mockResolvedValue(mockResponse);

    const result = await handleGroupsTool({ 
      action: 'update', 
      group_id: 'group-123',
      ...mockUpdate
    });

    expect(mockClient.groups.update).toHaveBeenCalledWith('group-123', expect.objectContaining(mockUpdate));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('handles delete action', async () => {
    mockClient.groups.delete.mockResolvedValue({ success: true });

    const result = await handleGroupsTool({ 
      action: 'delete', 
      group_id: 'group-123' 
    });

    expect(mockClient.groups.delete).toHaveBeenCalledWith('group-123');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('handles add_member action', async () => {
    mockClient.groups.addMember.mockResolvedValue({ success: true });

    const result = await handleGroupsTool({ 
      action: 'add_member', 
      group_id: 'group-123',
      user_id: 'user-456'
    });

    expect(mockClient.groups.addMember).toHaveBeenCalledWith('group-123', 'user-456');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('handles remove_member action', async () => {
    mockClient.groups.removeMember.mockResolvedValue({ success: true });

    const result = await handleGroupsTool({ 
      action: 'remove_member', 
      group_id: 'group-123',
      user_id: 'user-456' 
    });

    expect(mockClient.groups.removeMember).toHaveBeenCalledWith('group-123', 'user-456');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('maps SDK errors correctly', async () => {
    const { ServerError } = await import('@snackbase/sdk');
    const error = new ServerError('API Error', 500);
    mockClient.groups.list.mockRejectedValue(error);

    const result = await handleGroupsTool({ action: 'list' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Server error (500): API Error');
  });

  it('handles unknown action', async () => {
    const result = await handleGroupsTool({ action: 'invalid' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
