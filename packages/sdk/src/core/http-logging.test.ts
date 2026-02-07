import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from './http-client';
import { Logger, LogLevel } from './logger';

describe('HttpClient Logging', () => {
  let client: HttpClient;
  let logger: Logger;
  const baseUrl = 'https://api.example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    logger = new Logger(LogLevel.DEBUG);
    client = new HttpClient({
      baseUrl,
      logger,
    });
    
    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log request and response at DEBUG level', async () => {
    const loggerSpy = vi.spyOn(logger, 'debug');
    
    await client.get('/test');
    
    expect(loggerSpy).toHaveBeenCalledTimes(2);
    // Request log
    expect(loggerSpy).toHaveBeenNthCalledWith(1, expect.stringMatching(/Request: GET/), expect.any(Object));
    // Response log
    expect(loggerSpy).toHaveBeenNthCalledWith(2, expect.stringMatching(/Response: 200/), expect.any(Object));
  });

  it('should not log request/response if logger is not provided', async () => {
    const noLogClient = new HttpClient({ baseUrl });
    // We can't spy on a logger that doesn't exist, but we can verify no errors occur
    await expect(noLogClient.get('/test')).resolves.toBeDefined();
  });

  it('should warn on slow requests', async () => {
    const loggerSpy = vi.spyOn(logger, 'warn');
    
    // Mock fetch to take 1100ms
    global.fetch = vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
      };
    });
    
    await client.get('/slow');
    
    expect(loggerSpy).toHaveBeenCalledWith(expect.stringMatching(/Slow request detected/));
  }, 1500); // Increase timeout for this test

  it('should log errors', async () => {
    const loggerSpy = vi.spyOn(logger, 'error');
    const error = new Error('Network error');
    
    global.fetch = vi.fn().mockRejectedValue(error);
    
    await expect(client.get('/error')).rejects.toThrow();
    
    expect(loggerSpy).toHaveBeenCalledWith(expect.stringMatching(/Request failed/), error);
  });
  
  it('should log retries', async () => {
    const loggerSpy = vi.spyOn(logger, 'info');
    const error = new Error('Network error');
    // @ts-ignore
    error.retryable = true;
    
    global.fetch = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
      });
      
    await client.get('/retry', { retryDelay: 10 }); // Fast retry for test
    
    expect(loggerSpy).toHaveBeenCalledWith(expect.stringMatching(/Retrying request/));
  });
});
