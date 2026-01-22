# Authentication Guide

This guide covers all authentication methods available in the SnackBase SDK.

## Overview

SnackBase supports multiple authentication methods:

- **Email/Password** - Traditional authentication
- **OAuth** - Social login (Google, GitHub, Facebook, etc.)
- **SAML** - Enterprise SSO
- **API Keys** - Server-to-server authentication

## Email/Password Authentication

### Registration

```typescript
import { SnackBaseClient } from "@snackbase/sdk";

const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
});

// Register a new user
const authState = await client.auth.register({
  email: "user@example.com",
  password: "securepassword123",
  passwordConfirm: "securepassword123",
  name: "John Doe",
});

console.log("Registered:", authState.user);
console.log("Token:", authState.token);
```

### Login

```typescript
// Login with email and password
const authState = await client.auth.login({
  email: "user@example.com",
  password: "securepassword123",
  account: "account-id", // Optional for multi-account projects
});
```

### Logout

```typescript
// Logout and clear authentication state
await client.auth.logout();
```

### Password Management

#### Forgot Password

```typescript
// Initiate password reset
await client.auth.forgotPassword({
  email: "user@example.com",
});

// User receives an email with reset token
```

#### Reset Password

```typescript
// Reset password with token from email
await client.auth.resetPassword({
  token: "reset-token-from-email",
  password: "newpassword123",
  passwordConfirm: "newpassword123",
});
```

#### Change Password (Authenticated)

```typescript
// Change password while logged in
await client.auth.changePassword({
  oldPassword: "oldpassword123",
  newPassword: "newpassword123",
  newPasswordConfirm: "newpassword123",
});
```

### Email Verification

```typescript
// Verify email with token
await client.auth.verifyEmail("verification-token-from-email");

// Resend verification email
await client.auth.resendVerificationEmail();
```

## OAuth Authentication

OAuth allows users to sign in with their existing social accounts.

### Setup

1. Configure OAuth providers in your SnackBase dashboard
2. Add your redirect URL to the allowed callbacks
3. Implement the OAuth flow in your app

### OAuth Flow

```typescript
// Step 1: Redirect user to OAuth provider
// This is typically done via browser redirect, not directly in the SDK

// Step 2: Handle the callback
const authState = await client.auth.authenticateWithOAuth({
  provider: "google", // or 'github', 'facebook', etc.
  code: "authorization-code-from-callback",
  redirectUrl: "https://your-app.com/auth/callback",
  codeVerifier: "pkce-code-verifier", // For PKCE flow
  account: "account-id", // Optional for multi-account projects
});
```

### Example: React OAuth Implementation

```tsx
import { useEffect } from "react";
import { useAuth } from "@snackbase/sdk/react";

function OAuthCallback() {
  const { client } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (code) {
        await client.auth.authenticateWithOAuth({
          provider: "google",
          code,
          redirectUrl: window.location.origin + "/auth/callback",
        });

        // Redirect back to app
        window.location.href = "/";
      }
    };

    handleCallback();
  }, [client]);

  return <div>Processing login...</div>;
}
```

### Example: PKCE Flow (More Secure)

```typescript
// Generate code verifier and challenge
function generatePKCE() {
  const codeVerifier = base64UrlEncode(cryptoRandomBytes(32));
  const codeChallenge = base64UrlEncode(sha256(codeVerifier));
  return { codeVerifier, codeChallenge };
}

// Start OAuth flow
const { codeVerifier, codeChallenge } = generatePKCE();
const authUrl = `https://your-project.snackbase.dev/api/v1/oauth/google?code_challenge=${codeChallenge}`;

window.location.href = authUrl;

// Handle callback
const authState = await client.auth.authenticateWithOAuth({
  provider: "google",
  code: urlParams.get("code"),
  codeVerifier,
  redirectUrl: window.location.origin + "/auth/callback",
});
```

## SAML Authentication

SAML provides enterprise single sign-on (SSO) capabilities.

### Setup

1. Configure SAML in your SnackBase dashboard
2. Upload your IdP metadata
3. Configure the ACS URL

### Generate SAML URL

```typescript
const response = await client.auth.getSAMLUrl(
  "okta", // SAML provider name
  "account-id", // Account ID
  "/dashboard", // Optional relay state (redirect after login)
);

console.log("SAML URL:", response.url);

// Redirect user to SAML URL
window.location.href = response.url;
```

### Handle SAML Callback

```typescript
// After SAML authentication, user is redirected back
const urlParams = new URLSearchParams(window.location.search);

const authState = await client.auth.handleSAMLCallback({
  account: urlParams.get("account"),
  code: urlParams.get("code"),
  relayState: urlParams.get("relayState") || undefined,
});
```

### Get SAML Metadata

```typescript
// Get metadata for your IdP configuration
const metadata = await client.auth.getSAMLMetadata(
  "okta", // SAML provider name
  "account-id",
);

console.log("Metadata URL:", metadata.metadataUrl);
```

## API Key Authentication

API keys are used for server-to-server authentication.

### Creating an API Key

1. Go to your SnackBase dashboard
2. Navigate to API Keys
3. Create a new key with appropriate permissions

### Using API Keys

```typescript
const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  apiKey: "your-api-key",
});

