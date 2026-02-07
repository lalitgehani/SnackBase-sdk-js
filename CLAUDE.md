# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SnackBase-js is a **pnpm monorepo** containing the JavaScript/TypeScript SDK ecosystem for SnackBase API. It provides type-safe, service-oriented architecture for interacting with SnackBase's REST API and real-time WebSocket/SSE endpoints.

### Package Structure

| Package | Location | Purpose | Exports |
|---------|----------|---------|---------|
| **@snackbase/sdk** | `packages/sdk/` | Core SDK with 17+ services | CJS, ESM, TypeScript definitions |
| **@snackbase/react** | `packages/react/` | React hooks and context | CJS, ESM, TypeScript definitions |
| **@snackbase/skills** | `packages/skills/` | Claude AI skills (non-publishable utility) | Skill definitions for Claude Code |
| **@snackbase/tsconfig** | `packages/tsconfig/` | Shared TypeScript configuration | Base tsconfig for all packages |

### Common Commands

```bash
# Package manager: pnpm ONLY (not npm or yarn)
pnpm install               # Install all dependencies

# Development (runs sdk + react in watch mode)
pnpm dev                   # Watch mode for all packages

# Building
pnpm build                 # Build all packages (sdk + react)

# Testing
pnpm test                  # Run all tests (unit + integration)
pnpm test:watch            # Run tests in watch mode
pnpm test:unit             # Run unit tests only (sdk + react)
pnpm test:integration      # Run integration tests only (sdk)

# Type checking & linting
pnpm typecheck             # Run TypeScript type checking
pnpm lint                  # Run ESLint

# Clean
pnpm clean                 # Remove all dist and node_modules
```

### Per-Package Commands

All packages support these commands (run from package directory or use `pnpm --filter`):

```bash
# From root
pnpm --filter @snackbase/sdk build
pnpm --filter @snackbase/react dev

# From package directory (e.g., packages/sdk/)
pnpm dev                   # Watch mode build
pnpm build                 # Production build
pnpm test                  # Run package tests
pnpm typecheck             # Type check only
```

### Build System

- **Bundler**: tsdown (TypeScript-first bundler)
- **Test runner**: Vitest with workspace configuration
- **Output formats**: CommonJS (.cjs), ES Modules (.mjs), TypeScript definitions (.d.cts, .d.mts)

Build outputs are in `packages/*/dist/` (gitignored).

## Architecture

### Monorepo Configuration

The workspace is configured via `pnpm-workspace.yaml`:
- Packages are in `packages/*`
- Workspace dependencies use `workspace:*` protocol
- Shared TypeScript config via `@snackbase/tsconfig`

### SDK Package (`@snackbase/sdk`)

**Service-Oriented Pattern**:
The `SnackBaseClient` class (in `packages/sdk/src/core/client.ts`) is the main entry point that:

1. Validates and merges configuration
2. Creates the HTTP client with interceptors
3. Creates the AuthManager for state management
4. Instantiates all 17+ services with their dependencies

Services are exposed via getter properties (e.g., `client.auth`, `client.users`, `client.collections`).

**Service List** (17 total):
- `auth` - Authentication and user management
- `users` - User CRUD operations
- `accounts` - Account management
- `collections` - Collection/schema management
- `records` - Dynamic record operations with generics
- `groups` - Group management
- `invitations` - User invitations
- `apiKeys` - API key management
- `auditLogs` - Audit log access
- `roles` - Role-based access control
- `collectionRules` - Collection-level access rules
- `macros` - Macro operations
- `dashboard` - Dashboard metrics
- `admin` - Admin operations
- `emailTemplates` - Email template management
- `files` - File upload/download
- `realtime` - Real-time subscriptions (WebSocket/SSE)
- `migrations` - Migration management

**Service Constructor Patterns**:
Most services use a simple constructor with `HttpClient` dependency:

```typescript
export class UserService {
  constructor(private http: HttpClient) {}
}
```

Exceptions:
- `AuthService` receives `http`, `authManager`, `apiKey`, and `defaultAccount`
- `FileService` receives `http`, `getBaseUrl()`, and `getToken()` functions for dynamic access

**HTTP Layer** (`packages/sdk/src/core/http-client.ts`):
Wraps fetch API with:
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

**Error Hierarchy** (`packages/sdk/src/core/errors.ts`):
All errors extend `SnackBaseError`:
- `AuthenticationError` (401) - not retryable
- `AuthorizationError` (403) - not retryable
- `NotFoundError` (404) - not retryable
- `ConflictError` (409) - not retryable
- `ValidationError` (422) - not retryable, includes `fields` object
- `RateLimitError` (429) - retryable, includes `retryAfter`
- `NetworkError` - retryable
- `TimeoutError` - retryable
- `ServerError` (500+) - retryable

**Dual Authentication**:
- API Key via `X-API-Key` header (all requests EXCEPT user-specific OAuth/SAML)
- JWT token via `Authorization: Bearer` header (when available)
- Both can coexist as fallback mechanism

**Storage Abstraction** (`packages/sdk/src/core/storage.ts`):
Platform-agnostic storage interface with auto-detection:
- `MemoryStorage` - In-memory Map
- `LocalStorageBackend` - Web localStorage
- `SessionStorageBackend` - Web sessionStorage
- `asyncStorage` - React Native (placeholder, falls back to memory)

