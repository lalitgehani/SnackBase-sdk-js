# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SnackBase-js is a JavaScript/TypeScript SDK for the SnackBase API. It provides a type-safe, service-oriented architecture for interacting with SnackBase's REST API and real-time WebSocket/SSE endpoints.

## Common Commands

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

The project uses:
- **tsdown** for bundling (TypeScript-first bundler)
- **Vitest** for testing
- **TypeScript** with strict mode enabled

Build outputs:
- `dist/index.js` - CommonJS
- `dist/index.mjs` - ES Modules
- `dist/index.d.ts` - TypeScript definitions

## Architecture

### Service-Oriented Pattern

The SDK follows a centralized service registration pattern. The `SnackBaseClient` class (in `src/core/client.ts`) is the main entry point that:

1. Validates and merges configuration
2. Creates the HTTP client with interceptors
3. Creates the AuthManager for state management
4. Instantiates all 16+ services with their dependencies

Services are exposed via getter properties (e.g., `client.auth`, `client.users`, `client.collections`).

### Service Constructor Patterns

Most services use a simple constructor with `HttpClient` dependency:

```typescript
export class UserService {
  constructor(private http: HttpClient) {}
}
```

Some services have additional dependencies:
- `AuthService` receives `http`, `authManager`, `apiKey`, and `defaultAccount`
- `FileService` receives `http`, `getBaseUrl()`, and `getToken()` functions for dynamic access

### HTTP Layer

The `HttpClient` class wraps the fetch API with:
- **Request interceptors**: Content-Type injection, auth header injection
- **Response interceptors**: Error normalization, token refresh
- **Error interceptors**: Network error wrapping
- **Retry logic**: Exponential backoff for retryable errors

All service methods unwrap `response.data` before returning:

```typescript
async get(userId: string): Promise<User> {
  const response = await this.http.get<User>(`/api/v1/users/${userId}`);
  return response.data;  // Always unwrap response.data
}
```

### Error Hierarchy

All errors extend `SnackBaseError` (in `src/core/errors.ts`):
- `AuthenticationError` (401) - not retryable
- `AuthorizationError` (403) - not retryable
- `NotFoundError` (404) - not retryable
- `ConflictError` (409) - not retryable
- `ValidationError` (422) - not retryable, includes `fields` object
- `RateLimitError` (429) - retryable, includes `retryAfter`
- `NetworkError` - retryable
- `TimeoutError` - retryable
- `ServerError` (500+) - retryable

The `errorNormalizationInterceptor` in `src/core/interceptors.ts` converts HTTP error responses to typed exceptions.

### Dual Authentication

The SDK supports both JWT token and API Key authentication:
- API Key is added via `X-API-Key` header to all requests EXCEPT user-specific operations (OAuth/SAML)
- JWT token is added via `Authorization: Bearer` header when available
- API Key and JWT can coexist (fallback mechanism)

### Storage Abstraction

Platform-agnostic storage interface (`src/core/storage.ts`):
- `MemoryStorage` - In-memory Map
- `LocalStorageBackend` - Web localStorage
- `SessionStorageBackend` - Web sessionStorage
- `asyncStorage` - React Native (placeholder, falls back to memory)

Platform auto-detection in `src/utils/platform.ts` selects the default storage backend.

### Auth State Management

`AuthManager` class (`src/core/auth.ts`):
- Manages `AuthState` (user, account, token, refreshToken, isAuthenticated, expiresAt)
- Persists state to configured storage backend
- Emits type-safe events via `AuthEventEmitter` (`auth:login`, `auth:logout`, `auth:refresh`, `auth:error`)
- Validates session expiry on initialization

### Type System

Type definitions are organized by domain in `src/types/`:
- `config.ts` - Client configuration options and defaults
- `auth.ts` - Authentication types (User, Account, AuthState, OAuth, SAML)
- `user.ts` - User CRUD types
- `collection.ts` - Collection/schema types
- `record.ts` - Dynamic record types with generics
- Plus 12+ additional domain-specific type files

### Dynamic Record Service

The `RecordService` uses generics for type-safe dynamic collections:

```typescript
async list<T = any>(collection: string, params?: RecordListParams): Promise<RecordListResponse<T>>
async get<T = any>(collection: string, recordId: string): Promise<T & BaseRecord>
```

### Testing Conventions

Tests use Vitest with consistent patterns:
- Mock `HttpClient` with `vi.fn()`
- Use `describe` blocks for method grouping
- `beforeEach` for fresh service instances
- Verify HTTP calls with correct endpoints and parameters
- Assert that `response.data` is returned

## Adding a New Service

When adding a new service:

1. Create type definitions in `src/types/[domain].ts` following the pattern:
   - Entity interface (e.g., `Foo`)
   - Create interface (e.g., `FooCreate`)
   - Update interface (e.g., `FooUpdate`)
   - List params interface (e.g., `FooListParams`)
   - List response interface (e.g., `FooListResponse`)

2. Create service class in `src/core/[domain]-service.ts`:
   ```typescript
   export class FooService {
     constructor(private http: HttpClient) {}

     async list(params?: FooListParams): Promise<FooListResponse> {
       const response = await this.http.get<FooListResponse>('/api/v1/foos', { params });
       return response.data;
     }
     // ... other CRUD methods
   }
   ```

3. Add to `src/core/client.ts`:
   - Import the service
   - Add private property
   - Instantiate in constructor
   - Add public getter

4. Export types in `src/index.ts`

5. Add test file `src/core/[domain]-service.test.ts`

## Export Pattern

The `src/index.ts` file re-exports all types and the main client:

```typescript
export * from './core/client';
export * from './types/config';
export * from './types/auth';
// ... other type exports
```

Note: `macro.ts` types exist in `src/types/` but are not exported in `src/index.ts` - this may be intentional or an oversight.

## Key Implementation Notes

- Services should NOT handle authentication directly - the HTTP layer's interceptors handle auth headers
- Always return `response.data` from service methods, not the full response
- Use `PATCH` for partial updates and `PUT` for full replacements
- Array query parameters (like `fields`, `expand`) should be joined with commas: `Array.isArray(x) ? x.join(',') : x`
- Filter objects should be JSON stringified when passed as query params
- File uploads use FormData with `Content-Type: undefined` to let browser set the boundary
