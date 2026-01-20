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
  NetworkError
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
 * Interceptor to inject Authorization and API Key headers.
 */
export const createAuthInterceptor = (
  getToken: () => string | undefined | null,
  apiKey?: string
): RequestInterceptor => {
  return (request: HttpRequest) => {
    const token = getToken();
    if (token) {
      request.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (apiKey) {
      request.headers['X-API-Key'] = apiKey;
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
      return new ValidationError(message, data);
    case 429:
      const retryAfter = response.headers.get('Retry-After');
      return new RateLimitError(message, data, retryAfter ? parseInt(retryAfter, 10) : undefined);
    default:
      if (status >= 500) {
        return new ServerError(message, status, data);
      }
      return new SnackBaseError(message, 'UNKNOWN_ERROR', status, data, false);
  }
}

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
    if (response.status === 401 && !isRefreshing) {
      isRefreshing = true;
      try {
        const success = await refreshToken();
        isRefreshing = false;
        
        if (success) {
          // The HttpClient will handle the retry if we can somehow signal it.
          // For now, we return the response and let the caller handle it, 
          // or we throw a special error that the HttpClient can catch and retry.
          // However, the PRD says the interceptor should trigger the refresh and retry.
          // To implement retry in an interceptor, we'd need access to the client.
          // A better way is for the HttpClient to handle the retry loop if an interceptor throws a "RetryableError".
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
