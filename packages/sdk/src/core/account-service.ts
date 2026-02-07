import { HttpClient } from './http-client';
import { 
  Account, 
  AccountCreate, 
  AccountUpdate, 
  AccountListParams, 
  AccountListResponse, 
  AccountUserListParams 
} from '../types/account';
import { UserListResponse } from '../types/auth';

/**
 * Service for managing accounts and their users.
 * Requires superadmin authentication.
 */
export class AccountService {
  constructor(private http: HttpClient) {}

  /**
   * List all accounts with pagination, filtering, and sorting.
   */
  async list(params?: AccountListParams): Promise<AccountListResponse> {
    const response = await this.http.get<AccountListResponse>('/api/v1/accounts', {
      params,
    });
    return response.data;
  }

  /**
   * Get details for a specific account.
   */
  async get(accountId: string): Promise<Account> {
    const response = await this.http.get<Account>(`/api/v1/accounts/${accountId}`);
    return response.data;
  }

  /**
   * Create a new account.
   */
  async create(data: AccountCreate): Promise<Account> {
    const response = await this.http.post<Account>('/api/v1/accounts', data);
    return response.data;
  }

  /**
   * Update an existing account.
   */
  async update(accountId: string, data: AccountUpdate): Promise<Account> {
    const response = await this.http.patch<Account>(`/api/v1/accounts/${accountId}`, data);
    return response.data;
  }

  /**
   * Delete an account and all its associated data.
   */
  async delete(accountId: string): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/accounts/${accountId}`);
    return { success: true };
  }

  /**
   * Get all users belonging to a specific account.
   */
  async getUsers(accountId: string, params?: AccountUserListParams): Promise<UserListResponse> {
    const response = await this.http.get<UserListResponse>(`/api/v1/accounts/${accountId}/users`, {
      params,
    });
    return response.data;
  }
}
