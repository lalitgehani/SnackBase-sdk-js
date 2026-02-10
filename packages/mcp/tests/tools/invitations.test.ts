import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleInvitationsTool } from '../../src/tools/invitations.js';
import { createClient } from '../../src/client.js';

// Mock the client factory
vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_invitations tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      invitations: {
        list: vi.fn(),
        create: vi.fn(),
        resend: vi.fn(),
        cancel: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles list action', async () => {
    const mockInvitations = [{ id: '1', email: 'test@example.com', status: 'pending' }];
    mockClient.invitations.list.mockResolvedValue(mockInvitations);

    const result = await handleInvitationsTool({ action: 'list', status: 'pending', page: 1, page_size: 10 }) as any;

    expect(mockClient.invitations.list).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending', page: 1, page_size: 10 }));
    expect(result.content[0].text).toBe(JSON.stringify(mockInvitations, null, 2));
  });

  it('handles create action', async () => {
    const mockInput = {
      email: 'new@example.com',
      role_id: 'role-123',
    };
    const mockResponse = { id: 'inv-123', status: 'pending', ...mockInput };
    mockClient.invitations.create.mockResolvedValue(mockResponse);

    const result = await handleInvitationsTool({ 
      action: 'create', 
      ...mockInput 
    }) as any;

    expect(mockClient.invitations.create).toHaveBeenCalledWith(expect.objectContaining(mockInput));
    expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
  });

  it('throws error when email is missing for create', async () => {
    const result = await handleInvitationsTool({ action: 'create' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('email is required');
  });

  it('handles resend action', async () => {
    mockClient.invitations.resend.mockResolvedValue({ success: true });

    const result = await handleInvitationsTool({ 
      action: 'resend', 
      invitation_id: 'inv-123' 
    }) as any;

    expect(mockClient.invitations.resend).toHaveBeenCalledWith('inv-123');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('throws error when invitation_id is missing for resend', async () => {
    const result = await handleInvitationsTool({ action: 'resend' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('invitation_id is required');
  });

  it('handles cancel action', async () => {
    mockClient.invitations.cancel.mockResolvedValue({ success: true });

    const result = await handleInvitationsTool({ 
      action: 'cancel', 
      invitation_id: 'inv-123' 
    }) as any;

    expect(mockClient.invitations.cancel).toHaveBeenCalledWith('inv-123');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('throws error when invitation_id is missing for cancel', async () => {
    const result = await handleInvitationsTool({ action: 'cancel' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('invitation_id is required');
  });

  it('maps SDK errors correctly', async () => {
    mockClient.invitations.list.mockRejectedValue(new Error('SDK Error'));

    const result = await handleInvitationsTool({ action: 'list' }) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('SDK Error');
  });

  it('handles unknown action', async () => {
    const result = await handleInvitationsTool({ action: 'invalid' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
