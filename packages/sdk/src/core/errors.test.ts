import { describe, it, expect } from 'vitest';
import { 
  SnackBaseError, 
  AuthenticationError, 
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ValidationError, 
  RateLimitError,
  NetworkError,
  TimeoutError,
  ServerError
} from './errors';

describe('Errors', () => {
  it('should create SnackBaseError with correct properties', () => {
    const error = new SnackBaseError('msg', 'CODE', 400, { detail: 'info' }, true, 'user_id');
    expect(error.message).toBe('msg');
    expect(error.code).toBe('CODE');
    expect(error.status).toBe(400);
    expect(error.details).toEqual({ detail: 'info' });
    expect(error.retryable).toBe(true);
    expect(error.field).toBe('user_id');
    expect(error.name).toBe('SnackBaseError');
  });

  it('should create AuthenticationError with default values', () => {
    const error = new AuthenticationError();
    expect(error.status).toBe(401);
    expect(error.code).toBe('AUTHENTICATION_ERROR');
    expect(error.retryable).toBe(false);
  });

  it('should create AuthorizationError with default values', () => {
    const error = new AuthorizationError();
    expect(error.status).toBe(403);
    expect(error.code).toBe('AUTHORIZATION_ERROR');
    expect(error.retryable).toBe(false);
  });

  it('should create NotFoundError with default values', () => {
    const error = new NotFoundError();
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND_ERROR');
    expect(error.retryable).toBe(false);
  });

  it('should create ConflictError with default values', () => {
    const error = new ConflictError();
    expect(error.status).toBe(409);
    expect(error.code).toBe('CONFLICT_ERROR');
    expect(error.retryable).toBe(false);
  });

  it('should extract field and field errors in ValidationError', () => {
    const details = { field: 'email', errors: { email: ['invalid'] } };
    const error = new ValidationError('Bad request', details);
    expect(error.status).toBe(422);
    expect(error.field).toBe('email');
    expect(error.fields).toEqual({ email: ['invalid'] });
  });

  it('should set retryAfter in RateLimitError', () => {
    const error = new RateLimitError('Too many requests', {}, 60);
    expect(error.status).toBe(429);
    expect(error.retryAfter).toBe(60);
    expect(error.retryable).toBe(true);
  });

  it('should create NetworkError with retryable=true', () => {
    const error = new NetworkError('Connection failed');
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.retryable).toBe(true);
  });

  it('should create TimeoutError with retryable=true', () => {
    const error = new TimeoutError('Request timed out');
    expect(error.code).toBe('TIMEOUT_ERROR');
    expect(error.retryable).toBe(true);
  });

  it('should set status in ServerError', () => {
    const error = new ServerError('Broken', 503);
    expect(error.status).toBe(503);
    expect(error.retryable).toBe(true);
  });
});
