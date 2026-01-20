import { describe, it, expect } from 'vitest';
import { 
  SnackBaseError, 
  AuthenticationError, 
  ValidationError, 
  RateLimitError,
  ServerError
} from './errors';

describe('Errors', () => {
  it('should create SnackBaseError with correct properties', () => {
    const error = new SnackBaseError('msg', 'CODE', 400, { detail: 'info' }, true);
    expect(error.message).toBe('msg');
    expect(error.code).toBe('CODE');
    expect(error.status).toBe(400);
    expect(error.details).toEqual({ detail: 'info' });
    expect(error.retryable).toBe(true);
    expect(error.name).toBe('SnackBaseError');
  });

  it('should create AuthenticationError with default values', () => {
    const error = new AuthenticationError();
    expect(error.status).toBe(401);
    expect(error.code).toBe('AUTHENTICATION_ERROR');
    expect(error.retryable).toBe(false);
  });

  it('should extract field errors in ValidationError', () => {
    const details = { errors: { email: ['invalid'] } };
    const error = new ValidationError('Bad request', details);
    expect(error.status).toBe(422);
    expect(error.fields).toEqual({ email: ['invalid'] });
  });

  it('should set retryAfter in RateLimitError', () => {
    const error = new RateLimitError('Too many requests', {}, 60);
    expect(error.status).toBe(429);
    expect(error.retryAfter).toBe(60);
    expect(error.retryable).toBe(true);
  });

  it('should set status in ServerError', () => {
    const error = new ServerError('Broken', 503);
    expect(error.status).toBe(503);
    expect(error.retryable).toBe(true);
  });
});
