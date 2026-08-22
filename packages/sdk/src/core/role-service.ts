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
    const response = await this.http.put<Role>(`/api/v1/roles/${roleId}`, data);
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

  /** Get permissions for a role. */
  async getPermissions(roleId: string): Promise<unknown> {
    const response = await this.http.get(`/api/v1/roles/${roleId}/permissions`);
    return response.data;
  }

  /** Get permissions matrix for a role. */
  async getPermissionsMatrix(roleId: string): Promise<unknown> {
    const response = await this.http.get(`/api/v1/roles/${roleId}/permissions/matrix`);
    return response.data;
  }

  /** Validate a permission rule expression. */
  async validateRule(rule: string): Promise<{ valid: boolean; error: string | null }> {
    const response = await this.http.post<{ valid: boolean; error: string | null }>(
      '/api/v1/roles/validate-rule',
      { rule },
    );
    return response.data;
  }

  /** Test a permission rule with sample context. */
  async testRule(
    rule: string,
    context: Record<string, unknown>,
  ): Promise<{ allowed: boolean; error: string | null; evaluation_details: string | null }> {
    const response = await this.http.post<{
      allowed: boolean;
      error: string | null;
      evaluation_details: string | null;
    }>('/api/v1/roles/test-rule', { rule, context });
    return response.data;
  }

  /** Bulk update permissions for a role. */
  async updatePermissionsBulk(
    roleId: string,
    request: { updates: unknown[] },
  ): Promise<{ success_count: number; failure_count: number; errors: string[] }> {
    const response = await this.http.put<{
      success_count: number;
      failure_count: number;
      errors: string[];
    }>(`/api/v1/roles/${roleId}/permissions/bulk`, request);
    return response.data;
  }

  /** Delete a permission by ID. */
  async deletePermission(permissionId: number): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/permissions/${permissionId}`);
    return { success: true };
  }
}
