import { HttpClient } from './http-client';
import { ApiKey, ApiKeyCreate, ApiKeyListResponse, ApiKeyListParams } from '../types/api-key';
import { API_KEY_BASE_PATH } from './constants';
import { formatMaskedKey } from '../utils/token-utils';

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
    
    // Handle new token format in response
    const apiKey = response.data;
    if (apiKey.key && !apiKey.masked_key) {
      // Store full key - only shown once
      // And format masked key for display if not provided by backend
      apiKey.masked_key = formatMaskedKey(apiKey.key);
    }
    
    return apiKey;
  }

  /**
   * Revoke an API key
   * DELETE /api/v1/admin/api-keys/{id}
   */
  async revoke(keyId: string): Promise<{ success: boolean }> {
    const response = await this.http.delete<{ success: boolean }>(
      `${API_KEY_BASE_PATH}/${encodeURIComponent(keyId)}`
    );
    return response.data;
  }
}
