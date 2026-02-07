---
name: errors
description: Error handling, retry behavior, and specific error types in SnackBase SDK
metadata:
  tags: error, exception, retry, handling, 401, 403, 404
---

All errors extend `SnackBaseError`. The HTTP layer automatically converts error responses to typed exceptions.

## Error Hierarchy

```typescript
SnackBaseError (base)
├── AuthenticationError (401)    - Not retryable
├── AuthorizationError (403)     - Not retryable
├── NotFoundError (404)          - Not retryable
├── ConflictError (409)          - Not retryable
├── ValidationError (422)        - Not retryable, includes `fields`
├── RateLimitError (429)         - Retryable, includes `retryAfter`
├── NetworkError                 - Retryable
├── TimeoutError                 - Retryable
└── ServerError (500+)           - Retryable
```

## Handling Specific Errors

```typescript
import {
  SnackBaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  NetworkError
} from 'snackbase-js';

try {
  await client.users.get(userId);
} catch (error) {
  if (error instanceof AuthenticationError) {
    // 401 - Re-authenticate user
    await reauthenticate();
  } else if (error instanceof AuthorizationError) {
    // 403 - Show permission denied
    showMessage("You don't have access");
  } else if (error instanceof NotFoundError) {
    // 404 - Resource not found
    showMessage("User not found");
  } else if (error instanceof ValidationError) {
    // 422 - Show field errors
    console.error(error.fields);
    // { email: ['Invalid email format'], name: ['Required'] }
  } else if (error instanceof RateLimitError) {
    // 429 - Wait and retry
    await sleep(error.retryAfter * 1000);
    return retry();
  } else if (error instanceof NetworkError) {
    // Network issue - SDK will retry automatically
    showMessage("Network error, please check connection");
  } else if (error instanceof SnackBaseError) {
    console.error('SnackBase error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## ValidationError Details

The `ValidationError` includes a `fields` object with field-specific error messages:

```typescript
try {
  await client.users.create({ email: 'invalid' });
} catch (error) {
  if (error instanceof ValidationError) {
    // error.fields = {
    //   email: ['Invalid email format'],
    //   password: ['Password is required']
    // }

    Object.entries(error.fields).forEach(([field, messages]) => {
      console.log(`${field}: ${messages.join(', ')}`);
    });
  }
}
```

## Retry Behavior

The SDK automatically retries retryable errors with exponential backoff:

| Error Type | Retryable | Notes |
|------------|-----------|-------|
| AuthenticationError (401) | No | Token refresh attempted separately |
| AuthorizationError (403) | No | Permission denied, won't change |
| NotFoundError (404) | No | Resource doesn't exist |
| ConflictError (409) | No | State conflict, needs manual resolution |
| ValidationError (422) | No | Invalid input, needs correction |
| RateLimitError (429) | Yes | Uses `retryAfter` header |
| NetworkError | Yes | Exponential backoff |
| TimeoutError | Yes | Exponential backoff |
| ServerError (500+) | Yes | Exponential backoff |

### Manual Retry Pattern

```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof NetworkError && i < maxRetries - 1) {
        await sleep(2 ** i * 1000); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Token Refresh

The SDK's interceptors automatically handle 401 responses by refreshing tokens:

```typescript
// Automatic flow:
// 1. Request receives 401
// 2. Interceptor attempts token refresh
// 3. Original request retried with new token
// 4. If refresh fails, throws AuthenticationError
```

**Do not manually implement token refresh logic** - the SDK handles this.

## Rate Limiting

When rate limited, the error includes the `retryAfter` value:

```typescript
try {
  await client.records.list('tasks');
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
    await sleep(error.retryAfter * 1000);
    return retry();
  }
}
```

## Error Properties

All `SnackBaseError` instances include:

```typescript
interface SnackBaseError {
  message: string;       // Human-readable error message
  statusCode: number;    // HTTP status code
  code: string;          // Machine-readable error code
  details?: any;         // Additional error details
}
```

## Logging Errors

```typescript
try {
  await client.users.get(userId);
} catch (error) {
  if (error instanceof SnackBaseError) {
    console.error({
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      details: error.details
    });
  }
}
```

## Global Error Handler

Set up a global error handler for consistent error responses:

```typescript
function handleApiError(error: unknown): never {
  if (error instanceof ValidationError) {
    throw new FormError(error.fields);
  } else if (error instanceof AuthenticationError) {
    throw new AuthError('Please log in again');
  } else if (error instanceof AuthorizationError) {
    throw new AuthError('You do not have permission');
  } else if (error instanceof NotFoundError) {
    throw new NotFoundError('Resource not found');
  } else if (error instanceof SnackBaseError) {
    throw new ApiError(error.message);
  }
  throw error;
}
```