// All requests will include the API key
const users = await client.users.list();
```

### API Key vs JWT

| Feature     | API Key           | JWT Token             |
| ----------- | ----------------- | --------------------- |
| Use Case    | Server-to-server  | User authentication   |
| Permissions | Fixed scope       | Dynamic based on user |
| Expiration  | Manual revocation | Auto-expiration       |
| Storage     | Server-side       | Client-side           |
| Real-time   | Supported         | Supported             |

Both API keys and JWT tokens can coexist:

```typescript
// Initialize with API key for admin operations
const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  apiKey: "admin-api-key",
});

// User logs in and gets JWT token
await client.auth.login({ email, password });

// Admin operations use API key, user operations use JWT
```

## Authentication State Management

### Accessing Auth State

```typescript
// Check if authenticated
if (client.isAuthenticated) {
  console.log("Logged in as:", client.user);
  console.log("Account:", client.account);
}

// Get the current auth state
const authState = client.internalAuthManager.getState();
console.log("Token:", authState.token);
console.log("Expires at:", authState.expiresAt);
```

### Listening to Auth Events

```typescript
// Subscribe to login events
const unsubLogin = client.on("auth:login", (state) => {
  console.log("User logged in:", state.user);
});

// Subscribe to logout events
const unsubLogout = client.on("auth:logout", () => {
  console.log("User logged out");
});

// Subscribe to token refresh events
const unsubRefresh = client.on("auth:refresh", (state) => {
  console.log("Token refreshed");
});

// Subscribe to error events
const unsubError = client.on("auth:error", (error) => {
  console.error("Auth error:", error);
});

// Unsubscribe when done
unsubLogin();
unsubLogout();
```

### Token Storage

Tokens are automatically stored in the configured storage backend:

```typescript
import {
  MemoryStorage,
  LocalStorageBackend,
  SessionStorageBackend,
} from "@snackbase/sdk";

// Use in-memory storage (default for Node.js)
const client1 = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  storageBackend: MemoryStorage,
});

// Use localStorage (default for browsers)
const client2 = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  storageBackend: LocalStorageBackend,
});

// Use sessionStorage
const client3 = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  storageBackend: SessionStorageBackend,
});

// Custom storage implementation
const client4 = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  storageBackend: {
    getItem: async (key) => {
      /* ... */
    },
    setItem: async (key, value) => {
      /* ... */
    },
    removeItem: async (key) => {
      /* ... */
    },
  },
});
```

## Token Refresh

Tokens are automatically refreshed when they expire.

### Automatic Refresh

The SDK automatically refreshes tokens 5 minutes (default) before they expire:

```typescript
// Configure refresh timing
const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  refreshBeforeExpiry: 300, // 5 minutes before expiry
});
```

### Manual Refresh

```typescript
// Manually refresh the token
const authState = await client.auth.refreshToken();
console.log("New token:", authState.token);
```

## Multi-Account Projects

SnackBase supports multi-account projects where users can belong to multiple accounts.

### Specify Account on Login

```typescript
const authState = await client.auth.login({
  email: "user@example.com",
  password: "password",
  account: "account-id", // Specify account
});

console.log("Selected account:", authState.account);
```

### Set Default Account

```typescript
const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  defaultAccount: "default-account-id",
});

// All operations will use this account unless specified otherwise
```

## Security Best Practices

### 1. Store API Keys Securely

```typescript
// ✅ Good: Use environment variables
const client = new SnackBaseClient({
  baseUrl: process.env.SNACKBASE_URL,
  apiKey: process.env.SNACKBASE_API_KEY,
});

// ❌ Bad: Hardcode API keys
const client = new SnackBaseClient({
  baseUrl: "https://...",
  apiKey: "pk_live_abc123...", // Never hardcode!
});
```

### 2. Use HTTPS Only

```typescript
// ✅ Good: HTTPS
const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
});

// ❌ Bad: HTTP (insecure)
const client = new SnackBaseClient({
  baseUrl: "http://your-project.snackbase.dev",
});
```

### 3. Implement Proper Logout

```typescript
// Clear auth state on logout
async function handleLogout() {
  await client.auth.logout();
  // Redirect to login page
  window.location.href = "/login";
}
```

### 4. Handle Token Expiry

```typescript
client.on("auth:error", async (error) => {
  if (error.message.includes("token")) {
    // Token expired or invalid
    await client.auth.logout();
    window.location.href = "/login";
  }
});
```

### 5. Validate on App Start

```typescript
// Verify authentication state on app initialization
async function initializeApp() {
  const isAuthenticated = client.isAuthenticated;

  if (isAuthenticated) {
    try {
      // Verify token is still valid
      await client.auth.getCurrentUser();
    } catch (error) {
      // Token expired, clear state
      await client.auth.logout();
    }
  }
}
```

## React Integration

For React applications, use the provided hooks:

```tsx
import { useAuth } from "@snackbase/sdk/react";

function LoginPage() {
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      await login({ email, password });
      // Redirect to dashboard
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button disabled={loading}>Login</button>
      {error && <p>{error.message}</p>}
    </form>
  );
}
```

See the [React Integration Guide](./react-integration.md) for more details.

## Troubleshooting

### "Authentication failed" Error

- Verify email and password are correct
- Check if user is verified (email verification)
- Ensure account ID is correct for multi-account projects

### "Token expired" Error

- Tokens expire automatically after a period
- The SDK should refresh automatically
- If refresh fails, the user needs to log in again

### CORS Issues

- Ensure your app's domain is added to allowed origins
- Check that you're using HTTPS in production
- Verify the redirect URL matches exactly

### SAML Configuration Issues

- Verify IdP metadata is correctly uploaded
- Check the ACS URL matches your callback URL
- Ensure certificates are valid and not expired
