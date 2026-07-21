All errors extend `SnackBaseError`. The HTTP layer converts error responses to typed exceptions.

Aligned with `core/errors.ts` in `@snackbase/sdk` ≥ 0.6.0.

## Error Hierarchy

```typescript
SnackBaseError (base)
├── AuthenticationError (401)              - Not retryable
├── AuthorizationError (403)               - Not retryable
├── ApiKeyRestrictedError                  - Not retryable (API key used where user session required)
├── EmailVerificationRequiredError         - Not retryable
├── NotFoundError (404)                    - Not retryable
├── ConflictError (409)                    - Not retryable
├── ValidationError (422)                  - Not retryable, includes field errors
├── RateLimitError (429)                   - Retryable, includes retryAfter
├── NetworkError                           - Retryable
├── TimeoutError                           - Retryable
└── ServerError (500+)                     - Retryable
```

## Handling Specific Errors

```typescript
import {
  SnackBaseError,
  AuthenticationError,
  AuthorizationError,
  ApiKeyRestrictedError,
  EmailVerificationRequiredError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  NetworkError,
} from '@snackbase/sdk';

try {
  await client.users.get(userId);
} catch (error) {
  if (error instanceof AuthenticationError) {
    await reauthenticate();
  } else if (error instanceof ApiKeyRestrictedError) {
    // Operation requires a user JWT session, not only an API key
    showMessage('Sign in with a user account');
  } else if (error instanceof EmailVerificationRequiredError) {
    showMessage('Verify your email to continue');
  } else if (error instanceof AuthorizationError) {
    showMessage("You don't have access");
  } else if (error instanceof NotFoundError) {
    showMessage('User not found');
  } else if (error instanceof ValidationError) {
    console.error(error.fields);
  } else if (error instanceof RateLimitError) {
    await sleep((error.retryAfter ?? 1) * 1000);
    return retry();
  } else if (error instanceof NetworkError) {
    showMessage('Network error, please check connection');
  } else if (error instanceof SnackBaseError) {
    console.error('SnackBase error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## ValidationError Details

```typescript
try {
  await client.users.create({ email: 'invalid' });
} catch (error) {
  if (error instanceof ValidationError) {
    // Field map of messages when provided by the server
    console.error(error.fields);
  }
}
```

## Retry Behavior

| Error | Retryable |
| ----- | --------- |
| AuthenticationError, AuthorizationError, ApiKeyRestrictedError, EmailVerificationRequiredError | No |
| NotFoundError, ConflictError, ValidationError | No |
| RateLimitError, NetworkError, TimeoutError, ServerError | Yes (HTTP client retries per config) |

## Rate Limiting

```typescript
try {
  await client.records.list('tasks');
} catch (error) {
  if (error instanceof RateLimitError) {
    const waitSec = error.retryAfter ?? 1;
    await new Promise((r) => setTimeout(r, waitSec * 1000));
  }
}
```

## Global Error Handlers

Configure on the client:

```typescript
const client = new SnackBaseClient({
  baseUrl: '...',
  onAuthError: (error) => {
    // 401 handling
  },
  onNetworkError: (error) => {},
  onRateLimitError: (error) => {},
});
```

## Logging Errors

```typescript
if (error instanceof SnackBaseError) {
  console.error({
    name: error.name,
    message: error.message,
    status: error.status,
    code: error.code,
  });
}
```