**Auth State Management** (`packages/sdk/src/core/auth.ts`):
`AuthManager` class:
- Manages `AuthState` (user, account, token, refreshToken, isAuthenticated, expiresAt)
- Persists state to configured storage backend
- Emits type-safe events via `AuthEventEmitter` (`auth:login`, `auth:logout`, `auth:refresh`, `auth:error`)
- Validates session expiry on initialization

**Type System** (`packages/sdk/src/types/`):
Type definitions organized by domain:
- `config.ts` - Client configuration options and defaults
- `auth.ts` - Authentication types (User, Account, AuthState, OAuth, SAML)
- `user.ts` - User CRUD types
- `collection.ts` - Collection/schema types
- `record.ts` - Dynamic record types with generics
- Plus 12+ additional domain-specific type files

**Dynamic Record Service**:
Uses generics for type-safe dynamic collections:

```typescript
async list<T = any>(collection: string, params?: RecordListParams): Promise<RecordListResponse<T>>
async get<T = any>(collection: string, recordId: string): Promise<T & BaseRecord>
```

### React Package (`@snackbase/react`)

**Context Provider** (`packages/react/src/SnackBaseContext.tsx`):
- `SnackBaseProvider` - Wraps app and provides client instance
- `useSnackBase` - Access client from context

**Hooks** (`packages/react/src/hooks/`):
- `useAuth` - Authentication state and methods (login, logout, register)
- `useQuery` - Generic query hook with loading/error states
- `useRecord` - Specialized hook for record operations
- `useMutation` - Mutation hook with optimistic updates
- `useSubscription` - Real-time subscription management

Peer dependencies: React >=18

### Testing

**Test Organization** (via `vitest.workspace.ts`):
- **sdk project**: Unit tests in `packages/sdk/src/**/*.test.ts` (Node environment)
- **react project**: Unit tests in `packages/react/src/**/*.test.{ts,tsx}` (jsdom environment)
- **integration project**: Integration tests in `packages/sdk/tests/integration/**/*.test.ts`

**Integration Tests**:
- Run sequentially (not in parallel) to avoid SQLite database locking
- Use `packages/sdk/tests/integration/setup.ts` for test utilities
- Require SnackBase backend running at `http://localhost:8090` (configurable via `SNACKBASE_URL`)
- Optional `SNACKBASE_API_KEY` for admin operations

**Test Utilities** (`packages/sdk/tests/integration/setup.ts`):
- `createTestClient()` - Create test SDK instance
- `createTestEmail()` - Generate unique test email
- `trackUser()`, `trackCollection()`, `trackRecord()` - Register resources for cleanup
- `cleanupTestResources()` - Cleanup tracked resources after tests
- `waitFor()` - Wait for async conditions
- `retry()` - Retry with exponential backoff

**Testing Conventions**:
- Mock `HttpClient` with `vi.fn()`
- Use `describe` blocks for method grouping
- `beforeEach` for fresh service instances
- Verify HTTP calls with correct endpoints and parameters
- Assert that `response.data` is returned

## Adding a New Service

When adding a new service to the SDK:

1. **Create type definitions** in `packages/sdk/src/types/[domain].ts`:
   - Entity interface (e.g., `Foo`)
   - Create interface (e.g., `FooCreate`)
   - Update interface (e.g., `FooUpdate`)
   - List params interface (e.g., `FooListParams`)
   - List response interface (e.g., `FooListResponse`)

2. **Create service class** in `packages/sdk/src/core/[domain]-service.ts`:
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

3. **Add to `SnackBaseClient`** in `packages/sdk/src/core/client.ts`:
   - Import the service
   - Add private property
   - Instantiate in constructor
   - Add public getter

4. **Export types** in `packages/sdk/src/index.ts`

5. **Add test file** `packages/sdk/src/core/[domain]-service.test.ts`

## Export Pattern

The `packages/sdk/src/index.ts` file re-exports all types and the main client:

```typescript
export * from './core/client';
export * from './types/config';
export * from './types/auth';
// ... other type exports
```

Note: `macro.ts` and `account.ts` types exist in `packages/sdk/src/types/` but are not exported in `packages/sdk/src/index.ts` - this may be intentional or an oversight.

## Key Implementation Notes

- **Package manager**: Use pnpm exclusively (NOT npm or yarn)
- **Service authentication**: Services should NOT handle authentication directly - the HTTP layer's interceptors handle auth headers
- **Response unwrapping**: Always return `response.data` from service methods, not the full response
- **HTTP methods**: Use `PATCH` for partial updates and `PUT` for full replacements
- **Query parameters**: Array query parameters (like `fields`, `expand`) should be joined with commas: `Array.isArray(x) ? x.join(',') : x`
- **Filtering**: Filter objects should be JSON stringified when passed as query params
- **File uploads**: Use FormData with `Content-Type: undefined` to let browser set the boundary
- **Workspace dependencies**: Use `workspace:*` protocol for internal package dependencies

## Publishing

All packages configured with `publishConfig.access: "public"` for npm publishing:
- `@snackbase/sdk` - v0.2.0
- `@snackbase/react` - v0.2.0
- `@snackbase/skills` - v0.0.0 (utility package, can be published but optional)

Build outputs (in `dist/`) are gitignored but included in npm packages via `files` field.
