# SnackBase SDK

[![npm version](https://badge.fury.io/js/%40snackbase%2Fsdk.svg)](https://www.npmjs.com/package/@snackbase/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/lalitgehani/snackbase-js/actions/workflows/ci.yml/badge.svg)](https://github.com/lalitgehani/snackbase-js/actions)

The official JavaScript/TypeScript SDK for [SnackBase](https://snackbase.dev) - a powerful backend-as-a-service platform.

## Features

- **Type-Safe**: Built with TypeScript for full type safety and excellent developer experience
- **Authentication**: Support for JWT tokens, OAuth, SAML, and API keys
- **Real-Time**: WebSocket and SSE support for real-time data synchronization
- **React Integration**: Dedicated React hooks and context for seamless integration
- **Query Builder**: Fluent API for building complex queries with filtering, sorting, and pagination
- **Platform Agnostic**: Works in browsers, React Native, and Node.js
- **Lightweight**: Only 14.87 KB gzipped for the core SDK

## Installation

```bash
# npm
npm install @snackbase/sdk

# yarn
yarn add @snackbase/sdk

# pnpm
pnpm add @snackbase/sdk
```

### React Integration

```bash
# npm
npm install @snackbase/sdk react

# yarn
yarn add @snackbase/sdk react

# pnpm
pnpm add @snackbase/sdk react
```

## Quick Start

### Basic Usage

```typescript
import { SnackBaseClient } from "@snackbase/sdk";

// Initialize the client
const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  apiKey: "your-api-key", // Optional for public access
});

// Authenticate with email/password
const authState = await client.auth.login({
  email: "user@example.com",
  password: "password123",
});

console.log("Logged in as:", authState.user.email);

// List records from a collection
const records = await client.records.list("posts", {
  filter: { status: "published" },
  sort: "-createdAt",
});

// Subscribe to real-time updates
client.realtime.subscribe("posts", (event) => {
  console.log("New event:", event.action, event.record);
});
```

### React Integration

```tsx
import { SnackBaseProvider, useAuth, useRecord } from "@snackbase/react";

function App() {
  return (
    <SnackBaseProvider
      baseUrl="https://your-project.snackbase.dev"
      apiKey="your-api-key"
    >
      <Posts />
    </SnackBaseProvider>
  );
}

function Posts() {
  const { user, login, logout } = useAuth();
  const { data: posts, loading } = useRecord("posts", {
    filter: { status: "published" },
  });

  if (!user) {
    return <button onClick={() => login(email, password)}>Login</button>;
  }

  return (
    <div>
      <button onClick={logout}>Logout</button>
      {loading ? <p>Loading...</p> : <PostList posts={posts?.items} />}
    </div>
  );
}
```

## Documentation

- [Getting Started Guide](./docs/getting-started.md)
- [Authentication Guide](./docs/authentication.md)
- [Real-Time Features](./docs/realtime.md)
- [React Integration](./docs/react-integration.md)
- [API Reference](./docs/api-reference.md)
- [Migration Guides](./docs/migration/)

## Platform Support

| Platform                                | Support |
| --------------------------------------- | ------- |
| Browser (Chrome, Firefox, Safari, Edge) | ✅ Full |
| React Native                            | ✅ Full |
| Node.js                                 | ✅ Full |
| Next.js                                 | ✅ Full |
| Vue/Nuxt                                | ✅ Full |

## Authentication Methods

| Method             | Description                                        |
| ------------------ | -------------------------------------------------- |
| **Email/Password** | Traditional authentication with email and password |
| **OAuth**          | Sign in with Google, GitHub, etc.                  |
| **SAML**           | Enterprise SSO support                             |
| **API Key**        | Server-to-server authentication                    |

## Core Services

The SDK provides 17+ services for interacting with SnackBase:

- `client.auth` - Authentication and user management
- `client.users` - User CRUD operations
- `client.accounts` - Account management
- `client.collections` - Collection/schema management
- `client.records` - Dynamic record operations (CRUD, queries)
- `client.roles` - Role-based access control
- `client.groups` - Group management
- `client.invitations` - User invitations
- `client.macros` - Macro operations
- `client.apiKeys` - API key management
- `client.auditLogs` - Audit log access
- `client.dashboard` - Dashboard metrics
- `client.admin` - Admin operations
- `client.emailTemplates` - Email template management
- `client.files` - File upload/download
- `client.realtime` - Real-time subscriptions
- `client.query` - Query builder

## Query Builder

Build complex queries with a fluent API:

```typescript
const results = await client
  .query("posts")
  .select("id", "title", "author.name")
  .expand("author", "comments")
  .filter("status", "=", "published")
  .filter("createdAt", ">", "2024-01-01")
  .sort("createdAt", "desc")
  .page(1)
  .perPage(20)
  .execute();
```

## Real-Time Subscriptions

Subscribe to record changes in real-time:

```typescript
// Subscribe to a collection
const unsubscribe = client.realtime.subscribe("posts", (event) => {
  switch (event.action) {
    case "create":
      console.log("New post created:", event.record);
      break;
    case "update":
      console.log("Post updated:", event.record);
      break;
    case "delete":
      console.log("Post deleted:", event.record);
      break;
  }
});

// Unsubscribe when done
unsubscribe();
```

## Error Handling

The SDK provides typed errors for comprehensive error handling:

```typescript
import {
  SnackBaseError,
  AuthenticationError,
  ValidationError,
  NetworkError,
} from "@snackbase/sdk";

try {
  await client.records.create("posts", data);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Validation failed:", error.fields);
  } else if (error instanceof AuthenticationError) {
    console.error("Authentication failed:", error.message);
  } else if (error instanceof NetworkError) {
    console.error("Network error:", error.message);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import type { User, Post, Comment } from "@snackbase/sdk";

// Type-safe record operations
const post: Post = await client.records.get<Post>("posts", "record-id");

// Type-safe auth state
const user: User = await client.auth.getCurrentUser();
```

## Development

This is a **pnpm monorepo** with multiple packages:

```bash
# Clone the repository
git clone https://github.com/lalitgehani/snackbase-js.git
cd snackbase-js

# Install dependencies (requires pnpm)
pnpm install

# Build all packages
pnpm build

# Run tests across all packages
pnpm test

# Watch mode for development
pnpm dev

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## Bundle Size

- Core SDK: **14.87 KB** (gzipped)
- React Integration: **1.42 KB** (gzipped)
- Total: **16.29 KB** (gzipped)

## License

MIT © [SnackBase](https://snackbase.dev)

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## Support

- Documentation: [https://docs.snackbase.dev](https://docs.snackbase.dev)
- GitHub Issues: [https://github.com/lalitgehani/snackbase-js/issues](https://github.com/lalitgehani/snackbase-js/issues)
- Discord: [https://discord.gg/snackbase](https://discord.gg/snackbase)

## Related Projects

- [SnackBase](https://snackbase.dev) - The official SnackBase platform
