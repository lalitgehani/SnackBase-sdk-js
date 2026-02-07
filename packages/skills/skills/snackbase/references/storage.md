The SDK provides platform-agnostic storage abstraction for persisting authentication state.

## Table of Contents

- [Storage Backends](#storage-backends) (Memory, LocalStorage, SessionStorage, AsyncStorage)
- [Platform Auto-Detection](#platform-auto-detection)
- [Custom Storage Backend](#custom-storage-backend)
- [Storage Interface](#storage-interface)
- [Storage Keys](#storage-keys)
- [Clearing Storage](#clearing-storage)
- [Multi-Tab Synchronization](#multi-tab-synchronization)
- [SSR Considerations](#ssr-considerations)

## Storage Backends

### MemoryStorage (Default for Node.js)

```typescript
import { MemoryStorage } from '@snackbase/sdk';

const client = new SnackBaseClient({
  baseUrl: 'https://api.snackbase.app',
  apiKey: process.env.SNACKBASE_API_KEY, // Server-side only
  storageBackend: new MemoryStorage()
});

// Auth state is lost when process exits
```

### LocalStorage (Default for Web)

```typescript
import { LocalStorageBackend } from '@snackbase/sdk';

const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  storageBackend: new LocalStorageBackend()
});

// Auth state persists across browser sessions
// Authenticate with JWT for user operations
await client.auth.login({ email, password });
```

### SessionStorage (Web)

```typescript
import { SessionStorageBackend } from '@snackbase/sdk';

const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  storageBackend: new SessionStorageBackend()
});

// Auth state is cleared when tab is closed
// Authenticate with JWT for user operations
await client.auth.login({ email, password });
```

### AsyncStorage (React Native)

```typescript
import { AsyncStorage } from '@react-native-async-storage/async-storage';

const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  storageBackend: AsyncStorage
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
import type { Storage } from '@snackbase/sdk';

const customStorage: Storage = {
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
  storageBackend: customStorage
});
```

## Storage Interface

```typescript
interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
```

## Storage Keys

The SDK uses these storage keys:

| Key | Content |
|-----|---------|
| `snackbase_auth` | Auth state (JSON string) |

## Clearing Storage

Manually clear stored auth state:

```typescript
// Clear auth state only
await client.auth.logout();
```

## Multi-Tab Synchronization

For web apps, use `storage` event to sync auth state across tabs:

```typescript
window.addEventListener('storage', (e) => {
  if (e.key === 'snackbase_auth') {
    const newState = JSON.parse(e.newValue || 'null');

    if (newState && !client.isAuthenticated) {
      // User logged in from another tab
      window.location.reload();
    } else if (!newState && client.isAuthenticated) {
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
import { SnackBaseClient, MemoryStorage } from '@snackbase/sdk';

const serverClient = new SnackBaseClient({
  baseUrl: process.env.SNACKBASE_URL!,
  apiKey: process.env.SNACKBASE_API_KEY,
  storageBackend: new MemoryStorage()
});

// Client-side (Browser)
import { SnackBaseClient, LocalStorageBackend } from '@snackbase/sdk';

const browserClient = new SnackBaseClient({
  baseUrl: process.env.NEXT_PUBLIC_SNACKBASE_URL!,
  storageBackend: new LocalStorageBackend()
});

// Authenticate browser client with JWT
await browserClient.auth.login({ email, password });
```
