# Getting Started with SnackBase SDK

This guide will help you get up and running with the SnackBase SDK in your project.

## Installation

### Using npm

```bash
npm install @snackbase/sdk
```

### Using yarn

```bash
yarn add @snackbase/sdk
```

### Using pnpm

```bash
pnpm add @snackbase/sdk
```

### React Integration

If you're using React, install React as a peer dependency:

```bash
npm install @snackbase/sdk react
```

## Project Setup

### 1. Create a SnackBase Account

1. Go to [snackbase.dev](https://snackbase.dev) and sign up
2. Create a new project
3. Get your project URL (e.g., `https://your-project.snackbase.dev`)
4. Generate an API key from the dashboard (optional, for public access)

### 2. Initialize the SDK

```typescript
import { SnackBaseClient } from "@snackbase/sdk";

const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  // apiKey: 'your-api-key', // Optional for public collections
});
```

### Configuration Options

| Option          | Type      | Required | Description                                       |
| --------------- | --------- | -------- | ------------------------------------------------- |
| `baseUrl`       | `string`  | Yes      | Your SnackBase project URL                        |
| `apiKey`        | `string`  | No       | API key for server-to-server authentication       |
| `storage`       | `Storage` | No       | Custom storage backend (defaults to localStorage) |
| `timeout`       | `number`  | No       | Request timeout in milliseconds (default: 30000)  |
| `enableLogging` | `boolean` | No       | Enable debug logging (default: false)             |

## Basic Usage

### Authentication

#### Email/Password Authentication

```typescript
// Sign up a new user
const auth = await client.auth.register({
  email: "user@example.com",
  password: "securepassword",
  passwordConfirm: "securepassword",
});

console.log("Registered:", auth.user);

// Login with email and password
const authState = await client.auth.login({
  email: "user@example.com",
  password: "securepassword",
});

console.log("Logged in:", authState.user);

// Access token is stored automatically
console.log("Token:", client.token);
```

#### OAuth Authentication

```typescript
// Sign in with OAuth provider
const auth = await client.auth.authenticateWithOAuth({
  provider: "google",
  code: "oauth-code-from-redirect",
  redirectUrl: "https://your-app.com/auth/callback",
});
```

#### API Key Authentication

```typescript
// Initialize with API key (server-side)
const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  apiKey: "your-api-key",
});

// API key is automatically included in all requests
const records = await client.records.list("posts");
```

### Working with Records

#### Create a Record

```typescript
const newPost = await client.records.create("posts", {
  title: "My First Post",
  content: "Hello, SnackBase!",
  status: "published",
  authorId: "user-123",
});

console.log("Created:", newPost.id);
```

#### Read Records

```typescript
// Get a single record
const post = await client.records.get("posts", "record-id");

// List records with filters
const posts = await client.records.list("posts", {
  filter: {
    status: "published",
  },
  sort: "-createdAt",
  expand: "author",
});
```

#### Update a Record

```typescript
const updated = await client.records.update("posts", "record-id", {
  title: "Updated Title",
  status: "draft",
});
```

#### Delete a Record

```typescript
await client.records.delete("posts", "record-id");
```

### Query Builder

For complex queries, use the fluent query builder:

```typescript
const results = await client
  .query("posts")
  .select("id", "title", "author.name")
  .expand("author", "tags")
  .filter("status", "=", "published")
  .filter("views", ">", 100)
  .sort("createdAt", "desc")
  .page(1)
  .perPage(20)
  .execute();

console.log(`Found ${results.totalItems} posts`);
console.log("Page", results.page, "of", results.totalPages);
```

### Real-Time Subscriptions

Subscribe to changes in real-time:

```typescript
// Subscribe to all events on a collection
const unsubscribe = client.realtime.subscribe("posts", (event) => {
  console.log("Event:", event.action);
  console.log("Record:", event.record);
});

// Subscribe with a filter
const unsubscribeFiltered = client.realtime.subscribe(
  "posts",
  {
    filter: 'status = "published"',
  },
  (event) => {
    console.log("Published post changed:", event.record);
  },
);

// Unsubscribe when done
unsubscribe();
unsubscribeFiltered();
```

## Available Services

The SnackBase SDK provides 17+ services for different aspects of your application:

| Service           | Access                   | Description                                            |
| ----------------- | ------------------------ | ------------------------------------------------------ |
| `auth`            | `client.auth`            | User authentication, registration, password management |
| `users`           | `client.users`           | User account management                                |
| `accounts`        | `client.accounts`        | Multi-account project management                       |
| `collections`     | `client.collections`     | Collection and schema management                       |
| `records`         | `client.records`         | CRUD operations on dynamic collections                 |
| `realtime`        | `client.realtime`        | Real-time subscriptions and events                     |
| `files`           | `client.files`           | File upload and download                               |
| `apiKeys`         | `client.apiKeys`         | API key management for service-to-service auth         |
| `auditLogs`       | `client.auditLogs`       | Audit log viewing and export                           |
| `admin`           | `client.admin`           | System administration and configuration                |
| `collectionRules` | `client.collectionRules` | Collection-level access rules                          |
| `dashboard`       | `client.dashboard`       | Dashboard statistics and metrics                       |
| `emailTemplates`  | `client.emailTemplates`  | Email template management                              |
| `groups`          | `client.groups`          | User group management                                  |
| `invitations`     | `client.invitations`     | User invitation management                             |
| `macros`          | `client.macros`          | SQL macro management for rules                         |
| `migrations`      | `client.migrations`      | Database migration status                              |
| `roles`           | `client.roles`           | Role and permission management                         |

**Example:**

```typescript
// Manage users
const users = await client.users.list();

// View audit logs
const logs = await client.auditLogs.list({ table_name: "users" });

// Get dashboard stats
const stats = await client.dashboard.getStats();

// Manage invitations
const invitation = await client.invitations.create({
  email: "newuser@example.com",
  role_id: "role-id",
});
```

For complete API documentation, see the [API Reference](./api-reference.md).

## Platform-Specific Setup

### Browser (Vanilla JS)

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module">
      import { SnackBaseClient } from "https://cdn.jsdelivr.net/npm/@snackbase/sdk/dist/index.mjs";

      const client = new SnackBaseClient({
        baseUrl: "https://your-project.snackbase.dev",
      });

      const posts = await client.records.list("posts");
      console.log(posts);
    </script>
  </head>
  <body>
    <!-- Your app content -->
  </body>
</html>
```

### React

See the [React Integration Guide](./react-integration.md) for detailed information.

```tsx
import { SnackBaseProvider } from "@snackbase/sdk/react";

function App() {
  return (
    <SnackBaseProvider
      baseUrl="https://your-project.snackbase.dev"
      apiKey="your-api-key"
    >
      <YourApp />
    </SnackBaseProvider>
  );
}
```

### React Native

```typescript
import { SnackBaseClient } from "@snackbase/sdk";
import { AsyncStorage } from "@react-native-async-storage/async-storage";

// Use AsyncStorage for React Native
const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  storage: AsyncStorage,
});
```

### Node.js

```typescript
import { SnackBaseClient } from "@snackbase/sdk";

