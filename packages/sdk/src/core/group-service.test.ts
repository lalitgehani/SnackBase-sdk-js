import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from './http-client';
import { GroupsService } from './group-service';

describe('GroupsService', () => {
  let http: HttpClient;
  let groups: GroupsService;

  beforeEach(() => {
    http = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as any;
    groups = new GroupsService(http);
  });

  describe('list', () => {
    it('should list groups with params', async () => {
      const mockResult = { items: [], total: 0, page: 1, page_size: 20 };
      vi.mocked(http.get).mockResolvedValue({ data: mockResult });

      const params = { page: 1, page_size: 10, search: 'test' };
      const result = await groups.list(params);

      expect(http.get).toHaveBeenCalledWith('/api/v1/groups', { params });
      expect(result).toEqual(mockResult);
    });
  });

  describe('get', () => {
    it('should get a group by ID', async () => {
      const mockGroup = { id: 'group1', name: 'Group 1' };
      vi.mocked(http.get).mockResolvedValue({ data: mockGroup });

      const result = await groups.get('group1');

      expect(http.get).toHaveBeenCalledWith('/api/v1/groups/group1');
      expect(result).toEqual(mockGroup);
    });
  });

  describe('create', () => {
    it('should create a new group', async () => {
      const mockGroup = { id: 'group1', name: 'New Group' };
      vi.mocked(http.post).mockResolvedValue({ data: mockGroup });

      const data = { name: 'New Group', description: 'Test description' };
      const result = await groups.create(data);

      expect(http.post).toHaveBeenCalledWith('/api/v1/groups', data);
      expect(result).toEqual(mockGroup);
    });
  });

  describe('update', () => {
    it('should update a group', async () => {
      const mockGroup = { id: 'group1', name: 'Updated Group' };
      vi.mocked(http.patch).mockResolvedValue({ data: mockGroup });

      const data = { name: 'Updated Group' };
      const result = await groups.update('group1', data);

      expect(http.patch).toHaveBeenCalledWith('/api/v1/groups/group1', data);
      expect(result).toEqual(mockGroup);
    });
  });

  describe('delete', () => {
    it('should delete a group', async () => {
      vi.mocked(http.delete).mockResolvedValue({ data: {} });

      const result = await groups.delete('group1');

      expect(http.delete).toHaveBeenCalledWith('/api/v1/groups/group1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('addMember', () => {
    it('should add a member to a group', async () => {
      vi.mocked(http.post).mockResolvedValue({ data: {} });

      const result = await groups.addMember('group1', 'user1');

      expect(http.post).toHaveBeenCalledWith('/api/v1/groups/group1/members', { user_id: 'user1' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('removeMember', () => {
    it('should remove a member from a group', async () => {
      vi.mocked(http.delete).mockResolvedValue({ data: {} });

      const result = await groups.removeMember('group1', 'user1');

      expect(http.delete).toHaveBeenCalledWith('/api/v1/groups/group1/members/user1');
      expect(result).toEqual({ success: true });
    });
  });
});
