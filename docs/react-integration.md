# React Integration Guide

The SnackBase SDK provides first-class React integration through hooks and context provider.

## Installation

```bash
npm install @snackbase/react @snackbase/sdk react
```

## Setup

### Wrapping Your App

**Client form (recommended):** construct `SnackBaseClient` and pass `{ client }`.

**Config form:** pass `{ baseUrl, ... }` — the provider builds a stable client.

```tsx
import { SnackBaseClient } from "@snackbase/sdk";
import { SnackBaseProvider } from "@snackbase/react";

const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  apiKey: "your-api-key", // Optional
});

function App() {
  return (
    <SnackBaseProvider client={client}>
      <YourApp />
    </SnackBaseProvider>
  );
}

// Or: <SnackBaseProvider baseUrl="https://your-project.snackbase.dev">...</SnackBaseProvider>
```

### Environment Variables

For production apps, use environment variables:

```tsx
import { SnackBaseProvider } from "@snackbase/react";

const config = {
  baseUrl: process.env.NEXT_PUBLIC_SNACKBASE_URL || "http://localhost:8090",
  apiKey: process.env.SNACKBASE_API_KEY,
};

function App() {
  return (
    <SnackBaseProvider {...config}>
      <YourApp />
    </SnackBaseProvider>
  );
}
```

## Hooks

### useAuth

Manages authentication state and methods.

```tsx
import { useAuth } from "@snackbase/react";

function LoginForm() {
  const { login, logout, user, isAuthenticated, isLoading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (
      e.currentTarget.elements.namedItem("email") as HTMLInputElement
    ).value;
    const password = (
      e.currentTarget.elements.namedItem("password") as HTMLInputElement
    ).value;

    try {
      await login({ email, password });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (isLoading) return <p>Loading...</p>;

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user?.name}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin}>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  );
}
```

**useAuth Return Value (selected):**

```typescript
interface UseAuthResult extends AuthState {
  // AuthState fields include: user, account, token, refreshToken (string | null),
  // isAuthenticated, expiresAt, tokenType
  expiresAt: string | null; // synced from AuthManager — not hard-coded null
  error: Error | null; // auth:error events + failed actions
  isLoading: boolean;
  isSuperadmin: boolean;
  isApiKeySession: boolean;
  isPersonalTokenSession: boolean;
  isOAuthSession: boolean;
  login: (credentials: LoginCredentials) => Promise<any>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<any>;
  forgotPassword: (data: PasswordResetRequest) => Promise<any>;
  resetPassword: (data: PasswordResetConfirm) => Promise<any>;
  /** Calls client.refreshToken() — named to avoid clashing with AuthState.refreshToken string */
  refreshAccessToken: () => Promise<any>;
  getCurrentUser: () => Promise<any>;
  verifyEmail: (token: string) => Promise<any>;
  resendVerificationEmail: () => Promise<any>;
  sendVerification: (email: string) => Promise<any>;
  verifyResetToken: (token: string) => Promise<any>;
  getOAuthUrl: (provider: OAuthProvider, redirectUri: string, state?: string) => Promise<any>;
  handleOAuthCallback: (params: OAuthCallbackParams) => Promise<any>;
  getSAMLUrl: (provider: SAMLProvider, account: string, relayState?: string) => Promise<any>;
  handleSAMLCallback: (params: SAMLCallbackParams) => Promise<any>;
  getSAMLMetadata: (provider: SAMLProvider, account: string) => Promise<any>;
}
```

**Security:** Do not render or log `token` / `refreshToken`.

### useQuery

Fetches a list of records from a collection. Supports `RecordListParams` **or** a QueryBuilder factory, plus optional `enabled`.

