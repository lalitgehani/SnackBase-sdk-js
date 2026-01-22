# React Integration Guide

The SnackBase SDK provides first-class React integration through hooks and context provider.

## Installation

```bash
npm install @snackbase/sdk react
```

## Setup

### Wrapping Your App

Wrap your application with `SnackBaseProvider`:

```tsx
import { SnackBaseProvider } from "@snackbase/sdk/react";
import type { SnackBaseConfig } from "@snackbase/sdk";

const config: SnackBaseConfig = {
  baseUrl: "https://your-project.snackbase.dev",
  apiKey: "your-api-key", // Optional for public access
};

function App() {
  return (
    <SnackBaseProvider {...config}>
      <YourApp />
    </SnackBaseProvider>
  );
}
```

### Environment Variables

For production apps, use environment variables:

```tsx
import { SnackBaseProvider } from "@snackbase/sdk/react";

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
import { useAuth } from "@snackbase/sdk/react";

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

**useAuth Return Value:**

```typescript
interface UseAuthResult {
  user: User | null;
  account: Account | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthState>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<AuthState>;
  forgotPassword: (data: PasswordResetRequest) => Promise<void>;
  resetPassword: (data: PasswordResetConfirm) => Promise<void>;
}
```

### useQuery

Fetches a list of records from a collection.

```tsx
import { useQuery } from "@snackbase/sdk/react";

function PostList() {
  const { data, loading, error, refetch } = useQuery<Post>("posts", {
    filter: { status: "published" },
    sort: "-createdAt",
    expand: "author",
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {data?.items.map((post) => (
          <li key={post.id}>
            <h3>{post.title}</h3>
            <p>By {post.author?.name}</p>
          </li>
        ))}
      </ul>
      <p>
        Page {data?.page} of {data?.totalPages} ({data?.totalItems} total)
      </p>
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
```

### useRecord

Fetches a single record by ID.

```tsx
import { useRecord } from "@snackbase/sdk/react";

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
import { useMutation } from "@snackbase/sdk/react";

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
  update: (id: string, data: Partial<T>) => Promise<T & BaseRecord>;
  del: (id: string) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
}
```

### useSubscription

Subscribes to real-time updates on a collection.

```tsx
import { useState } from "react";
import { useSubscription } from "@snackbase/sdk/react";

function LivePosts() {
  const [posts, setPosts] = useState<Post[]>([]);

  useSubscription("posts", "create", (newPost) => {
    setPosts((prev) => [...prev, newPost]);
  });

  useSubscription("posts", "update", (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
    );
  });

  useSubscription("posts", "delete", (deletedPost) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedPost.id));
  });

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

**useSubscription Return Value:**

```typescript
interface UseSubscriptionResult {
  connected: boolean;
  error: Error | null;
}
```

### useSnackBase

Access the underlying SnackBase client instance.

```tsx
import { useSnackBase } from "@snackbase/sdk/react";

function CustomComponent() {
  const client = useSnackBase();

  const handleCustomAction = async () => {
    // Access any SDK method directly
    const users = await client.users.list();
    const dashboard = await client.dashboard.getMetrics();

    console.log("Users:", users);
    console.log("Dashboard:", dashboard);
  };

  return <button onClick={handleCustomAction}>Custom Action</button>;
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
} from "@snackbase/sdk/react";
import { useState } from "react";

// Types
interface Post {
  id: string;
  title: string;
  content: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
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
import { useQuery, useSubscription } from "@snackbase/sdk/react";

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

import { SnackBaseProvider } from "@snackbase/sdk/react";

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

import { useQuery } from "@snackbase/sdk/react";

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
  authorId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Component.tsx
import { useQuery, useMutation } from "@snackbase/sdk/react";
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
import { useQuery, useMutation } from "@snackbase/sdk/react";
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
import { useSubscription } from "@snackbase/sdk/react";

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
