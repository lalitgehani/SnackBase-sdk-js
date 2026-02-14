
import { TokenType } from '../types/auth'; // Importing TokenType from auth types
import { TOKEN_PREFIXES, VALID_TOKEN_PREFIXES, SYSTEM_ACCOUNT_ID } from '../core/constants';

/**
 * Detect token type from token string
 * @param token - The token to analyze
 * @returns Detected token type or undefined
 */
export function detectTokenType(token: string): TokenType | undefined {
  if (!token) return undefined;

  // Extract prefix from 3-part format: prefix.payload.signature
  const prefix = token.split('.')[0];

  // Check against known prefixes
  switch (prefix) {
    case TOKEN_PREFIXES.API_KEY:
      return TokenType.API_KEY;
    case TOKEN_PREFIXES.PERSONAL_TOKEN:
      return TokenType.PERSONAL_TOKEN;
    case TOKEN_PREFIXES.OAUTH:
      return TokenType.OAUTH;
    case TOKEN_PREFIXES.JWT:
      return TokenType.JWT;
    default:
      // Default to JWT for standard JWT format (starts with eyXXX)
      return token.startsWith('ey') ? TokenType.JWT : undefined;
  }
}

/**
 * Check if user is a superadmin
 * @param user - User object to check
 * @returns true if user is superadmin
 */
export function isSuperadmin(user: { account_id: string } | null | undefined): boolean {
  if (!user) return false;
  return user.account_id === SYSTEM_ACCOUNT_ID;
}

/**
 * Format masked API key for display
 * @param key - The full or masked key
 * @returns Formatted masked key
 */
export function formatMaskedKey(key: string): string {
  if (!key) return '';

  // Already masked: sb_ak.EY...SIGN
  if (key.includes('...')) return key;

  // Full key: sb_ak.payload.signature
  const parts = key.split('.');
  if (parts.length === 3) {
    const [, payload, signature] = parts;
    return `${parts[0]}.${payload.slice(0, 4)}...${signature.slice(-4)}`;
  }

  // Unknown format: return as-is
  return key;
}

/**
 * Validate token prefix
 * @param token - The token to validate
 * @returns true if token has valid prefix
 */
export function isValidTokenPrefix(token: string): boolean {
  if (!token) return false;
  const prefix = token.split('.')[0];
  return VALID_TOKEN_PREFIXES.has(prefix);
}
