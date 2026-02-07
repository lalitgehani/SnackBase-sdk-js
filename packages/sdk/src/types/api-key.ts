export interface ApiKey {
  id: string;
  name: string;
  /**
   * The full API key. Only returned once during creation.
   */
  key?: string;
  /**
   * The masked version of the key (e.g., "sk_...42").
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
