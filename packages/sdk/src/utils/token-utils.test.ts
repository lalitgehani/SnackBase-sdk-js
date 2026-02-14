import { describe, test, expect } from 'vitest';
import {
  detectTokenType,
  isSuperadmin,
  formatMaskedKey,
  isValidTokenPrefix
} from './token-utils';
import { TokenType } from '../types/auth'; // Importing TokenType from auth types
import { SYSTEM_ACCOUNT_ID } from '../core/constants';

describe('Token Utils', () => {
  describe('detectTokenType', () => {
    test('should detect API key', () => {
      expect(detectTokenType('sb_ak.payload.signature')).toBe(TokenType.API_KEY);
    });

    test('should detect Personal Token', () => {
      expect(detectTokenType('sb_pt.payload.signature')).toBe(TokenType.PERSONAL_TOKEN);
    });

    test('should detect OAuth Token', () => {
      expect(detectTokenType('sb_ot.payload.signature')).toBe(TokenType.OAUTH);
    });

    test('should detect JWT with prefix', () => {
      expect(detectTokenType('sb_jwt.payload.signature')).toBe(TokenType.JWT);
    });

    test('should detect standard JWT', () => {
      expect(detectTokenType('ey.payload.signature')).toBe(TokenType.JWT);
    });

    test('should return undefined for unknown format', () => {
      expect(detectTokenType('unknown.token')).toBeUndefined();
    });

    test('should return undefined for empty token', () => {
      expect(detectTokenType('')).toBeUndefined();
    });
  });

  describe('isSuperadmin', () => {
    test('should return true for system account ID', () => {
      expect(isSuperadmin({ account_id: SYSTEM_ACCOUNT_ID })).toBe(true);
    });

    test('should return false for other account IDs', () => {
      expect(isSuperadmin({ account_id: 'other-uuid' })).toBe(false);
    });

    test('should return false for null user', () => {
      expect(isSuperadmin(null)).toBe(false);
    });

    test('should return false for undefined user', () => {
      expect(isSuperadmin(undefined)).toBe(false);
    });
  });

  describe('formatMaskedKey', () => {
    test('should format full key', () => {
      const key = 'sb_ak.1234567890.abcdefghij';
      // Expect: sb_ak. + first 4 of payload + ... + last 4 of signature
      // payload=1234567890 -> 1234
      // signature=abcdefghij -> ghij
      expect(formatMaskedKey(key)).toBe('sb_ak.1234...ghij');
    });

    test('should return already masked key as-is', () => {
      const key = 'sb_ak.1234...ghij';
      expect(formatMaskedKey(key)).toBe(key);
    });

    test('should return unknown format as-is', () => {
      const key = 'random-string';
      expect(formatMaskedKey(key)).toBe(key);
    });

    test('should return empty string for empty input', () => {
      expect(formatMaskedKey('')).toBe('');
    });
  });

  describe('isValidTokenPrefix', () => {
    test('should return true for valid prefixes', () => {
      expect(isValidTokenPrefix('sb_ak.token')).toBe(true);
      expect(isValidTokenPrefix('sb_pt.token')).toBe(true);
      expect(isValidTokenPrefix('sb_ot.token')).toBe(true);
      expect(isValidTokenPrefix('sb_jwt.token')).toBe(true);
    });

    test('should return false for invalid prefixes', () => {
      expect(isValidTokenPrefix('invalid.token')).toBe(false);
      expect(isValidTokenPrefix('ey.token')).toBe(false); // ey is not in VALID_TOKEN_PREFIXES set
    });

    test('should return false for empty string', () => {
      expect(isValidTokenPrefix('')).toBe(false);
    });
  });
});