```tsx
import { useQuery } from "@snackbase/react";

function PostList() {
  const { data, loading, error, refetch } = useQuery<Post>("posts", {
    sort: "-created_at",
    limit: 20,
  });

  // QueryBuilder form:
  // useQuery("posts", (qb) => qb.filter('status = "published"').sort("-created_at"))

  // Conditional:
  // useQuery("posts", undefined, { enabled: Boolean(userId) })

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {data?.items.map((post) => (
          <li key={post.id}>
            <h3>{post.title}</h3>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**useQuery Return Value:**

```typescript
interface UseQueryResult<T> {
  data: RecordListResponse<T> | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// options?: { enabled?: boolean; listenToInvalidation?: boolean }
```

### useRecord

Fetches a single record by ID.

```tsx
import { useRecord } from "@snackbase/react";

function PostPage({ postId }: { postId: string }) {
  const {
    data: post,
    loading,
    error,
    refetch,
  } = useRecord<Post>("posts", postId, {
    expand: "author,comments",
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!post) return <p>Post not found</p>;

  return (
    <article>
      <h1>{post.title}</h1>
      <p>By {post.author?.name}</p>
      <div>{post.content}</div>
      <button onClick={refetch}>Refresh</button>
    </article>
  );
}
```

**useRecord Return Value:**

```typescript
interface UseRecordResult<T> {
  data: (T & BaseRecord) | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

### useMutation

Performs CRUD operations on a collection.

```tsx
import { useMutation } from "@snackbase/react";

function CreatePost() {
  const { create, loading, error } = useMutation<Post>("posts");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const content = (form.elements.namedItem("content") as HTMLTextAreaElement)
      .value;

    try {
      await create({ title, content, status: "draft" });
      form.reset();
      alert("Post created!");
    } catch (err) {
      console.error("Failed to create post:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Post"}
      </button>
      {error && <p className="error">{error.message}</p>}
    </form>
  );
}
```

**useMutation Return Value:**

```typescript
interface UseMutationResult<T> {
  create: (data: Partial<T>) => Promise<T & BaseRecord>;
  update: (id: string, data: Partial<T>) => Promise<T & BaseRecord>; // full PUT
  patch: (id: string, data: Partial<T>) => Promise<T & BaseRecord>;
  del: (id: string) => Promise<boolean>;
  batchCreate: (records: Record<string, any>[]) => Promise<BatchCreateResponse>;
  batchUpdate: (items: BatchUpdateItem[]) => Promise<BatchUpdateResponse>;
  batchDelete: (ids: string[]) => Promise<BatchDeleteResponse>;
  aggregate: (params: AggregationParams) => Promise<AggregationResponse>;
  loading: boolean;
  error: Error | null;
}

// options?: { invalidateOnSuccess?: boolean } — default false
// When true, successful mutations refetch mounted useQuery/useRecord for the same collection
```

### useSubscription

Subscribes to real-time updates on a collection. Auto-connects when needed; `connected` is true only when transport state is `'connected'`. Shared subscriptions are ref-counted and **operations are merged** across hooks on the same collection (LivePosts multi-hook pattern works).

**Legacy form** `(collection, event, callback)` and **multi-handler form** `(collection, operations, handlers)` are both supported.

```tsx
import { useState } from "react";
import { useSubscription } from "@snackbase/react";

// Preferred multi-handler form
function LivePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const { connected, error } = useSubscription(
    "posts",
    ["create", "update", "delete"],
    {
      create: (post) => setPosts((prev) => [...prev, post]),
      update: (post) =>
        setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p))),
      delete: (post) => setPosts((prev) => prev.filter((p) => p.id !== post.id)),
    },
  );

  return (
    <div>
      <span>{connected ? "Live" : "Offline"}</span>
      {error && <p>{error.message}</p>}
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}

// Legacy form (still supported) — ops are merged across multiple hooks on same collection
function LivePostsLegacy() {
  const [posts, setPosts] = useState<Post[]>([]);
  useSubscription("posts", "create", (data) => setPosts((prev) => [...prev, data]));
  useSubscription("posts", "update", (data) =>
    setPosts((prev) => prev.map((p) => (p.id === data.id ? data : p))),
  );
  useSubscription("posts", "delete", (data) =>
    setPosts((prev) => prev.filter((p) => p.id !== data.id)),
  );
  return null;
}
```

**Parameters (overloads):**

```typescript
// Legacy
function useSubscription(
  collection: string,
  event: string, // 'create' | 'update' | 'delete' | '*'
  callback: (data: any) => void
): UseSubscriptionResult;

// Multi-handler
function useSubscription(
  collection: string,
  operations: Array<"create" | "update" | "delete" | string>,
  handlers: {
    create?: (data: any, event?: any) => void;
    update?: (data: any, event?: any) => void;
    delete?: (data: any, event?: any) => void;
    "*"? : (data: any, event?: any) => void;
  }
): UseSubscriptionResult;
```

**useSubscription Return Value:**

```typescript
interface UseSubscriptionResult {
  connected: boolean; // true only when realtime.getState() === 'connected'
  error: Error | null;
}
```

**Note:** Callbacks receive event payload data (from `event.data` when present). Handler keys are `create` / `update` / `delete` (not `onCreate`).

### Additional hooks (v0.3.0+)

| Hook | Purpose |
| ---- | ------- |
| `useRealtime()` | Connection state + `connect` / `disconnect` |
| `useFiles()` | `upload`, `getDownloadUrl`, `remove` |
| `useInvitation()` | `getPublic(token)`, `accept(token, password)` |
| `useClientAction(fn)` | Generic `{ run, loading, error, data, reset }` for admin calls |

Admin domains (`workflows`, `webhooks`, `jobs`, …) have **no** dedicated hooks — use `useSnackBase()` or `useClientAction`.

### useSnackBase

Access the underlying SnackBase client instance.

```tsx
import { useSnackBase } from "@snackbase/react";

function CustomComponent() {
  const client = useSnackBase();

  const handleCustomAction = async () => {
    // Access any SDK method directly
    const users = await client.users.list();
    const dashboard = await client.dashboard.getStats();

    console.log("Users:", users);
    console.log("Dashboard:", dashboard);
  };

  return <button onClick={handleCustomAction}>Custom Action</button>;
}
```

**Note:** For filtered subscriptions or advanced real-time features, use the `client.realtime` API directly:

```tsx
function FilteredPosts() {
  const client = useSnackBase();

  useEffect(() => {
    // Subscribe with server-side filter
    const unsubscribe = client.realtime.subscribe(
      "posts",
      { filter: 'status = "published"' },
      (event) => {
        console.log("Published post changed:", event.record);
      }
    );

    return unsubscribe;
  }, [client]);

  return <div>...</div>;
}
```

## Complete Example: Blog App

```tsx
import {
  SnackBaseProvider,
  useAuth,
  useQuery,
  useMutation,
  useRecord,
} from "@snackbase/react";
import { useState } from "react";

// Types
interface Post {
  id: string;
  title: string;
  content: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

// App Provider
function App() {
  return (
    <SnackBaseProvider baseUrl="https://your-project.snackbase.dev">
      <Blog />
    </SnackBaseProvider>
  );
}

// Auth Wrapper
function Blog() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div>
      <header>
        <h1>My Blog</h1>
        <p>Welcome, {user?.name}</p>
        <LogoutButton />
      </header>
      <main>
        <PostList />
        <CreatePostForm />
      </main>
    </div>
  );
}

// Login Form
function LoginForm() {
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (
      e.currentTarget.elements.namedItem("email") as HTMLInputElement
    ).value;
    const password = (
      e.currentTarget.elements.namedItem("password") as HTMLInputElement
    ).value;
    await login({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}

// Logout Button
function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={logout}>Logout</button>;
}

// Post List
function PostList() {
  const { data, loading, error, refetch } = useQuery<Post>("posts", {
    sort: "-createdAt",
  });

  if (loading) return <p>Loading posts...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <section>
      <h2>Posts</h2>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {data?.items.map((post) => (
          <PostItem key={post.id} postId={post.id} />
        ))}
      </ul>
    </section>
  );
}

// Post Item
function PostItem({ postId }: { postId: string }) {
  const { data: post, loading } = useRecord<Post>("posts", postId);

  if (loading) return <li>Loading...</li>;

  return (
    <li>
      <h3>{post?.title}</h3>
      <p>{post?.status}</p>
      <small>{new Date(post?.createdAt || "").toLocaleString()}</small>
    </li>
  );
}

// Create Post Form
function CreatePostForm() {
  const { create, loading, error } = useMutation<Post>("posts");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const content = (form.elements.namedItem("content") as HTMLTextAreaElement)
      .value;

    try {
      await create({ title, content, status: "draft" });
      form.reset();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section>
      <h2>Create Post</h2>
      <form onSubmit={handleSubmit}>
        <input name="title" placeholder="Title" required />
        <textarea name="content" placeholder="Content" required />
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </button>
        {error && <p className="error">{error.message}</p>}
      </form>
    </section>
  );
}

export default App;
```

## Real-Time Updates

Combining `useQuery` and `useSubscription` for live data:

```tsx
import { useState, useEffect } from "react";
import { useQuery, useSubscription } from "@snackbase/react";

function LivePostList() {
  const [posts, setPosts] = useState<Post[]>([]);

  // Initial fetch
  const { data, loading } = useQuery<Post>("posts");

  // Sync initial data
  useEffect(() => {
    if (data?.items) {
      setPosts(data.items);
    }
  }, [data]);

  // Real-time updates
  useSubscription("posts", "create", (event) => {
    setPosts((prev) => [...prev, event.record]);
  });

  useSubscription("posts", "update", (event) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === event.record.id ? event.record : p)),
    );
  });

  useSubscription("posts", "delete", (event) => {
    setPosts((prev) => prev.filter((p) => p.id !== event.record.id));
  });

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Live Posts ({posts.length})</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Server-Side Rendering (Next.js)

### App Router

```tsx
// app/providers.tsx
"use client";

import { SnackBaseProvider } from "@snackbase/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SnackBaseProvider baseUrl={process.env.NEXT_PUBLIC_SNACKBASE_URL!}>
      {children}
    </SnackBaseProvider>
  );
}

// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

// app/page.tsx
("use client");

import { useQuery } from "@snackbase/react";

export default function Page() {
  const { data, loading } = useQuery<Post>("posts");

  if (loading) return <p>Loading...</p>;

  return (
    <main>
      {data?.items.map((post) => (
        <article key={post.id}>{post.title}</article>
      ))}
    </main>
  );
}
```

### Server Components

For server components, use the SDK directly:

```tsx
// app/posts/page.tsx
import { SnackBaseClient } from "@snackbase/sdk";

const client = new SnackBaseClient({
  baseUrl: process.env.SNACKBASE_URL!,
  apiKey: process.env.SNACKBASE_API_KEY!,
});

export default async function PostsPage() {
  const posts = await client.records.list<Post>("posts", {
    filter: { status: "published" },
  });

  return (
    <main>
      {posts.items.map((post) => (
        <article key={post.id}>{post.title}</article>
      ))}
    </main>
  );
}
```

## Type Safety

Define your record types for full type safety:

```tsx
// types.ts
export interface Post {
  id: string;
  title: string;
  content: string;
  status: "draft" | "published";
  author_id: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// Component.tsx
import { useQuery, useMutation } from "@snackbase/react";
import { Post } from "./types";

function PostComponent() {
  const { data } = useQuery<Post>("posts");
  const { create } = useMutation<Post>("posts");

  // Fully typed!
  const handleCreate = async () => {
    await create({
      title: "Hello",
      content: "World",
      status: "published",
      authorId: "abc",
      tags: ["tech"],
    });
  };

  return <div>{/* ... */}</div>;
}
```

## Error Handling

```tsx
import { useQuery, useMutation } from "@snackbase/react";
import { ValidationError, AuthenticationError } from "@snackbase/sdk";

function PostList() {
  const { data, error } = useQuery<Post>("posts");
  const { create, error: createError } = useMutation<Post>("posts");

  const handleCreate = async () => {
    try {
      await create({ title: "New Post" });
    } catch (error) {
      if (error instanceof ValidationError) {
        console.error("Validation failed:", error.fields);
      } else if (error instanceof AuthenticationError) {
        console.error("Not authenticated");
      }
    }
  };

  if (error instanceof AuthenticationError) {
    return <p>Please log in</p>;
  }

  return <div>{/* ... */}</div>;
}
```

## Best Practices

### 1. Memoize Callbacks

```tsx
import { useCallback } from "react";
import { useSubscription } from "@snackbase/react";

function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);

