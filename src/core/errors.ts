/**
 * Base error class for all SnackBase SDK errors.
 */
export class SnackBaseError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly details?: any;
  public readonly field?: string;
  public readonly retryable: boolean;

  constructor(
    message: string, 
    code: string, 
    status?: number, 
    details?: any, 
    retryable: boolean = false,
    field?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.details = details;
    this.retryable = retryable;
    this.field = field;
    Object.setPrototypeOf(this, SnackBaseError.prototype);
  }
}

/**
 * Thrown when authentication fails (401).
 */
export class AuthenticationError extends SnackBaseError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, details, false);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Thrown when the user is not authorized to perform an action (403).
 */
export class AuthorizationError extends SnackBaseError {
  constructor(message: string = 'Not authorized', details?: any) {
    super(message, 'AUTHORIZATION_ERROR', 403, details, false);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Thrown when a resource is not found (404).
 */
export class NotFoundError extends SnackBaseError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 'NOT_FOUND_ERROR', 404, details, false);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Thrown when a conflict occurs (409).
 */
export class ConflictError extends SnackBaseError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, 'CONFLICT_ERROR', 409, details, false);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Thrown when validation fails (422).
 */
export class ValidationError extends SnackBaseError {
  public readonly fields?: Record<string, string[]>;

  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 'VALIDATION_ERROR', 422, details, false, details?.field);
    Object.setPrototypeOf(this, ValidationError.prototype);
    if (details?.errors) {
      this.fields = details.errors;
    }
  }
}

/**
 * Thrown when rate limit is exceeded (429).
 */
export class RateLimitError extends SnackBaseError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded', details?: any, retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', 429, details, true);
    Object.setPrototypeOf(this, RateLimitError.prototype);
    this.retryAfter = retryAfter;
  }
}

/**
 * Thrown when a network failure occurs.
 */
export class NetworkError extends SnackBaseError {
  constructor(message: string = 'Network error', details?: any) {
    super(message, 'NETWORK_ERROR', undefined, details, true);
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Thrown when a request times out.
 */
export class TimeoutError extends SnackBaseError {
  constructor(message: string = 'Request timed out', details?: any) {
    super(message, 'TIMEOUT_ERROR', undefined, details, true);
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Thrown when a server error occurs (500+).
 */
export class ServerError extends SnackBaseError {
  constructor(message: string = 'Internal server error', status: number = 500, details?: any) {
    super(message, 'SERVER_ERROR', status, details, true);
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}
