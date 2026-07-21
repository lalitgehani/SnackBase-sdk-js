The SDK supports email/password, OAuth, SAML, and API keys. Auth state is managed by interceptors and `AuthManager`.

Aligned with `AuthService` / `types/auth.ts` in `@snackbase/sdk` ≥ 0.6.0.

## Table of Contents

- [Email/Password](#emailpassword)
- [OAuth Flow](#oauth-flow)
- [SAML Flow](#saml-flow)
- [Session Helpers](#session-helpers)
- [Auth Events](#auth-events)
- [Password Reset](#password-reset)
- [Email Verification](#email-verification)
- [TokenType and Dual Auth](#tokentype-and-dual-auth)

## Email/Password

### Login

```typescript
const result = await client.auth.login({
  email: 'user@example.com',
  password: 'password123',
  account: 'my-account-slug', // optional multi-tenant account
});

// AuthResponse (snake_case and camelCase fields may both appear)
console.log(result.user);
console.log(result.account);
console.log(result.token);
console.log(result.refresh_token ?? result.refreshToken);
console.log(result.expires_in ?? result.expiresAt);
```

Also available as `client.login(credentials)`.

### Logout

```typescript
await client.auth.logout();
// or await client.logout();
```

### Registration

```typescript
const result = await client.auth.register({
  email: 'newuser@example.com',
  password: 'SecurePassword123!',
  account_name: 'My Account',
  account_slug: 'my-account',
});
```

## OAuth Flow

### Step 1: Authorization URL

`getOAuthUrl` returns `OAuthUrlResponse` (not a bare string):

```typescript
const { authorization_url, state, provider } = await client.auth.getOAuthUrl(
  'github', // 'google' | 'github' | 'microsoft' | 'apple'
  'https://myapp.com/auth/callback',
  crypto.randomUUID(),
);

window.location.href = authorization_url;
// store `state` for CSRF validation on callback
```

### Step 2: Callback

```typescript
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code')!;
const state = urlParams.get('state')!;

const result = await client.auth.handleOAuthCallback({
  provider: 'github',
  code,
  redirectUri: 'https://myapp.com/auth/callback',
  state,
});

console.log(result.user, result.isNewUser, result.isNewAccount);
```

## SAML Flow

```typescript
const { url } = await client.auth.getSAMLUrl(
  'okta', // 'okta' | 'azure_ad' | 'generic_saml'
  'my-account',
  'https://myapp.com/auth/saml/callback',
);

window.location.href = url;

// ACS callback
await client.auth.handleSAMLCallback({
  SAMLResponse: formSamlResponse,
  relayState: optionalRelay,
});
```

## Session Helpers

Prefer client getters (backed by `AuthManager`):

```typescript
if (client.isAuthenticated) {
  console.log(client.user);
  console.log(client.account);
  console.log(client.tokenType); // TokenType enum
  console.log(client.isSuperadmin);
  console.log(client.isApiKeySession);
  console.log(client.isPersonalTokenSession);
  console.log(client.isOAuthSession);
}

const me = await client.auth.getCurrentUser();
// or await client.getCurrentUser();
```

```typescript
enum TokenType {
  JWT = 'jwt',
  API_KEY = 'api_key',
  PERSONAL_TOKEN = 'personal_token',
  OAUTH = 'oauth',
}
```

## Auth Events

Subscribe on the **client** (not `client.auth.on`):

```typescript
const unsubLogin = client.on('auth:login', (state) => {
  console.log('User logged in:', state.user, state.tokenType);
});

client.on('auth:logout', () => {
  console.log('User logged out');
});

client.on('auth:refresh', (state) => {
  console.log('Token refreshed', state.expiresAt);
});

client.on('auth:error', (error) => {
  console.error('Auth error:', error);
});

// unsubLogin() to remove
```

## Password Reset

```typescript
await client.auth.forgotPassword({
  email: 'user@example.com',
  account: 'my-account', // optional
});

const check = await client.auth.verifyResetToken(token);
// { valid, expires_at }

await client.auth.resetPassword({
  token: 'reset_token_from_email',
  new_password: 'NewPassword123!', // snake_case field
});
```

## Email Verification

```typescript
await client.auth.verifyEmail('verification_token');
await client.auth.resendVerificationEmail();
await client.auth.sendVerification('user@example.com');
```

`EmailVerificationRequiredError` may be thrown when a verified email is required.

## TokenType and Dual Auth

- **API Key** — `X-API-Key` from config `apiKey` (format `sb_ak...`)
- **JWT** — `Authorization: Bearer` when logged in
- Both can coexist; OAuth/SAML user flows restrict pure API-key sessions (`ApiKeyRestrictedError`)

```typescript
// Server-to-server
const client = new SnackBaseClient({
  baseUrl: process.env.SNACKBASE_URL!,
  apiKey: process.env.SNACKBASE_API_KEY, // sb_ak...
});

// Browser user session
const browser = new SnackBaseClient({
  baseUrl: 'https://your-project.snackbase.dev',
});
await browser.auth.login({ email, password });
```
