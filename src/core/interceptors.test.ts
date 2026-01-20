import { describe, it, expect } from 'vitest';
import { 
  contentTypeInterceptor, 
  createAuthInterceptor, 
  errorNormalizationInterceptor 
} from './interceptors';
import { 
  AuthenticationError, 
  ValidationError, 
  ServerError,
  SnackBaseError
} from './errors';
import { HttpResponse, HttpRequest } from './http-client';

describe('Interceptors', () => {
  describe('contentTypeInterceptor', () => {
    it('should add Content-Type: application/json if body is present', async () => {
      const req: HttpRequest = {
        url: '/test',
        method: 'POST',
        headers: {},
        body: { foo: 'bar' }
      };
      const result = await contentTypeInterceptor(req) as HttpRequest;
      expect(result.headers['Content-Type']).toBe('application/json');
    });

    it('should not override existing Content-Type', async () => {
      const req: HttpRequest = {
        url: '/test',
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: '<foo>bar</foo>'
      };
      const result = await contentTypeInterceptor(req) as HttpRequest;
      expect(result.headers['Content-Type']).toBe('application/xml');
    });
  });

  describe('authInterceptor', () => {
    it('should add Authorization header if token is provided', async () => {
      const interceptor = createAuthInterceptor(() => 'test-token');
      const req: HttpRequest = { url: '/test', method: 'GET', headers: {} };
      const result = await interceptor(req) as HttpRequest;
      expect(result.headers['Authorization']).toBe('Bearer test-token');
    });

    it('should add X-API-Key header if apiKey is provided', async () => {
      const interceptor = createAuthInterceptor(() => undefined, 'test-api-key');
      const req: HttpRequest = { url: '/test', method: 'GET', headers: {} };
      const result = await interceptor(req) as HttpRequest;
      expect(result.headers['X-API-Key']).toBe('test-api-key');
    });
  });

  describe('errorNormalizationInterceptor', () => {
    const dummyReq: HttpRequest = { url: '/test', method: 'GET', headers: {} };

    it('should pass through successful responses', async () => {
      const res: HttpResponse = {
        status: 200,
        data: {},
        headers: new Headers(),
        request: dummyReq
      };
      const result = await errorNormalizationInterceptor(res);
      expect(result).toBe(res);
    });

    it('should throw AuthenticationError for 401', async () => {
      const res: HttpResponse = {
        status: 401,
        data: { message: 'Unauthorized' },
        headers: new Headers(),
        request: dummyReq
      };
      try {
        await errorNormalizationInterceptor(res);
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.code).toBe('AUTHENTICATION_ERROR');
        expect(e.status).toBe(401);
      }
    });

    it('should throw ValidationError for 422', async () => {
      const res: HttpResponse = {
        status: 422,
        data: { message: 'Invalid', errors: { email: ['Required'] } },
        headers: new Headers(),
        request: dummyReq
      };
      try {
        await errorNormalizationInterceptor(res);
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.code).toBe('VALIDATION_ERROR');
        expect(e.fields).toEqual({ email: ['Required'] });
      }
    });

    it('should throw ServerError for 500', async () => {
      const res: HttpResponse = {
        status: 500,
        data: { message: 'Internal error' },
        headers: new Headers(),
        request: dummyReq
      };
      try {
        await errorNormalizationInterceptor(res);
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.code).toBe('SERVER_ERROR');
        expect(e.status).toBe(500);
      }
    });
  });
});

function fail(message: string) {
  throw new Error(message);
}
