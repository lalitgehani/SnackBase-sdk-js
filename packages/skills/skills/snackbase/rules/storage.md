---
name: storage
description: Storage configuration and platform-specific backends for auth state persistence
metadata:
  tags: storage, persistence, auth-state, localstorage, sessionstorage
---

The SDK provides platform-agnostic storage abstraction for persisting authentication state.

## Storage Backends

### MemoryStorage (Default for Node.js)

```typescript
const client = new SnackBaseClient({
  baseUrl: 'https://api.snackbase.app',
  apiKey: process.env.SNACKBASE_API_KEY, // Server-side only
  storage: 'memory'
});

// Auth state is lost when process exits
```

### LocalStorage (Default for Web)

```typescript
const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  storage: 'localStorage'
});

// Auth state persists across browser sessions
// Authenticate with JWT for user operations
await client.auth.login({ email, password });
```

### SessionStorage (Web)

```typescript
const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  storage: 'sessionStorage'
});

// Auth state is cleared when tab is closed
// Authenticate with JWT for user operations
await client.auth.login({ email, password });
```

### AsyncStorage (React Native)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  storage: AsyncStorage
});

// Persistent storage in React Native apps
// Authenticate with JWT for user operations
await client.auth.login({ email, password });
```

## Platform Auto-Detection

The SDK automatically selects the appropriate storage backend:

```typescript
// No storage specified - auto-detected
const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev'
});

// Browser -> localStorage
// React Native -> AsyncStorage (if installed)
// Node.js -> memory
```

## Custom Storage Backend

Implement the storage interface for custom backends:

```typescript
const customStorage: StorageBackend = {
  async getItem(key: string): Promise<string | null> {
    // Your implementation
    return await redis.get(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    // Your implementation
    await redis.set(key, value);
  },

  async removeItem(key: string): Promise<void> {
    // Your implementation
    await redis.del(key);
  }
};

const client = new SnackBaseClient({
  baseUrl: 'https://api.snackbase.app',
  storage: customStorage
});
```

## Storage Keys

The SDK uses these storage keys:

| Key | Content |
|-----|---------|
| `snackbase_auth` | Auth state (JSON string) |
| `snackbase_refresh` | Refresh token (if separate) |

## Clearing Storage

Manually clear stored auth state:

```typescript
// Clear auth state only
await client.auth.logout();

// Clear all storage (if using custom storage)
await storage.clear();
```

## Storage Best Practices

### Web Applications

```typescript
// Use localStorage for persistent sessions
const client = new SnackBaseClient({
  apiKey: apiKey,
  storage: 'localStorage'
});
```

### Public Kiosks/Terminals

```typescript
// Use sessionStorage for temporary sessions
const client = new SnackBaseClient({
  apiKey: apiKey,
  storage: 'sessionStorage'
});
```

### Server-Side Applications

```typescript
// Use memory storage (default for Node.js)
const client = new SnackBaseClient({
  apiKey: apiKey
  // storage: 'memory' // Explicit but optional
});
```

### React Native

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const client = new SnackBaseClient({
  apiKey: apiKey,
  storage: AsyncStorage
});
```

## Multi-Tab Synchronization

For web apps, use `storage` event to sync auth state across tabs:

```typescript
window.addEventListener('storage', (e) => {
  if (e.key === 'snackbase_auth') {
    const newState = JSON.parse(e.newValue || 'null');

    if (newState && !client.auth.getState()?.isAuthenticated) {
      // User logged in from another tab
      window.location.reload();
    } else if (!newState && client.auth.getState()?.isAuthenticated) {
      // User logged out from another tab
      window.location.href = '/login';
    }
  }
});
```

## SSR Considerations

When using the SDK with server-side rendering:

```typescript
// Server-side (Node.js)
import { SnackBaseClient } from 'snackbase-js';

const serverClient = new SnackBaseClient({
  baseUrl: process.env.SNACKBASE_URL!,
  apiKey: process.env.SNACKBASE_API_KEY,
  storage: 'memory' // Explicitly use memory on server
});

// Client-side (Browser)
const browserClient = new SnackBaseClient({
  baseUrl: process.env.NEXT_PUBLIC_SNACKBASE_URL!,
  storage: 'localStorage'
});

// Authenticate browser client with JWT
await browserClient.auth.login({ email, password });
```

## Storage Interface

```typescript
interface StorageBackend {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
```
