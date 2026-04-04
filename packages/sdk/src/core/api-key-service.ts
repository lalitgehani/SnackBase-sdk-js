import { HttpClient } from './http-client';
import { ApiKey, ApiKeyCreate, ApiKeyListResponse, ApiKeyListParams } from '../types/api-key';
import { API_KEY_BASE_PATH } from './constants';

/**
 * Service for managing API keys.
 * API keys are used for service-to-service communication.
 */
export class ApiKeyService {
  constructor(private http: HttpClient) {}

  /**
   * List all API keys
   * GET /api/v1/admin/api-keys
   */
  async list(params?: ApiKeyListParams): Promise<ApiKeyListResponse> {
    const response = await this.http.get<ApiKeyListResponse>(API_KEY_BASE_PATH, { params });
    return response.data;
  }

  /**
   * Get specific API key
   * GET /api/v1/admin/api-keys/{id}
   */
  async get(keyId: string): Promise<ApiKey> {
    const response = await this.http.get<ApiKey>(`${API_KEY_BASE_PATH}/${encodeURIComponent(keyId)}`);
    return response.data;
  }

  /**
   * Create a new API key
   * POST /api/v1/admin/api-keys
   */
  async create(data: ApiKeyCreate): Promise<ApiKey> {
    const response = await this.http.post<ApiKey>(API_KEY_BASE_PATH, data);
    return response.data;
  }

  /**
   * Revoke an API key
   * DELETE /api/v1/admin/api-keys/{id}
   * Returns 204 No Content on success.
   */
  async revoke(keyId: string): Promise<void> {
    await this.http.delete(`${API_KEY_BASE_PATH}/${encodeURIComponent(keyId)}`);
  }
}
