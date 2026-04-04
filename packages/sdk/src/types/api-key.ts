export interface ApiKey {
  id: string;
  name: string;
  /**
   * The full plaintext key — only present immediately after creation.
   * On list/get responses this is the masked representation.
   * Format: sb_ak.<payload>.<signature>
   */
  key: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ApiKeyCreate {
  name: string;
  expires_at?: string;
}

export interface ApiKeyListParams {
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface ApiKeyListResponse {
  items: ApiKey[];
  total: number;
}
