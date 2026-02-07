import { HttpClient } from './http-client';
import {
  Role,
  RoleCreate,
  RoleUpdate,
  RoleListResponse,
} from '../types/role';

/**
 * Service for managing roles.
 * Requires superadmin authentication.
 */
export class RoleService {
  constructor(private http: HttpClient) {}

  /**
   * List all roles with pagination.
   */
  async list(): Promise<RoleListResponse> {
    const response = await this.http.get<RoleListResponse>('/api/v1/roles');
    return response.data;
  }

  /**
   * Get details for a specific role.
   */
  async get(roleId: string): Promise<Role> {
    const response = await this.http.get<Role>(`/api/v1/roles/${roleId}`);
    return response.data;
  }

  /**
   * Create a new role.
   */
  async create(data: RoleCreate): Promise<Role> {
    const response = await this.http.post<Role>('/api/v1/roles', data);
    return response.data;
  }

  /**
   * Update an existing role.
   */
  async update(roleId: string, data: RoleUpdate): Promise<Role> {
    const response = await this.http.patch<Role>(`/api/v1/roles/${roleId}`, data);
    return response.data;
  }

  /**
   * Delete a role.
   * Fails if the role is currently in use.
   */
  async delete(roleId: string): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/roles/${roleId}`);
    return { success: true };
  }
}
