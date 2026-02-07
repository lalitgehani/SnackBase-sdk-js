import { describe, it, expect, vi } from 'vitest';
import { createAuthInterceptor, createRefreshInterceptor } from './interceptors';
import { HttpRequest, HttpResponse } from './http-client';

describe('API Key Authentication', () => {
  describe('createAuthInterceptor', () => {
    it('should add X-API-Key header when configured', async () => {
      const interceptor = createAuthInterceptor(() => null, 'test-key');
      const req: HttpRequest = { url: '/api/v1/data', method: 'GET', headers: {} };
      
      const result = await interceptor(req);
      expect(result.headers['X-API-Key']).toBe('test-key');
    });

    it('should add both X-API-Key and Authorization when both are present', async () => {
      const interceptor = createAuthInterceptor(() => 'test-token', 'test-key');
      const req: HttpRequest = { url: '/api/v1/data', method: 'GET', headers: {} };
      
      const result = await interceptor(req);
      expect(result.headers['X-API-Key']).toBe('test-key');
      expect(result.headers['Authorization']).toBe('Bearer test-token');
    });

    it('should skip X-API-Key for OAuth endpoints (Requirement 379)', async () => {
      const interceptor = createAuthInterceptor(() => 'test-token', 'test-key');
      const req: HttpRequest = { url: '/api/v1/auth/oauth/google/authorize', method: 'POST', headers: {} };
      
      const result = await interceptor(req);
      expect(result.headers['X-API-Key']).toBeUndefined();
      expect(result.headers['Authorization']).toBe('Bearer test-token');
    });

    it('should skip X-API-Key for SAML endpoints (Requirement 379)', async () => {
      const interceptor = createAuthInterceptor(() => null, 'test-key');
      const req: HttpRequest = { url: '/api/v1/auth/saml/sso', method: 'GET', headers: {} };
      
      const result = await interceptor(req);
      expect(result.headers['X-API-Key']).toBeUndefined();
    });
  });

  describe('createRefreshInterceptor', () => {
    it('should NOT trigger refresh if X-API-Key was used (Requirement 377)', async () => {
      const refreshMock = vi.fn().mockResolvedValue(true);
      const interceptor = createRefreshInterceptor(refreshMock);
      
      const req: HttpRequest = { 
        url: '/api/v1/data', 
        method: 'GET', 
        headers: { 'X-API-Key': 'test-key' } 
      };
      
      const res: HttpResponse = {
        status: 401,
        data: { message: 'Unauthorized' },
        headers: new Headers(),
        request: req
      };
      
      await interceptor(res);
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it('should trigger refresh if X-API-Key was NOT used', async () => {
      const refreshMock = vi.fn().mockResolvedValue(true);
      const interceptor = createRefreshInterceptor(refreshMock);
      
      const req: HttpRequest = { 
        url: '/api/v1/data', 
        method: 'GET', 
        headers: { 'Authorization': 'Bearer expired' } 
      };
      
      const res: HttpResponse = {
        status: 401,
        data: { message: 'Unauthorized' },
        headers: new Headers(),
        request: req
      };
      
      await interceptor(res);
      expect(refreshMock).toHaveBeenCalled();
    });
  });
});
