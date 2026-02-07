import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './user-service';
import { HttpClient } from './http-client';
import { User, UserCreate, UserUpdate } from '../types/user';

describe('UserService', () => {
  let userService: UserService;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };
    userService = new UserService(mockHttpClient as unknown as HttpClient);
  });

  describe('list', () => {
    it('should call GET /api/v1/users with correct parameters', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const params = { page: 1, search: 'test' };
      const result = await userService.list(params);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/users', { params });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('get', () => {
    it('should call GET /api/v1/users/:id', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      mockHttpClient.get.mockResolvedValue({ data: mockUser });

      const result = await userService.get('user-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/users/user-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should call POST /api/v1/users with user data', async () => {
      const userData: UserCreate = { 
        email: 'new@example.com', 
        account_id: 'acc-1' 
      };
      const mockResponse = { data: { id: 'new-user', ...userData } };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await userService.create(userData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/users', userData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('update', () => {
    it('should call PATCH /api/v1/users/:id with update data', async () => {
      const updateData: UserUpdate = { is_active: false };
      const mockResponse = { data: { id: 'user-1', ...updateData } };
      mockHttpClient.patch.mockResolvedValue(mockResponse);

      const result = await userService.update('user-1', updateData);

      expect(mockHttpClient.patch).toHaveBeenCalledWith('/api/v1/users/user-1', updateData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/v1/users/:id', async () => {
      mockHttpClient.delete.mockResolvedValue({});

      const result = await userService.delete('user-1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/users/user-1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('setPassword', () => {
    it('should call POST /api/v1/users/:id/password', async () => {
      mockHttpClient.post.mockResolvedValue({});

      const result = await userService.setPassword('user-1', 'new-password');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/users/user-1/password', { 
        password: 'new-password' 
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('verifyEmail', () => {
    it('should call POST /api/v1/users/:id/verify', async () => {
      mockHttpClient.post.mockResolvedValue({});

      const result = await userService.verifyEmail('user-1');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/users/user-1/verify', {});
      expect(result).toEqual({ success: true });
    });
  });

  describe('resendVerification', () => {
    it('should call POST /api/v1/users/:id/resend-verification', async () => {
      mockHttpClient.post.mockResolvedValue({});

      const result = await userService.resendVerification('user-1');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/users/user-1/resend-verification', {});
      expect(result).toEqual({ success: true });
    });
  });
});
