# Next.js Example App

This is a complete example of using SnackBase SDK with Next.js 14 (App Router).

## Features

- Server-side rendering with SnackBase
- Client-side authentication
- Real-time data updates
- Server actions for mutations
- Optimistic UI updates
- Route protection

## Setup

### 1. Install Dependencies

```bash
npx create-next-app@latest my-snackbase-app
cd my-snackbase-app
npm install @snackbase/sdk
```

### 2. Create Environment File

Create `.env.local`:

```env
NEXT_PUBLIC_SNACKBASE_URL=https://your-project.snackbase.dev
SNACKBASE_API_KEY=your-api-key
```

### 3. Create Provider Component

Create `app/providers.tsx`:

```tsx
"use client";

import { SnackBaseProvider } from "@snackbase/sdk/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SnackBaseProvider
      baseUrl={process.env.NEXT_PUBLIC_SNACKBASE_URL!}
      apiKey={process.env.SNACKBASE_API_KEY}
    >
      {children}
    </SnackBaseProvider>
  );
}
```

### 4. Update Layout

Update `app/layout.tsx`:

```tsx
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Usage Examples

### Server Component (Fetch Data on Server)

Create `app/posts/page.tsx`:

```tsx
import { SnackBaseClient } from "@snackbase/sdk";
import Link from "next/link";

const client = new SnackBaseClient({
  baseUrl: process.env.NEXT_PUBLIC_SNACKBASE_URL!,
  apiKey: process.env.SNACKBASE_API_KEY,
});

export default async function PostsPage() {
  const posts = await client.records.list<Post>("posts", {
    filter: { status: "published" },
    sort: "-createdAt",
    expand: "author",
  });

  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Blog Posts</h1>

      <div className="grid gap-6">
        {posts.items.map((post) => (
          <article key={post.id} className="border p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
            <p className="text-gray-600 mb-4">By {post.author?.name}</p>
            <p className="mb-4">{post.excerpt}</p>
            <Link
              href={`/posts/${post.id}`}
              className="text-blue-600 hover:underline"
            >
              Read more →
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
```

### Server Component (Single Post)

Create `app/posts/[id]/page.tsx`:

```tsx
import { SnackBaseClient } from "@snackbase/sdk";
import notFound from "next/navigation";

const client = new SnackBaseClient({
  baseUrl: process.env.NEXT_PUBLIC_SNACKBASE_URL!,
  apiKey: process.env.SNACKBASE_API_KEY,
});

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await client.records
    .get<Post>("posts", params.id, {
      expand: "author,comments",
    })
    .catch(() => null);

  if (!post) {
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto p-4">
      <article>
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <p className="text-gray-600 mb-8">
          By {post.author?.name} ·{" "}
          {new Date(post.createdAt).toLocaleDateString()}
        </p>
        <div className="prose max-w-none">{post.content}</div>

        {post.comments && post.comments.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Comments</h2>
            <div className="space-y-4">
              {post.comments.map((comment) => (
                <div key={comment.id} className="border-l-4 pl-4">
                  <p className="font-semibold">{comment.author?.name}</p>
                  <p>{comment.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
```

### Client Component (Authentication)

Create `app/login/page.tsx`:

```tsx
"use client";

import { useAuth } from "@snackbase/sdk/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  if (isAuthenticated) {
    router.push("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch (error) {
      alert("Login failed");
    }
  };

  return (
    <main className="max-w-md mx-auto mt-12 p-4">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full border p-2 rounded"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
```

### Client Component (Protected Route)

Create `app/dashboard/page.tsx`:

```tsx
"use client";

import { useAuth } from "@snackbase/sdk/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <main className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="bg-white border p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user.name}!</h2>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>User ID:</strong> {user.id}
        </p>
      </div>
    </main>
  );
}
```

### Server Actions (Create Post)

Create `app/actions.ts`:

```tsx
"use server";

import { SnackBaseClient } from "@snackbase/sdk";
import { revalidatePath } from "next/cache";

const client = new SnackBaseClient({
  baseUrl: process.env.NEXT_PUBLIC_SNACKBASE_URL!,
  apiKey: process.env.SNACKBASE_API_KEY,
});

export async function createPost(data: {
  title: string;
  content: string;
  status: string;
}) {
  const post = await client.records.create("posts", {
    ...data,
    authorId: "current-user-id", // Get from session
  });

  revalidatePath("/posts");
  revalidatePath("/dashboard");

  return post;
}
```

Use in component:

```tsx
"use client";

import { useTransition } from "react";
import { createPost } from "../actions";

export function CreatePostForm() {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      await createPost({
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        status: "draft",
      });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="title"
        placeholder="Title"
        className="w-full border p-2 rounded"
      />
      <textarea
        name="content"
        placeholder="Content"
        className="w-full border p-2 rounded h-32"
      />
      <button
        disabled={isPending}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {isPending ? "Creating..." : "Create Post"}
      </button>
    </form>
  );
}
```

### Real-Time Updates

```tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useSubscription } from "@snackbase/sdk/react";
import type { Post } from "@snackbase/sdk";

export function LivePostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const { data } = useQuery<Post>("posts", {
    sort: "-createdAt",
  });

  // Sync initial data
  useEffect(() => {
    if (data?.items) {
      setPosts(data.items);
    }
  }, [data]);

  // Real-time updates
  useSubscription("posts", "create", (event) => {
    setPosts((prev) => [event.record, ...prev]);
  });

  useSubscription("posts", "update", (event) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === event.record.id ? event.record : p)),
    );
  });

  useSubscription("posts", "delete", (event) => {
    setPosts((prev) => prev.filter((p) => p.id !== event.record.id));
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Live Posts ({posts.length})</h2>
      {posts.map((post) => (
        <div key={post.id} className="border p-4 rounded">
          <h3 className="font-semibold">{post.title}</h3>
        </div>
      ))}
    </div>
  );
}
```

## Running the Example

```bash
npm run dev
```

Open http://localhost:3000

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [SnackBase React Integration Guide](../../docs/react-integration.md)
- [Authentication Guide](../../docs/authentication.md)