const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  apiKey: process.env.SNACKBASE_API_KEY,
});

// Use in your API routes
const users = await client.users.list();
```

### Next.js

```typescript
// lib/snackbase.ts
import { SnackBaseClient } from '@snackbase/sdk';

export const client = new SnackBaseClient({
  baseUrl: process.env.NEXT_PUBLIC_SNACKBASE_URL,
  apiKey: process.env.SNACKBASE_API_KEY,
});

// app/page.tsx
import { client } from '@/lib/snackbase';

export default async function Page() {
  const posts = await client.records.list('posts');

  return <PostsList posts={posts.items} />;
}
```

## Error Handling

The SDK provides typed errors for better error handling:

```typescript
import {
  SnackBaseError,
  AuthenticationError,
  ValidationError,
  NetworkError,
  RateLimitError,
} from "@snackbase/sdk";

try {
  const post = await client.records.create("posts", data);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors (422)
    console.error("Validation failed:", error.fields);
  } else if (error instanceof AuthenticationError) {
    // Handle authentication errors (401)
    console.error("Not authenticated");
  } else if (error instanceof RateLimitError) {
    // Handle rate limiting (429)
    console.error("Rate limited. Retry after:", error.retryAfter);
  } else if (error instanceof NetworkError) {
    // Handle network errors
    console.error("Network error:", error.message);
  } else {
    // Handle other errors
    console.error("Error:", error.message);
  }
}
```

## Type Safety

The SDK is written in TypeScript and provides full type definitions:

```typescript
import type { User, Post, Comment } from "@snackbase/sdk";

// Define your record types
interface Post {
  id: string;
  title: string;
  content: string;
  status: "draft" | "published";
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

// Use generics for type-safe operations
const post: Post = await client.records.get<Post>("posts", "record-id");

// Type-safe list results
const posts = await client.records.list<Post>("posts");
posts.items.forEach((post: Post) => {
  console.log(post.title);
});
```

## Best Practices

### 1. Use a Single Client Instance

Create and reuse a single client instance throughout your application:

```typescript
// lib/snackbase.ts
import { SnackBaseClient } from "@snackbase/sdk";

export const client = new SnackBaseClient({
  baseUrl: process.env.SNACKBASE_URL,
  apiKey: process.env.SNACKBASE_API_KEY,
});

// Import and reuse everywhere
import { client } from "@/lib/snackbase";
```

### 2. Handle Authentication State

Listen to authentication state changes:

```typescript
client.on("auth:login", (state) => {
  console.log("User logged in:", state.user);
});

client.on("auth:logout", () => {
  console.log("User logged out");
});

client.on("auth:error", (error) => {
  console.error("Auth error:", error);
});
```

### 3. Clean Up Subscriptions

Always unsubscribe from real-time subscriptions when done:

```typescript
const unsubscribe = client.realtime.subscribe("posts", handler);

// In a cleanup function
onUnmount(() => {
  unsubscribe();
});
```

### 4. Use Filters Efficiently

Use server-side filtering to reduce data transfer:

```typescript
// Good: Server-side filtering
const posts = await client.records.list("posts", {
  filter: { status: "published", authorId: "user-123" },
});

// Avoid: Client-side filtering
const allPosts = await client.records.list("posts");
const published = allPosts.items.filter((p) => p.status === "published");
```

### 5. Handle Pagination

Use pagination for large datasets:

```typescript
let page = 1;
let hasMore = true;

while (hasMore) {
  const results = await client.records.list("posts", {
    page,
    perPage: 50,
  });

  // Process results
  processPage(results.items);

  hasMore = page < results.totalPages;
  page++;
}
```

## Next Steps

- [Authentication Guide](./authentication.md) - Learn about all authentication methods
- [Real-Time Features](./realtime.md) - Deep dive into real-time subscriptions
- [React Integration](./react-integration.md) - Using the SDK with React
- [API Reference](./api-reference.md) - Complete API documentation
- [Migration Guides](./migration/) - Migrate from other platforms

## Support

- Documentation: [https://docs.snackbase.dev](https://docs.snackbase.dev)
- GitHub Issues: [https://github.com/lalitgehani/snackbase-js/issues](https://github.com/lalitgehani/snackbase-js/issues)
- Discord: [https://discord.gg/snackbase](https://discord.gg/snackbase)
