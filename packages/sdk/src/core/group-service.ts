import { HttpClient } from './http-client';
import { 
  Group, 
  GroupCreate, 
  GroupUpdate, 
  GroupListParams, 
  GroupListResponse 
} from '../types/group';

/**
 * Service for managing groups.
 */
export class GroupsService {
  constructor(private http: HttpClient) {}

  /**
   * List all groups in the current account.
   */
  async list(params?: GroupListParams): Promise<GroupListResponse> {
    const response = await this.http.get<GroupListResponse>('/api/v1/groups', {
      params,
    });
    return response.data;
  }

  /**
   * Get details for a specific group.
   */
  async get(groupId: string): Promise<Group> {
    const response = await this.http.get<Group>(`/api/v1/groups/${groupId}`);
    return response.data;
  }

  /**
   * Create a new group in the current account.
   */
  async create(data: GroupCreate): Promise<Group> {
    const response = await this.http.post<Group>('/api/v1/groups', data);
    return response.data;
  }

  /**
   * Update a group's name or description.
   */
  async update(groupId: string, data: GroupUpdate): Promise<Group> {
    const response = await this.http.patch<Group>(`/api/v1/groups/${groupId}`, data);
    return response.data;
  }

  /**
   * Delete a group.
   */
  async delete(groupId: string): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/groups/${groupId}`);
    return { success: true };
  }

  /**
   * Add a user to a group.
   */
  async addMember(groupId: string, userId: string): Promise<{ success: boolean }> {
    await this.http.post(`/api/v1/groups/${groupId}/members`, { user_id: userId });
    return { success: true };
  }

  /**
   * Remove a user from a group.
   */
  async removeMember(groupId: string, userId: string): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/groups/${groupId}/members/${userId}`);
    return { success: true };
  }
}
