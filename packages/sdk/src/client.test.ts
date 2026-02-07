import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SnackBaseClient } from '../src/core/client';
import * as platform from '../src/utils/platform';

describe('SnackBaseClient', () => {
  const validBaseUrl = 'https://api.snackbase.dev';

  it('should initialize with a valid baseUrl', () => {
    const client = new SnackBaseClient({ baseUrl: validBaseUrl });
    expect(client.getConfig().baseUrl).toBe(validBaseUrl);
  });

  it('should throw error if baseUrl is missing', () => {
    // @ts-expect-error baseUrl is required
    expect(() => new SnackBaseClient({})).toThrow('baseUrl is required');
  });

  it('should throw error if baseUrl is invalid', () => {
    expect(() => new SnackBaseClient({ baseUrl: 'not-a-url' })).toThrow('baseUrl must be a valid URL');
  });

  it('should use default values for optional config', () => {
    const client = new SnackBaseClient({ baseUrl: validBaseUrl });
    const config = client.getConfig();
    expect(config.timeout).toBe(30000);
    expect(config.enableAutoRefresh).toBe(true);
    expect(config.maxRetries).toBe(3);
  });

  it('should override default values with provided config', () => {
    const client = new SnackBaseClient({
      baseUrl: validBaseUrl,
      timeout: 5000,
      maxRetries: 5,
    });
    const config = client.getConfig();
    expect(config.timeout).toBe(5000);
    expect(config.maxRetries).toBe(5);
  });

  it('should validate timeout is non-negative', () => {
    expect(() => new SnackBaseClient({ baseUrl: validBaseUrl, timeout: -1 })).toThrow('timeout must be a non-negative number');
  });

  it('should auto-detect storage backend if not provided', () => {
    vi.spyOn(platform, 'getAutoDetectedStorage').mockReturnValue('localStorage');
    const client = new SnackBaseClient({ baseUrl: validBaseUrl });
    expect(client.getConfig().storageBackend).toBe('localStorage');
  });

  it('should use provided storage backend and not auto-detect', () => {
    const spy = vi.spyOn(platform, 'getAutoDetectedStorage');
    const client = new SnackBaseClient({ baseUrl: validBaseUrl, storageBackend: 'memory' });
    expect(client.getConfig().storageBackend).toBe('memory');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should maintain independent configurations for multiple instances', () => {
    const client1 = new SnackBaseClient({ baseUrl: 'https://api1.com', timeout: 1000 });
    const client2 = new SnackBaseClient({ baseUrl: 'https://api2.com', timeout: 2000 });
    
    expect(client1.getConfig().baseUrl).toBe('https://api1.com');
    expect(client1.getConfig().timeout).toBe(1000);
    
    expect(client2.getConfig().baseUrl).toBe('https://api2.com');
    expect(client2.getConfig().timeout).toBe(2000);
  });

  it('should store defaultAccount in configuration', () => {
    const client = new SnackBaseClient({ baseUrl: validBaseUrl, defaultAccount: 'my-account' });
    expect(client.getConfig().defaultAccount).toBe('my-account');
  });

  it('should throw error if defaultAccount is not a string', () => {
    // @ts-expect-error defaultAccount must be a string
    expect(() => new SnackBaseClient({ baseUrl: validBaseUrl, defaultAccount: 123 })).toThrow('defaultAccount must be a string');
  });
});
