import { HttpClient } from './http-client';
import { ApiKey, ApiKeyCreate } from '../types/api-key';

/**
 * Service for managing API keys.
 * API keys are used for service-to-service communication.
 */
export class ApiKeyService {
  constructor(private http: HttpClient) {}

  /**
   * List all API keys for the current user.
   * Keys are masked except for the last 4 characters.
   */
  async list(): Promise<ApiKey[]> {
    const response = await this.http.get<ApiKey[]>('/api/v1/admin/api-keys');
    return response.data;
  }

  /**
   * Get details for a specific API key.
   * The key itself is masked.
   */
  async get(keyId: string): Promise<ApiKey> {
    const response = await this.http.get<ApiKey>(`/api/v1/admin/api-keys/${keyId}`);
    return response.data;
  }

  /**
   * Create a new API key.
   * The response includes the full key, which is shown only once.
   */
  async create(data: ApiKeyCreate): Promise<ApiKey> {
    const response = await this.http.post<ApiKey>('/api/v1/admin/api-keys', data);
    return response.data;
  }

  /**
   * Revoke an existing API key.
   * Once revoked, the key can no longer be used.
   */
  async revoke(keyId: string): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/admin/api-keys/${keyId}`);
    return { success: true };
  }
}
