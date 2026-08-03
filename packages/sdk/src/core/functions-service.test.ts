import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FunctionsService } from './functions-service';
import { HttpClient } from './http-client';

describe('FunctionsService', () => {
  let service: FunctionsService;
  let mockHttp: any;
  let accountSlug: string | undefined;

  beforeEach(() => {
    accountSlug = 'my-account';
    mockHttp = {
      request: vi.fn(),
    };
    service = new FunctionsService(
      mockHttp as unknown as HttpClient,
      () => accountSlug,
    );
  });

  it('invokes POST /api/v1/f/{accountSlug}/{slug} and returns parsed data', async () => {
    const headers = new Headers({ 'x-function-execution-id': 'exec-1' });
    mockHttp.request.mockResolvedValue({
      data: { ok: true },
      status: 200,
      headers,
    });

    const result = await service.invoke('hello', { body: { a: 1 } });

    expect(mockHttp.request).toHaveBeenCalledWith({
      method: 'POST',
      url: '/api/v1/f/my-account/hello',
      body: { a: 1 },
      headers: undefined,
      params: undefined,
    });
    expect(result.data).toEqual({ ok: true });
    expect(result.status).toBe(200);
    expect(result.executionId).toBe('exec-1');
  });

  it('throws when account slug is missing', async () => {
    accountSlug = undefined;
    await expect(service.invoke('hello')).rejects.toThrow(/account slug/);
  });

  it('supports path suffix and method', async () => {
    mockHttp.request.mockResolvedValue({
      data: {},
      status: 200,
      headers: new Headers(),
    });
    await service.invoke('hello', { method: 'GET', path: 'sub/path' });
    expect(mockHttp.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/f/my-account/hello/sub/path',
      }),
    );
  });
});
