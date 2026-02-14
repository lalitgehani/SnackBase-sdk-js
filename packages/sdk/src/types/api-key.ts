export interface ApiKey {
  id: string;
  name: string;
  /**
   * The full API key. Only returned once during creation.
   * Format: sb_ak.<payload>.<signature>
   */
  key?: string;
  /**
   * The masked version of the key (e.g., "sb_ak....SIGN").
   */
  masked_key: string;
  /**
   * The last 4 characters of the key.
   */
  last_4: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
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

export type ApiKeyListResponse = ApiKey[];
