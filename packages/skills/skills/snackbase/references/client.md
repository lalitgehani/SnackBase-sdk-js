The `SnackBaseClient` is the main entry point for the SDK. It validates configuration, creates the HTTP client with interceptors, manages authentication state, and instantiates all services.

## Table of Contents

- [Basic Initialization](#basic-initialization)
- [Configuration Options](#configuration-options) (Server-side, Client-side, React Native, Multi-tenant)
- [Accessing Services](#accessing-services)
- [Environment Best Practices](#environment-best-practices)
- [Singleton Pattern](#singleton-pattern)

## Basic Initialization

```typescript
import { SnackBaseClient } from '@snackbase/sdk';

const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  apiKey: 'sk_test_xxx'
});
```

## Configuration Options

### Server-side (Node.js)

```typescript
const client = new SnackBaseClient({
  apiKey: process.env.SNACKBASE_API_KEY,
  baseUrl: 'https://api.snackbase.app', // Required
  timeout: 30000, // Optional, request timeout in ms (default: 30000)
  storageBackend: new MemoryStorage() // Optional, defaults to memory for Node.js
});
```

### Client-side (Browser)

```typescript
const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  // storageBackend is auto-detected (localStorage)
});

// Authenticate with JWT for user-specific operations
await client.auth.login({ email, password });
```

### React Native

```typescript
import { AsyncStorage } from '@react-native-async-storage/async-storage';

const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  storageBackend: AsyncStorage
});

// Authenticate with JWT
await client.auth.login({ email, password });
```

### With Default Account (Multi-tenant)

```typescript
const client = new SnackBaseClient({
  apiKey: 'sk_test_xxx',
  defaultAccount: 'acct_123' // Used for user-scoped operations
});
```

## Accessing Services

All services are exposed via properties on the client:

```typescript
client.auth      // Authentication
client.users     // User management
client.accounts  // Account management
client.collections // Collection operations
client.records   // Record operations
client.files     // File operations
client.webhooks  // Webhook management
client.auditLogs // Audit logs
client.permissions // Permission checks
```

## Environment Best Practices

```typescript
// .env file
SNACKBASE_API_KEY=sk_test_xxx
SNACKBASE_BASE_URL=https://api.snackbase.app

// client.ts
const client = new SnackBaseClient({
  apiKey: import.meta.env.SNACKBASE_API_KEY,
  baseUrl: import.meta.env.SNACKBASE_BASE_URL
});
```

## Singleton Pattern

For most applications, create a single client instance:

```typescript
// lib/snackbase.ts
import { SnackBaseClient } from '@snackbase/sdk';

export const client = new SnackBaseClient({
  baseUrl: process.env.SNACKBASE_URL!,
  apiKey: process.env.SNACKBASE_API_KEY
});
```
