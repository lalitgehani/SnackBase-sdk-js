import { describe, it, expect } from 'vitest';
import { handleToolError } from '../../src/utils/errors.js';
import * as sdkErrors from '@snackbase/sdk';

describe('handleToolError', () => {
  it('should handle ValidationError', () => {
    const error = new sdkErrors.ValidationError('Validation failed', {
      errors: {
        email: ['Invalid email format'],
      },
    });
    const result = handleToolError(error);
    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Validation Details:');
    expect(result.content[0].text).toContain('Invalid email format');
  });

  it('should handle AuthenticationError', () => {
    const error = new sdkErrors.AuthenticationError('Invalid API key');
    const result = handleToolError(error);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Authentication failed');
    expect(result.content[0].text).toContain('Invalid API key');
  });

  it('should handle NotFoundError', () => {
    const error = new sdkErrors.NotFoundError('Collection not found');
    const result = handleToolError(error);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Not found: Collection not found');
  });

  it('should handle NetworkError', () => {
    const error = new sdkErrors.NetworkError('Connection refused');
    const result = handleToolError(error);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Network error — is SnackBase running?');
    expect(result.content[0].text).toContain('Connection refused');
  });

  it('should handle ServerError', () => {
    const error = new sdkErrors.ServerError('Internal server error', 500);
    const result = handleToolError(error);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Server error (500): Internal server error');
  });

  it('should handle generic Error', () => {
    const error = new Error('Some generic error');
    const result = handleToolError(error);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unexpected error: Some generic error');
  });

  it('should handle unknown error type', () => {
    const result = handleToolError('string error');
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unexpected error: string error');
  });
});
