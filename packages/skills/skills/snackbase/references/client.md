The `SnackBaseClient` is the main entry point for the SDK. It validates configuration, creates the HTTP client with interceptors, manages authentication state, and instantiates all services.

Aligned with `SnackBaseClient` in `@snackbase/sdk` ≥ 0.6.0.

## Table of Contents

- [Basic Initialization](#basic-initialization)
- [Configuration Options](#configuration-options)
- [Account Scoping](#account-scoping)
- [Accessing Services](#accessing-services)
- [Auth State Getters](#auth-state-getters)
- [Environment Best Practices](#environment-best-practices)
- [Singleton Pattern](#singleton-pattern)

## Basic Initialization

```typescript
import { SnackBaseClient } from '@snackbase/sdk';

const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  apiKey: 'sb_ak....', // optional service key (format sb_ak.<payload>.<signature>)
});
```

## Configuration Options

### Server-side (Node.js)

```typescript
const client = new SnackBaseClient({
  baseUrl: 'https://api.snackbase.app', // required
  apiKey: process.env.SNACKBASE_API_KEY,
  timeout: 30000,
  storageBackend: 'memory',
});
```

### Client-side (Browser)

```typescript
const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  // storageBackend auto-detected (localStorage)
});

await client.auth.login({ email, password });
```

### React Native

```typescript
const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  storageBackend: 'asyncStorage',
});
```

### Full config keys (selected)

| Key | Purpose |
| --- | ------- |
| `baseUrl` | API base URL (required) |
| `apiKey` | Service authentication (`X-API-Key`) |
| `accountId` | Account ID/slug for **anonymous** public access (`X-Account-ID`) |
| `defaultAccount` | Default account for auth-scoped single-tenant operations |
| `timeout` / `maxRetries` / `retryDelay` | HTTP behavior |
| `enableAutoRefresh` / `refreshBeforeExpiry` | Token refresh |
| `storageBackend` | `localStorage` \| `sessionStorage` \| `memory` \| `asyncStorage` |
| `enableLogging` / `logLevel` | Client logging |
| `onAuthError` / `onNetworkError` / `onRateLimitError` | Error callbacks |
| `maxRealTimeRetries` / `realTimeReconnectionDelay` | Realtime reconnect |

## Account Scoping

```typescript
// Unauthenticated public collections (empty rule "")
const publicClient = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  accountId: 'AB1234', // sends X-Account-ID when no JWT is present
});

// Authenticated multi-tenant / single-tenant helper
const tenantClient = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  apiKey: process.env.SNACKBASE_API_KEY,
  defaultAccount: 'my-account-slug',
});
```

- `accountId` — anonymous / public collection scoping via `X-Account-ID`
- `defaultAccount` — legacy/single-tenant account hint for auth flows

## Accessing Services

There is **no** `client.permissions` or `PermissionService`. Use `client.collectionRules` for collection access rules.

```typescript
client.auth             // Authentication
client.users            // User management
client.accounts         // Account management
client.collections      // Collection schema
client.records          // Record CRUD
client.groups           // Groups
client.invitations      // Invitations
client.apiKeys          // API keys (/api/v1/admin/api-keys)
client.auditLogs        // Audit logs
client.roles            // Roles
client.collectionRules  // Collection rules (Permission System V2)
client.macros           // Macros
client.dashboard        // Superadmin dashboard stats
client.admin            // System/account configuration
client.emailTemplates   // Email templates
client.files            // File upload/download
client.realtime         // WebSocket realtime
client.migrations       // Migration status
client.webhooks         // Outbound webhooks
client.hooks            // Automation hooks
client.endpoints        // Custom HTTP endpoints
client.workflows        // Multi-step workflows
client.jobs             // Superadmin job queue
client.codelists        // First-class shared dictionaries (see codelists.md)
```

## Auth State Getters

```typescript
client.user                 // User | null
client.account              // Account | null
client.isAuthenticated      // boolean
client.isSuperadmin         // boolean
client.isApiKeySession      // boolean
client.isPersonalTokenSession
client.isOAuthSession
client.tokenType            // TokenType enum
client.getConfig()          // Required<SnackBaseConfig> copy
```

## Environment Best Practices

```typescript
// .env
SNACKBASE_API_KEY=sb_ak....
SNACKBASE_BASE_URL=https://api.snackbase.app
SNACKBASE_ACCOUNT_ID=AB1234

// client.ts
const client = new SnackBaseClient({
  apiKey: import.meta.env.SNACKBASE_API_KEY,
  baseUrl: import.meta.env.SNACKBASE_BASE_URL,
  accountId: import.meta.env.SNACKBASE_ACCOUNT_ID,
});
```

## Singleton Pattern

```typescript
// lib/snackbase.ts
import { SnackBaseClient } from '@snackbase/sdk';

export const client = new SnackBaseClient({
  baseUrl: process.env.SNACKBASE_URL!,
  apiKey: process.env.SNACKBASE_API_KEY,
});
```