  const handleUpdate = useCallback((event) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === event.record.id ? event.record : p)),
    );
  }, []);

  useSubscription("posts", "update", handleUpdate);

  return <div>{/* ... */}</div>;
}
```

### 2. Separate Data Fetching

```tsx
// posts-hooks.ts
export function usePosts() {
  return useQuery<Post>("posts", {
    filter: { status: "published" },
    sort: "-createdAt",
  });
}

export function useCreatePost() {
  return useMutation<Post>("posts");
}

// Component.tsx
function PostList() {
  const { data, loading, refetch } = usePosts();
  const { create } = useCreatePost();

  return <div>{/* ... */}</div>;
}
```

### 3. Handle Loading States

```tsx
function PostList() {
  const { data, loading } = useQuery<Post>("posts");

  if (loading) {
    return (
      <div className="loading">
        <Spinner />
        <p>Loading posts...</p>
      </div>
    );
  }

  return <div>{/* ... */}</div>;
}
```

### 4. Custom Hooks for Complex Logic

```tsx
function useLivePosts() {
  const { data } = useQuery<Post>("posts");
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (data?.items) setPosts(data.items);
  }, [data]);

  useSubscription("posts", "create", (e) => {
    setPosts((prev) => [...prev, e.record]);
  });

  useSubscription("posts", "update", (e) => {
    setPosts((prev) => prev.map((p) => (p.id === e.record.id ? e.record : p)));
  });

  useSubscription("posts", "delete", (e) => {
    setPosts((prev) => prev.filter((p) => p.id !== e.record.id));
  });

  return posts;
}
```
