import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvitationService } from './invitation-service';
import { HttpClient } from './http-client';
import { InvitationCreate, InvitationListParams } from '../types/invitation';

describe('InvitationService', () => {
  let invitationService: InvitationService;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };
    invitationService = new InvitationService(mockHttpClient as unknown as HttpClient);
  });

  describe('list', () => {
    it('should call GET /api/v1/invitations with correct parameters', async () => {
      const mockInvitations = [
        { id: 'inv-1', email: 'user@example.com', status: 'pending' }
      ];
      mockHttpClient.get.mockResolvedValue({ data: mockInvitations });

      const params: InvitationListParams = { status: 'pending', page: 1 };
      const result = await invitationService.list(params);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/invitations', { params });
      expect(result).toEqual(mockInvitations);
    });
  });

  describe('create', () => {
    it('should call POST /api/v1/invitations with invitation data', async () => {
      const invitationData: InvitationCreate = { 
        email: 'new@example.com',
        role_id: 'role-1'
      };
      const mockResponse = { data: { id: 'inv-1', ...invitationData, status: 'pending' } };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await invitationService.create(invitationData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/invitations', invitationData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('resend', () => {
    it('should call POST /api/v1/invitations/:id/resend', async () => {
      mockHttpClient.post.mockResolvedValue({});

      const result = await invitationService.resend('inv-1');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/invitations/inv-1/resend', {});
      expect(result).toEqual({ success: true });
    });
  });

  describe('getPublic', () => {
    it('should call GET /api/v1/invitations/:token', async () => {
      const mockInvitation = { id: 'inv-1', email: 'user@example.com', status: 'pending' };
      mockHttpClient.get.mockResolvedValue({ data: mockInvitation });

      const result = await invitationService.getPublic('test-token');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/invitations/test-token');
      expect(result).toEqual(mockInvitation);
    });
  });

  describe('accept', () => {
    it('should call POST /api/v1/invitations/:token/accept with password', async () => {
      const mockAuthResponse = {
        user: { id: 'user-1', email: 'user@example.com' },
        token: 'jwt-token'
      };
      mockHttpClient.post.mockResolvedValue({ data: mockAuthResponse });

      const result = await invitationService.accept('test-token', 'new-password');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/invitations/test-token/accept', {
        password: 'new-password'
      });
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('cancel', () => {
    it('should call DELETE /api/v1/invitations/:id', async () => {
      mockHttpClient.delete.mockResolvedValue({});

      const result = await invitationService.cancel('inv-1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/invitations/inv-1');
      expect(result).toEqual({ success: true });
    });
  });
});
