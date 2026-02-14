import { describe, it, expect } from 'vitest';
import {
  SYSTEM_ACCOUNT_ID,
  TOKEN_PREFIXES,
  VALID_TOKEN_PREFIXES,
  API_KEY_BASE_PATH,
} from './constants';

describe('Constants', () => {
  it('should have correct SYSTEM_ACCOUNT_ID', () => {
    expect(SYSTEM_ACCOUNT_ID).toBe('00000000-0000-0000-0000-000000000000');
  });

  it('should have correct TOKEN_PREFIXES', () => {
    expect(TOKEN_PREFIXES.JWT).toBe('sb_jwt');
    expect(TOKEN_PREFIXES.API_KEY).toBe('sb_ak');
    expect(TOKEN_PREFIXES.PERSONAL_TOKEN).toBe('sb_pt');
    expect(TOKEN_PREFIXES.OAUTH).toBe('sb_ot');
    expect(Object.keys(TOKEN_PREFIXES)).toHaveLength(4);
  });

  it('should have correct VALID_TOKEN_PREFIXES', () => {
    expect(VALID_TOKEN_PREFIXES.has('sb_jwt')).toBe(true);
    expect(VALID_TOKEN_PREFIXES.has('sb_ak')).toBe(true);
    expect(VALID_TOKEN_PREFIXES.has('sb_pt')).toBe(true);
    expect(VALID_TOKEN_PREFIXES.has('sb_ot')).toBe(true);
    expect(VALID_TOKEN_PREFIXES.size).toBe(4);
  });

  it('should have correct API_KEY_BASE_PATH', () => {
    expect(API_KEY_BASE_PATH).toBe('/api/v1/admin/api-keys');
  });
});
