# @snackbase/sdk

The official JavaScript/TypeScript client for the SnackBase API.

`@snackbase/sdk` provides a typed `SnackBaseClient` with authentication, account and
collection management, dynamic records, files, realtime subscriptions, automation, and
platform administration services.

## Install

```bash
npm install @snackbase/sdk
# or: pnpm add @snackbase/sdk
# or: yarn add @snackbase/sdk
```

The SDK works in browsers, React Native, and fetch-compatible server runtimes. Realtime
connections use WebSocket when available and fall back to Server-Sent Events.

## Quick start

```ts
import { SnackBaseClient } from '@snackbase/sdk';

const client = new SnackBaseClient({
  baseUrl: 'https://your-snackbase-instance.example.com',
  // Use an API key for server-side/service authentication when appropriate.
  apiKey: process.env.SNACKBASE_API_KEY,
});

const session = await client.auth.login({
  email: 'user@example.com',
  password: 'your-password',
});

console.log(session.user?.email);

type Post = {
  title: string;
  status: string;
};

const posts = await client.records.list<Post>('posts', {
  filter: 'status = "published"',
  sort: '-created_at',
  limit: 20,
});

const post = await client.records.create<Post>('posts', {
  title: 'Hello SnackBase',
  status: 'draft',
});
```

Keep API keys on trusted servers. Browser and mobile applications should normally use
user authentication and the SDK's token storage instead of embedding privileged keys.

## Configuration

```ts
const client = new SnackBaseClient({
  baseUrl: 'http://localhost:8000',
  storageBackend: 'localStorage', // memory, sessionStorage, or asyncStorage
  enableAutoRefresh: true,
  refreshBeforeExpiry: 300,
  timeout: 30_000,
  maxRetries: 3,
  accountId: 'AB1234', // anonymous public collection scope
});
```

`baseUrl` is required. Storage is auto-detected when `storageBackend` is omitted. Use
`accountId` only when accessing a public collection without a user token; it sends the
`X-Account-ID` header. `defaultAccount` is available for account-scoped auth flows.

## Authentication

The client exposes auth methods both under `client.auth` and, for common operations, on
the client itself:

```ts
await client.login({ email, password });
await client.register({ email, password, account_name: 'Acme' });
await client.refreshToken();
await client.getCurrentUser();
await client.logout();

client.user;             // User | null
client.account;          // Account | null
client.isAuthenticated;  // boolean
client.tokenType;        // TokenType
```

Email/password, OAuth, SAML, password reset, email verification, API-key, and personal
token flows are represented by the exported SDK types and auth services. Subscribe to
session changes with `client.on('auth:login', ...)`, `client.on('auth:refresh', ...)`,
`client.on('auth:logout', ...)`, and `client.on('auth:error', ...)`.

## Records and queries

Records are dynamic and can be typed with a generic:

```ts
const result = await client.records
  .query<Post>('posts')
  .select(['id', 'title'])
  .filter('status', '=', 'published')
  .sort('created_at', 'desc')
  .limit(20)
  .get();

await client.records.update('posts', post.id, { title: 'Replace fields' }); // PUT
await client.records.patch('posts', post.id, { status: 'published' });      // PATCH
await client.records.delete('posts', post.id);
```

`records.list()` accepts string filter expressions, field selection, expansion, offset
pagination, cursor pagination, and sorting. The service also provides `batchCreate`,
`batchUpdate`, `batchDelete`, and `aggregate`.

## Realtime

Realtime requires an authenticated session. Register handlers, connect, and subscribe to
the operations you need:

```ts
const off = client.realtime.on('posts.create', (record) => {
  console.log('Created:', record);
});

await client.realtime.connect();
await client.realtime.subscribe('posts', ['create', 'update', 'delete']);

// Later:
off();
await client.realtime.unsubscribe('posts');
client.realtime.disconnect();
```

Connection lifecycle events include `connecting`, `connected`, `disconnected`, `error`,
and `message`. Collection handlers receive the event data; the `message` event receives
the complete server message.

## Services

Services are available as properties on `SnackBaseClient`:

| Accessor | Purpose |
| --- | --- |
| `auth` | Authentication and user session flows |
| `accounts`, `users` | Account and user management |
| `collections`, `records` | Collection schemas and dynamic records |
| `codelists` | Shared dictionaries, effective values, and overrides |
| `groups`, `invitations`, `roles`, `collectionRules` | Access control and membership |
| `apiKeys`, `auditLogs` | API key and audit log administration |
| `macros`, `emailTemplates`, `migrations` | Platform utilities |
| `dashboard`, `admin` | Statistics and system configuration |
| `files` | Uploads, download URLs, and file deletion |
| `realtime` | WebSocket/SSE subscriptions |
| `webhooks`, `hooks`, `endpoints`, `workflows`, `jobs` | Automation and background jobs |

The package entry point re-exports the client, query builder, record/auth/codelist and
automation types, platform utilities, and typed SDK errors from `@snackbase/sdk`.

## Error handling

SDK requests reject with typed errors:

```ts
import {
  AuthenticationError,
  NetworkError,
  RateLimitError,
  SnackBaseError,
  ValidationError,
} from '@snackbase/sdk';

try {
  await client.records.create('posts', { title: 'Hello' });
} catch (error) {
  if (error instanceof ValidationError) console.error(error.fields);
  else if (error instanceof RateLimitError) console.error(error.retryAfter);
  else if (error instanceof AuthenticationError) console.error('Sign in required');
  else if (error instanceof NetworkError) console.error('Retryable network failure');
  else if (error instanceof SnackBaseError) console.error(error.code, error.message);
}
```

## Related packages

- [`@snackbase/react`](../react/README.md) — React provider and hooks
- [`@snackbase/mcp`](../mcp/README.md) — MCP server for AI tools
- [`@snackbase/pocketbase-compat`](../pocketbase-compat/README.md) — PocketBase-compatible API
- [`@snackbase/supabase-compat`](../supabase-compat/README.md) — Supabase-compatible API
- [`@snackbase/skills`](../skills/README.md) — Agent Skills for SDK usage
- [`create-snackbase-app`](../create-snackbase-app/README.md) — project scaffolding CLI

## Development

From the repository root:

```bash
pnpm install
pnpm --filter @snackbase/sdk build
pnpm --filter @snackbase/sdk test
pnpm --filter @snackbase/sdk typecheck
```

Integration tests require a running SnackBase server. Set `SNACKBASE_URL` and, for
admin/verification flows, `SNACKBASE_API_KEY`; see
[`tests/integration/README.md`](tests/integration/README.md).

## License

MIT
