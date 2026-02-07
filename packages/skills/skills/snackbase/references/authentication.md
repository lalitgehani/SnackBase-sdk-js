The SDK supports multiple authentication methods: email/password, OAuth, SAML, and API keys. Auth state is automatically managed and persisted to storage.

## Table of Contents

- [Email/Password Authentication](#emailpassword-authentication) (Login, Logout, Registration)
- [OAuth Flow](#oauth-flow) (Redirect, Callback)
- [SAML Flow](#saml-flow)
- [Session Management](#session-management) (Get State, Check Expiry)
- [Auth Events](#auth-events)
- [Password Reset](#password-reset) (Request, Complete)
- [Email Verification](#email-verification)
- [Dual Authentication](#dual-authentication) (API Key + JWT)

## Email/Password Authentication

### Login

```typescript
const result = await client.auth.login({
  email: 'user@example.com',
  password: 'password123'
});

console.log(result.user);      // User object
console.log(result.account);   // Account object
console.log(result.token);     // JWT token
console.log(result.expiresAt); // Expiry timestamp
```

### Logout

```typescript
await client.auth.logout();
// Auth state is cleared from storage
```

### Registration

```typescript
const result = await client.auth.register({
  email: 'newuser@example.com',
  password: 'SecurePassword123!',
  account_name: 'My Account'
});
```

## OAuth Flow

### Step 1: Redirect to OAuth Provider

```typescript
const authUrl = await client.auth.getOAuthUrl(
  'github', // or 'google', 'microsoft', 'apple'
  'https://myapp.com/auth/callback',
  crypto.randomUUID() // state for CSRF protection
);

window.location.href = authUrl;
```

### Step 2: Handle Callback

```typescript
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

if (code && state === expectedState) {
  const result = await client.auth.handleOAuthCallback({
    provider: 'github',
    code,
    redirectUri: 'https://myapp.com/auth/callback',
    state
  });

  // User is now logged in
  console.log(result.user);
}
```

## SAML Flow

```typescript
// Initiate SAML login
const authUrl = await client.auth.getSAMLUrl(
  'okta', // or 'azure_ad', 'generic_saml'
  'my-account', // account slug/ID
  'https://myapp.com/auth/saml/callback' // relayState (optional)
);

window.location.href = authUrl;
```

## Session Management

### Get Current State

```typescript
const state = client.auth.getState();

if (state?.isAuthenticated) {
  console.log('User:', state.user);
  console.log('Account:', state.account);
  console.log('Expires:', state.expiresAt);
}
```

### Check Session Expiry

```typescript
const state = client.auth.getState();
if (state) {
  const now = Date.now();
  const expiresAt = state.expiresAt ?? 0;

  if (now >= expiresAt) {
    console.log('Session expired');
  } else {
    const minutesLeft = Math.floor((expiresAt - now) / 1000 / 60);
    console.log(`Session valid for ${minutesLeft} minutes`);
  }
}
```

## Auth Events

Listen to authentication state changes:

```typescript
// Login
client.auth.on('auth:login', (state) => {
  console.log('User logged in:', state.user);
  router.push('/dashboard');
});

// Logout
client.auth.on('auth:logout', () => {
  console.log('User logged out');
  router.push('/login');
});

// Token refresh (automatic)
client.auth.on('auth:refresh', (state) => {
  console.log('Token refreshed');
});

// Errors
client.auth.on('auth:error', (error) => {
  console.error('Auth error:', error);
});

// Clean up listeners
const handleLogin = (state) => console.log('Logged in');
client.auth.on('auth:login', handleLogin);
// Later: client.auth.off('auth:login', handleLogin);
```

## Password Reset

### Request Reset

```typescript
await client.auth.forgotPassword({ email: 'user@example.com' });
```

### Complete Reset

```typescript
await client.auth.resetPassword({
  token: 'reset_token_from_email',
  newPassword: 'NewPassword123!',
  newPasswordConfirm: 'NewPassword123!'
});
```

## Email Verification

```typescript
await client.auth.verifyEmail('verification_token');
```

## Dual Authentication

The SDK supports both API Key and JWT authentication:

- **API Key** - Added via `X-API-Key` header to all requests (except user-specific OAuth/SAML operations)
- **JWT Token** - Added via `Authorization: Bearer` header when available
- Both can coexist as a fallback mechanism

```typescript
// Server-side: API Key only (server-to-server)
const client = new SnackBaseClient({
  baseUrl: process.env.SNACKBASE_URL!,
  apiKey: process.env.SNACKBASE_API_KEY
});

// Client-side: JWT authentication
const client = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev'
});
await client.auth.login({ email, password }); // JWT now available
```
