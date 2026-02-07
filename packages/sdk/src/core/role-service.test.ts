import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleService } from './role-service';
import { HttpClient } from './http-client';
import { RoleCreate, RoleUpdate } from '../types/role';

describe('RoleService', () => {
  let roleService: RoleService;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };
    roleService = new RoleService(mockHttpClient as unknown as HttpClient);
  });

  describe('list', () => {
    it('should call GET /api/v1/roles', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await roleService.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/roles');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('get', () => {
    it('should call GET /api/v1/roles/:id', async () => {
      const mockRole = { id: 'role-1', name: 'Admin' };
      mockHttpClient.get.mockResolvedValue({ data: mockRole });

      const result = await roleService.get('role-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/roles/role-1');
      expect(result).toEqual(mockRole);
    });
  });

  describe('create', () => {
    it('should call POST /api/v1/roles with role data', async () => {
      const roleData: RoleCreate = { name: 'Admin', description: 'System Admin' };
      const mockResponse = { data: { id: 'role-1', ...roleData } };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await roleService.create(roleData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/roles', roleData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('update', () => {
    it('should call PATCH /api/v1/roles/:id with update data', async () => {
      const updateData: RoleUpdate = { name: 'Super Admin' };
      const mockResponse = { data: { id: 'role-1', ...updateData } };
      mockHttpClient.patch.mockResolvedValue(mockResponse);

      const result = await roleService.update('role-1', updateData);

      expect(mockHttpClient.patch).toHaveBeenCalledWith('/api/v1/roles/role-1', updateData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/v1/roles/:id', async () => {
      mockHttpClient.delete.mockResolvedValue({});

      const result = await roleService.delete('role-1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/roles/role-1');
      expect(result).toEqual({ success: true });
    });
  });
});
