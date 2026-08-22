import { HttpClient } from './http-client';
import { 
  User, 
  UserCreate, 
  UserUpdate, 
  UserListParams, 
  UserListResponse 
} from '../types/user';

/**
 * Service for managing users.
 * Requires superadmin authentication for most operations.
 */
export class UserService {
  constructor(private http: HttpClient) {}

  /**
   * List all users with pagination, filtering, and sorting.
   */
  async list(params?: UserListParams): Promise<UserListResponse> {
    const response = await this.http.get<UserListResponse>('/api/v1/users', {
      params,
    });
    return response.data;
  }

  /**
   * Get details for a specific user.
   */
  async get(userId: string): Promise<User> {
    const response = await this.http.get<User>(`/api/v1/users/${userId}`);
    return response.data;
  }

  /**
   * Create a new user in a specific account.
   */
  async create(data: UserCreate): Promise<User> {
    const response = await this.http.post<User>('/api/v1/users', data);
    return response.data;
  }

  /**
   * Update an existing user.
   */
  async update(userId: string, data: UserUpdate): Promise<User> {
    const response = await this.http.patch<User>(`/api/v1/users/${userId}`, data);
    return response.data;
  }

  /**
   * Soft delete (deactivate) a user.
   */
  async delete(userId: string): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/users/${userId}`);
    return { success: true };
  }

  /**
   * Manually set a new password for a user.
   */
  async setPassword(userId: string, password: string): Promise<{ success: boolean }> {
    await this.http.put(`/api/v1/users/${userId}/password`, { new_password: password });
    return { success: true };
  }

  /**
   * Reset password — direct set or send reset link.
   */
  async resetPassword(
    userId: string,
    data: { new_password?: string; send_reset_link?: boolean },
  ): Promise<{ message: string }> {
    const response = await this.http.put<{ message: string }>(
      `/api/v1/users/${userId}/password`,
      data,
    );
    return response.data;
  }

  /**
   * Manually verify a user's email address.
   */
  async verifyEmail(userId: string): Promise<{ message: string }> {
    const response = await this.http.post<{ message: string }>(`/api/v1/users/${userId}/verify`, {});
    return response.data;
  }

  /**
   * Resend the verification email to a user.
   */
  async resendVerification(userId: string): Promise<{ message: string }> {
    const response = await this.http.post<{ message: string }>(
      `/api/v1/users/${userId}/resend-verification`,
      {},
    );
    return response.data;
  }
}
