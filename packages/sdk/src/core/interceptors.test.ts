import { describe, it, expect } from 'vitest';
import { 
  contentTypeInterceptor, 
  createAuthInterceptor, 
  errorNormalizationInterceptor,
  createAuthErrorInterceptor
} from './interceptors';
import { 
  AuthenticationError, 
  ValidationError, 
  ServerError,
  SnackBaseError,
  ApiKeyRestrictedError,
  EmailVerificationRequiredError
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

    it('should NOT add X-API-Key header for auth actions', async () => {
      const interceptor = createAuthInterceptor(() => undefined, 'test-api-key');
      
      const loginReq: HttpRequest = { url: '/api/v1/auth/login', method: 'POST', headers: {} };
      const loginResult = await interceptor(loginReq) as HttpRequest;
      expect(loginResult.headers['X-API-Key']).toBeUndefined();

      const registerReq: HttpRequest = { url: '/api/v1/auth/register', method: 'POST', headers: {} };
      const registerResult = await interceptor(registerReq) as HttpRequest;
      expect(registerResult.headers['X-API-Key']).toBeUndefined();
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

  describe('createAuthErrorInterceptor', () => {
    it('should throw ApiKeyRestrictedError for 403 with superadmin/restricted detail', async () => {
      const interceptor = createAuthErrorInterceptor();
      const error = {
        status: 403,
        details: { detail: 'Only superadmin can perform this action' }
      };

      try {
        await interceptor(error);
        fail('Should have thrown');
      } catch (e: any) {
        expect(e).toBeInstanceOf(ApiKeyRestrictedError);
        expect(e.message).toBe('Only superadmin can perform this action');
      }
    });

    it('should throw EmailVerificationRequiredError for 401 with email/verify detail', async () => {
      const interceptor = createAuthErrorInterceptor();
      const error = {
        status: 401,
        details: { detail: 'Please verify your email' }
      };

      try {
        await interceptor(error);
        fail('Should have thrown');
      } catch (e: any) {
        expect(e).toBeInstanceOf(EmailVerificationRequiredError);
        expect(e.message).toBe('Please verify your email');
      }
    });

    it('should preserve redirect info for 403 OAuth/SAML errors', async () => {
      const interceptor = createAuthErrorInterceptor();
      const error = {
        status: 403,
        details: {
          redirect_url: 'https://auth.example.com',
          auth_provider: 'google',
          provider_name: 'Google'
        }
      };

      try {
        await interceptor(error);
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.redirectUrl).toBe('https://auth.example.com');
        expect(e.authProvider).toBe('google');
        expect(e.providerName).toBe('Google');
      }
    });

    it('should call onAuthError callback for 401/403 errors', async () => {
      let calledError: any = null;
      const interceptor = createAuthErrorInterceptor((err) => {
        calledError = err;
      });

      const error401 = { status: 401, message: 'Unauthorized' };
      try {
        await interceptor(error401);
      } catch (e) {
        // expected
      }
      expect(calledError).toBe(error401);

      const error403 = { status: 403, details: { detail: 'restricted' } };
      try {
        await interceptor(error403);
      } catch (e) {
        // expected
      }
      expect(calledError).toBeInstanceOf(ApiKeyRestrictedError);
    });
  });
});

function fail(message: string) {
  throw new Error(message);
}
