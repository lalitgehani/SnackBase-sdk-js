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
    await this.http.post(`/api/v1/users/${userId}/password`, { password });
    return { success: true };
  }

  /**
   * Manually verify a user's email address.
   */
  async verifyEmail(userId: string): Promise<{ success: boolean }> {
    await this.http.post(`/api/v1/users/${userId}/verify`, {});
    return { success: true };
  }

  /**
   * Resend the verification email to a user.
   */
  async resendVerification(userId: string): Promise<{ success: boolean }> {
    await this.http.post(`/api/v1/users/${userId}/resend-verification`, {});
    return { success: true };
  }
}
