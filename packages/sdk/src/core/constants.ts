/**
 * System account ID for superadmin detection
 * Nil UUID format used by backend
 * @see https://github.com/snackbase/snackbase/blob/main/src/snackbase/infrastructure/api/middleware/authorization.py
 */
export const SYSTEM_ACCOUNT_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Token type prefixes matching backend TokenCodec
 */
export const TOKEN_PREFIXES = {
  JWT: 'sb_jwt',
  API_KEY: 'sb_ak',
  PERSONAL_TOKEN: 'sb_pt',
  OAUTH: 'sb_ot',
} as const;

/**
 * Valid token prefixes for validation
 */
export const VALID_TOKEN_PREFIXES = new Set<string>(
  Object.values(TOKEN_PREFIXES)
);

/**
 * API key endpoint path
 */
export const API_KEY_BASE_PATH = '/api/v1/admin/api-keys';
