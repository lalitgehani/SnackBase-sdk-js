The SDK provides platform-agnostic storage for persisting authentication state via a **string** `storageBackend` config option.

Aligned with `SnackBaseConfig.storageBackend` in `@snackbase/sdk` ≥ 0.6.0:

```typescript
type StorageBackend = 'localStorage' | 'sessionStorage' | 'memory' | 'asyncStorage';
```

Do **not** pass class instances (`new MemoryStorage()`, `LocalStorageBackend`, raw AsyncStorage modules). The client maps the string to an internal implementation via `createStorageBackend()`.

## Table of Contents

- [Storage Backend Options](#storage-backend-options)
- [Platform Auto-Detection](#platform-auto-detection)
- [Examples](#examples)
- [Storage Keys](#storage-keys)
- [Clearing Storage](#clearing-storage)
- [Multi-Tab Synchronization](#multi-tab-synchronization)
- [SSR Considerations](#ssr-considerations)

## Storage Backend Options

| Value | Typical use |
| ----- | ----------- |
| `'memory'` | Node.js / server; state lost when process exits |
| `'localStorage'` | Browser; persists across sessions |
| `'sessionStorage'` | Browser; cleared when the tab closes |
| `'asyncStorage'` | React Native (AsyncStorage must be available in the environment) |

## Platform Auto-Detection

Omit `storageBackend` to auto-detect:

```typescript
const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
});
// Browser → localStorage; React Native → asyncStorage (if available); Node → memory
```

## Examples

### Node.js / server

```typescript
const client = new SnackBaseClient({
  baseUrl: 'https://api.snackbase.app',
  apiKey: process.env.SNACKBASE_API_KEY,
  storageBackend: 'memory',
});
```

### Browser (localStorage)

```typescript
const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  storageBackend: 'localStorage', // or omit for auto-detect
});

await client.auth.login({ email, password });
```

### Browser (sessionStorage)

```typescript
const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  storageBackend: 'sessionStorage',
});
```

### React Native

```typescript
const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
  storageBackend: 'asyncStorage',
});
```

## Storage Keys

| Key | Content |
| --- | ------- |
| `snackbase_auth` | Auth state (JSON string) |

## Clearing Storage

```typescript
await client.auth.logout(); // clears persisted auth state via the configured backend
```

## Multi-Tab Synchronization

```typescript
window.addEventListener('storage', (e) => {
  if (e.key === 'snackbase_auth') {
    const newState = JSON.parse(e.newValue || 'null');
    if (newState && !client.isAuthenticated) {
      window.location.reload();
    } else if (!newState && client.isAuthenticated) {
      window.location.href = '/login';
    }
  }
});
```

## SSR Considerations

```typescript
// Server
const serverClient = new SnackBaseClient({
  baseUrl: process.env.SNACKBASE_URL!,
  apiKey: process.env.SNACKBASE_API_KEY,
  storageBackend: 'memory',
});

// Browser
const browserClient = new SnackBaseClient({
  baseUrl: process.env.NEXT_PUBLIC_SNACKBASE_URL!,
  storageBackend: 'localStorage',
});

await browserClient.auth.login({ email, password });
```
