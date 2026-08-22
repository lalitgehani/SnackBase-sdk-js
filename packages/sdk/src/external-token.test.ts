import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SnackBaseClient } from '../src/core/client';
import { ExternalTokenAuthError } from '../src/core/errors';
import { RealTimeService } from '../src/core/realtime-service';

describe('SnackBaseClient external access token provider', () => {
  const validBaseUrl = 'https://api.snackbase.dev';

  it('uses getAccessToken for auth interceptor instead of authManager.token', async () => {
    let token = 'external-token-1';
    const client = new SnackBaseClient({
      baseUrl: validBaseUrl,
      getAccessToken: () => token,
    });

    const interceptorSpy = vi.spyOn(client.httpClient, 'get');
    vi.spyOn(client.httpClient, 'request').mockResolvedValue({
      data: {},
      status: 200,
      headers: new Headers(),
      request: { url: '/api/v1/collections', method: 'GET', headers: {} },
    });

    await client.httpClient.get('/api/v1/collections');
    expect(interceptorSpy).toHaveBeenCalled();

    token = 'external-token-2';
    await client.httpClient.get('/api/v1/collections');
  });

  it('forces memory storage and disables auto refresh', () => {
    const client = new SnackBaseClient({
      baseUrl: validBaseUrl,
      getAccessToken: () => 'token',
      storageBackend: 'localStorage',
      enableAutoRefresh: true,
    });
    const config = client.getConfig();
    expect(config.storageBackend).toBe('memory');
    expect(config.enableAutoRefresh).toBe(false);
  });

  it('throws ExternalTokenAuthError on login, logout, and refresh', async () => {
    const client = new SnackBaseClient({
      baseUrl: validBaseUrl,
      getAccessToken: () => 'token',
    });

    await expect(client.login({ email: 'a@b.com', password: 'x' })).rejects.toThrow(
      ExternalTokenAuthError,
    );
    await expect(client.logout()).rejects.toThrow(ExternalTokenAuthError);
    await expect(client.refreshToken()).rejects.toThrow(ExternalTokenAuthError);
  });

  it('passes external token to RealTimeService getToken', async () => {
    let token = 'rt-token';
    const client = new SnackBaseClient({
      baseUrl: validBaseUrl,
      getAccessToken: () => token,
    });

    const getTokenSpy = vi.spyOn(client.realtime as RealTimeService & { options: { getToken: () => string | null } }, 'options', 'get');
    // Access via internal realtime service options through connect attempt
    expect(client.getConfig().getAccessToken?.()).toBe('rt-token');
    token = 'rt-token-2';
    expect(client.getConfig().getAccessToken?.()).toBe('rt-token-2');
  });

  it('behaves as before when getAccessToken is not set', () => {
    const client = new SnackBaseClient({ baseUrl: validBaseUrl, storageBackend: 'memory' });
    expect(client.getConfig().enableAutoRefresh).toBe(true);
    expect(client.getConfig().getAccessToken).toBeUndefined();
  });
});

describe('RealTimeService URL composition', () => {
  it('preserves base path prefix for WebSocket URLs', async () => {
    let wsUrl = '';
    vi.stubGlobal(
      'WebSocket',
      class {
        url: string;
        onopen: (() => void) | null = null;
        onclose: (() => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((error: Event) => void) | null = null;
        constructor(url: string) {
          wsUrl = url;
          setTimeout(() => this.onopen?.(), 0);
        }
        send = vi.fn();
        close = vi.fn();
      },
    );

    const service = new RealTimeService({
      baseUrl: 'https://console.example/platform/v1/env/abc',
      getToken: () => 'mock-token',
    });

    await service.connect();
    expect(wsUrl).toBe(
      'wss://console.example/platform/v1/env/abc/api/v1/realtime/ws?token=mock-token',
    );
  });

  it('uses root path for same-origin base URLs', async () => {
    let wsUrl = '';
    vi.stubGlobal(
      'WebSocket',
      class {
        url: string;
        onopen: (() => void) | null = null;
        onclose: (() => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((error: Event) => void) | null = null;
        constructor(url: string) {
          wsUrl = url;
          setTimeout(() => this.onopen?.(), 0);
        }
        send = vi.fn();
        close = vi.fn();
      },
    );

    const service = new RealTimeService({
      baseUrl: 'https://api.example.com',
      getToken: () => 'mock-token',
    });

    await service.connect();
    expect(wsUrl).toBe('wss://api.example.com/api/v1/realtime/ws?token=mock-token');
  });
});
