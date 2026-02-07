---
name: client
description: Client initialization, configuration, and setup for SnackBase SDK
metadata:
  tags: client, initialization, configuration, setup
---

The `SnackBaseClient` is the main entry point for the SDK. It validates configuration, creates the HTTP client with interceptors, manages authentication state, and instantiates all services.

## Basic Initialization

```typescript
import { SnackBaseClient } from 'snackbase-js';

const client = new SnackBaseClient({
  apiKey: 'sk_test_xxx'
});
```

## Configuration Options

### Server-side (Node.js)

```typescript
const client = new SnackBaseClient({
  apiKey: process.env.SNACKBASE_API_KEY,
  baseUrl: 'https://api.snackbase.app', // Optional, defaults to production
  timeout: 30000, // Optional, request timeout in ms
  storage: 'memory' // Optional, defaults to memory for non-browser
});
```

### Client-side (Browser)

```typescript
const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  storage: 'localStorage' // or 'sessionStorage' or 'memory'
});

// Authenticate with JWT for user-specific operations
await client.auth.login({ email, password });
```

### React Native

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  storage: AsyncStorage
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
import { SnackBaseClient } from 'snackbase-js';

export const client = new SnackBaseClient({
  apiKey: process.env.SNACKBASE_API_KEY!
});
```
