---
name: snackbase-sdk
description: >
  SnackBase JavaScript/TypeScript SDK patterns, best practices, and API reference.
  Use when working with the SnackBase-js client library (@snackbase/sdk) for any of
  these tasks: (1) Initializing SnackBaseClient with configuration options,
  (2) Implementing authentication flows (email/password, OAuth, SAML, API keys),
  (3) Performing CRUD operations on collections or records,
  (4) Uploading or downloading files, (5) Managing webhooks and event handling,
  (6) Handling SDK errors (AuthenticationError, ValidationError, RateLimitError, etc.),
  (7) Writing tests that mock HttpClient with Vitest,
  (8) Configuring storage backends (localStorage, sessionStorage, memory, AsyncStorage),
  (9) Adding new services to the SDK, or (10) Understanding the service architecture
  and HTTP interceptor patterns. Trigger on mentions of SnackBase, @snackbase/sdk,
  SnackBaseClient, or any SnackBase service name.
---

# SnackBase SDK

## Key Principles

1. Services always return `response.data`, never the full response object
2. Auth is handled by HTTP interceptors -- services never manage auth headers directly
3. Array query params are comma-joined: `fields: ['id', 'name']` becomes `?fields=id,name`
4. Filter objects are JSON stringified when passed as query params
5. Use `PATCH` for partial updates, `PUT` for full replacements

## Quick Start

```typescript
import { SnackBaseClient } from '@snackbase/sdk';

const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  apiKey: 'sk_test_xxx'
});

// Access services via getters
const users = await client.users.list();
const record = await client.records.get('posts', 'record_id');
```

## Reference Guides

| Task | Reference |
|------|-----------|
| Initialize client | [references/client.md](references/client.md) |
| Authenticate users | [references/authentication.md](references/authentication.md) |
| Manage collections | [references/collections.md](references/collections.md) |
| Query/create records | [references/records.md](references/records.md) |
| Handle errors | [references/errors.md](references/errors.md) |
| Upload/download files | [references/files.md](references/files.md) |
| Set up webhooks | [references/webhooks.md](references/webhooks.md) |
| Write tests (Vitest) | [references/testing.md](references/testing.md) |
| Configure storage | [references/storage.md](references/storage.md) |
| Full API reference | [references/api-reference.md](references/api-reference.md) |

## Service Architecture

All services follow a consistent constructor pattern with `HttpClient` dependency:

```typescript
export class ExampleService {
  constructor(private http: HttpClient) {}

  async list(params?: ListParams): Promise<ListResponse> {
    const response = await this.http.get<ListResponse>('/api/v1/resource', { params });
    return response.data; // Always unwrap response.data
  }
}
```

Exceptions:
- `AuthService` receives `http`, `authManager`, `apiKey`, and `defaultAccount`
- `FileService` receives `http`, `getBaseUrl()`, and `getToken()` functions

## Adding a New Service

1. Create type definitions in `src/types/[domain].ts` (entity, create, update, list params, list response interfaces)
2. Create service class in `src/core/[domain]-service.ts` with `HttpClient` constructor
3. Register in `src/core/client.ts`: import, add private property, instantiate in constructor, add public getter
4. Export types in `src/index.ts`
5. Add test file `src/core/[domain]-service.test.ts` following patterns in [references/testing.md](references/testing.md)
