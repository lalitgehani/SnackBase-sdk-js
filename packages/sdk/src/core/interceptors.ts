import { 
  HttpRequest, 
  HttpResponse, 
  RequestInterceptor, 
  ResponseInterceptor, 
  ErrorInterceptor 
} from './http-client';
import { 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError, 
  ConflictError, 
  ValidationError, 
  RateLimitError, 
  ServerError,
  SnackBaseError,
  NetworkError,
  ApiKeyRestrictedError,
  EmailVerificationRequiredError
} from './errors';

/**
 * Interceptor to set Content-Type: application/json for requests with a body.
 */
export const contentTypeInterceptor: RequestInterceptor = (request: HttpRequest) => {
  if (request.body && !request.headers['Content-Type']) {
    request.headers['Content-Type'] = 'application/json';
  }
  return request;
};

/**
 * Interceptor to inject Authorization, API Key, and X-Account-ID headers.
 */
export const createAuthInterceptor = (
  getToken: () => string | undefined | null,
  apiKey?: string,
  accountId?: string
): RequestInterceptor => {
  return (request: HttpRequest) => {
    // Requirement 379: API key cannot be used for user-specific operations (OAuth/SAML)
    const isUserSpecific = request.url.includes('/auth/oauth/') || request.url.includes('/auth/saml/');

    if (apiKey && !isUserSpecific) {
      // Requirement 486: Handle new 403 for API key restriction
      const isAuthAction = request.url.includes('/auth/login') || request.url.includes('/auth/register');
      if (!isAuthAction) {
        request.headers['X-API-Key'] = apiKey;
      }
    }

    // Requirement 390: API key can be used alongside JWT auth (fallback)
    const token = getToken();
    if (token) {
      request.headers['Authorization'] = `Bearer ${token}`;
    } else if (accountId) {
      // No token present — inject X-Account-ID for anonymous public collection access.
      // The server ignores this header when a valid JWT is present.
      request.headers['X-Account-ID'] = accountId;
    }

    return request;
  };
};

/**
 * Interceptor to normalize error responses into SnackBaseError instances.
 */
export const errorNormalizationInterceptor: ResponseInterceptor = (response: HttpResponse) => {
  if (response.status >= 400) {
    throw createErrorFromResponse(response);
  }
  return response;
};

/**
 * Error interceptor to handle raw fetch errors.
 */
export const errorInterceptor: ErrorInterceptor = (error: any) => {
  if (error instanceof SnackBaseError) {
    throw error;
  }
  
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return error; // HttpClient already handles this
    }
    throw new NetworkError(error.message, error);
  }
  
  throw new NetworkError(String(error), error);
};

/**
 * Creates a specific SnackBaseError based on the response status and body.
 */
function createErrorFromResponse(response: HttpResponse): SnackBaseError {
  const { status, data } = response;
  const message = data?.message || data?.error || 'An unexpected error occurred';
  
  switch (status) {
    case 401:
      return new AuthenticationError(message, data);
    case 403:
      return new AuthorizationError(message, data);
    case 404:
      return new NotFoundError(message, data);
    case 409:
      return new ConflictError(message, data);
    case 422:
      // ValidationError constructor already extracts 'field' and 'errors' from data
      return new ValidationError(message, data);
    case 429:
      const retryAfter = response.headers.get('Retry-After') || data?.retryAfter;
      return new RateLimitError(message, data, retryAfter ? parseInt(retryAfter, 10) : undefined);
    default:
      if (status >= 500) {
        return new ServerError(message, status, data);
      }
      return new SnackBaseError(message, 'UNKNOWN_ERROR', status, data, false);
  }
}

/**
 * Enhanced error interceptor to handle 403 API key errors and preserve redirects.
 */
export const createAuthErrorInterceptor = (
  onAuthError?: (error: any) => void
): ErrorInterceptor => {
  return (error: any) => {
    // Handle new 403 for API key restriction
    if (error.status === 403 && error.details) {
      const detail = error.details.detail || error.details.message || '';

      if (detail.includes('superadmin') || detail.includes('restricted')) {
        const restrictedError = new ApiKeyRestrictedError(detail, error.details);
        if (onAuthError) onAuthError(restrictedError);
        throw restrictedError;
      }
    }

    // Handle OAuth/SAML redirect errors
    if (error.status === 403 && error.details?.redirect_url) {
      error.redirectUrl = error.details.redirect_url;
      error.authProvider = error.details.auth_provider;
      error.providerName = error.details.provider_name;
    }
    
    // Handle email verification required (401)
    if (error.status === 401 && error.details) {
      const detail = error.details.detail || error.details.message || '';
      
      if (detail.includes('verify') || detail.includes('email')) {
        const verificationError = new EmailVerificationRequiredError(detail, error.details);
        if (onAuthError) onAuthError(verificationError);
        throw verificationError;
      }
    }

    if (error.status === 401 || error.status === 403) {
      if (onAuthError) onAuthError(error);
    }

    throw error;
  };
};

/**
 * Placeholder for the refresh interceptor logic.
 * This will be fully implemented once Auth module is ready.
 */
export const createRefreshInterceptor = (
  refreshToken: () => Promise<boolean>,
  onAuthError?: (error: any) => void
): ResponseInterceptor => {
  let isRefreshing = false;
  
  return async (response: HttpResponse) => {
    // If request used an API Key, we bypass JWT token logic (Requirement 377)
    // and do not attempt to refresh.
    const usedApiKey = !!response.request.headers['X-API-Key'];

    if (response.status === 401 && !isRefreshing && !usedApiKey) {
      isRefreshing = true;
      try {
        const success = await refreshToken();
        isRefreshing = false;
        
        if (success) {
          // Note: In a real implementation, we would retry the request here.
          // For now, we follow the current pattern in the codebase.
        }
      } catch (error) {
        isRefreshing = false;
        if (onAuthError) onAuthError(error);
        throw error;
      }
    }
    return response;
  };
};
