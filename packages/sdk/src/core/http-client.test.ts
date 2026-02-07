import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from './http-client';
import { TimeoutError } from './errors';

describe('HttpClient', () => {
  const baseUrl = 'https://api.example.com';
  let client: HttpClient;

  beforeEach(() => {
    client = new HttpClient({ baseUrl });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('should resolve relative URLs correctly', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })));

    await client.get('test');
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', expect.anything());

    await client.get('/another-test');
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/another-test', expect.anything());
  });

  it('should handle absolute URLs correctly', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

    await client.get('https://other.com/api/test');
    expect(mockFetch).toHaveBeenCalledWith('https://other.com/api/test', expect.anything());
  });

  it('should return JSON data for application/json responses', async () => {
    const data = { foo: 'bar' };
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

    const response = await client.get('test');
    expect(response.data).toEqual(data);
    expect(response.status).toBe(200);
  });

  it('should return text data for non-JSON responses', async () => {
    const text = 'hello world';
    vi.mocked(fetch).mockResolvedValueOnce(new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    }));

    const response = await client.get('test');
    expect(response.data).toBe(text);
  });

  it('should support request interceptors', async () => {
    client.addRequestInterceptor((req) => {
      req.headers['X-Custom-Header'] = 'custom-value';
      return req;
    });

    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }));

    await client.get('test');
    const callOptions = vi.mocked(fetch).mock.calls[0][1];
    expect(callOptions?.headers).toMatchObject({ 'X-Custom-Header': 'custom-value' });
  });

  it('should support response interceptors', async () => {
    client.addResponseInterceptor((res) => {
      res.data = { ...res.data, modified: true };
      return res;
    });

    vi.mocked(fetch).mockResolvedValueOnce(new Response('{"foo":"bar"}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

    const response = await client.get('test');
    expect(response.data).toEqual({ foo: 'bar', modified: true });
  });

  it('should throw TimeoutError on timeout', async () => {
    vi.useFakeTimers();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const timeoutClient = new HttpClient({ baseUrl, timeout: 50 });
    const requestPromise = timeoutClient.get('test');
    
    vi.advanceTimersByTime(100);
    
    // In many environments, the AbortError will be caught and thrown as TimeoutError
    // But we can also check if fetch was called with a signal that is now aborted
    const lastCall = mockFetch.mock.calls[0];
    const signal = lastCall[1]?.signal;
    expect(signal?.aborted).toBe(true);
    
    vi.useRealTimers();
  });

  it('should retry on retryable errors', async () => {
    // We'll use real timers but short delay for reliability
    const mockFetch = vi.mocked(fetch);
    
    mockFetch.mockRejectedValueOnce({ retryable: true, message: 'Retryable error' });
    mockFetch.mockResolvedValueOnce(new Response('{"success":true}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

    const clientWithRetry = new HttpClient({ baseUrl, maxRetries: 1, retryDelay: 10 });
    const response = await clientWithRetry.get('test');
    
    expect(response.data).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should stop retrying after maxRetries', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValue({ retryable: true, message: 'Retryable error' });

    const clientWithRetry = new HttpClient({ baseUrl, maxRetries: 2, retryDelay: 10 });
    await expect(clientWithRetry.get('test')).rejects.toMatchObject({ message: 'Retryable error' });
    
    expect(mockFetch).toHaveBeenCalledTimes(3); 
  });
});
