# Migrating from Supabase

This guide helps you migrate from Supabase to SnackBase.

## Overview

Both Supabase and SnackBase provide backend-as-a-service features. This guide highlights the key differences and provides migration examples.

## Key Differences

| Feature   | Supabase             | SnackBase                     |
| --------- | -------------------- | ----------------------------- |
| Client    | `createClient()`     | `new SnackBaseClient()`       |
| Auth      | `supabase.auth`      | `client.auth`                 |
| Database  | `supabase.from()`    | `client.records`              |
| Real-time | `supabase.channel()` | `client.realtime.subscribe()` |
| Storage   | `supabase.storage`   | `client.files`                |

## Installation

### Remove Supabase

```bash
npm uninstall @supabase/supabase-js
```

### Install SnackBase

```bash
npm install @snackbase/sdk
```

## Initialization

### Supabase

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://your-project.supabase.co",
  "your-anon-key",
);
```

### SnackBase

```typescript
import { SnackBaseClient } from "@snackbase/sdk";

const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  apiKey: "your-api-key",
});
```

## Authentication

### Email/Password Authentication

**Supabase:**

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "password",
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password",
});

// Sign out
await supabase.auth.signOut();

// Get user
const {
  data: { user },
} = await supabase.auth.getUser();
```

**SnackBase:**

```typescript
// Sign up
const authState = await client.auth.register({
  email: "user@example.com",
  password: "password",
  passwordConfirm: "password",
});

// Sign in
const authState = await client.auth.login({
  email: "user@example.com",
  password: "password",
});

// Sign out
await client.auth.logout();

// Get user
const user = client.user;
```

### OAuth Authentication

**Supabase:**

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
});
```

**SnackBase:**

```typescript
// Get OAuth URL and redirect user
const response = await fetch(
  "https://your-project.snackbase.dev/api/v1/oauth/google",
);
const { url } = await response.json();

// Handle callback
const authState = await client.auth.authenticateWithOAuth({
  provider: "google",
  code: "authorization-code",
  redirectUrl: "https://your-app.com/callback",
});
```

### Session Management

**Supabase:**

```typescript
// Get session
const {
  data: { session },
} = await supabase.auth.getSession();

// Listen to auth changes
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth event:", event, session);
});
```

**SnackBase:**

```typescript
// Get auth state
const isAuthenticated = client.isAuthenticated;
const user = client.user;

// Listen to auth events
const unsubscribe = client.on("auth:login", (state) => {
  console.log("Logged in:", state.user);
});

client.on("auth:logout", () => {
  console.log("Logged out");
});
```

## Database Operations

### Select / List Records

**Supabase:**

```typescript
const { data, error } = await supabase
  .from("posts")
  .select("*")
  .eq("status", "published")
  .order("created_at", { ascending: false })
  .range(0, 19);
```

**SnackBase:**

```typescript
const result = await client.records.list("posts", {
  filter: { status: "published" },
  sort: "-createdAt",
  page: 1,
  perPage: 20,
});

console.log(result.items);
```

### Get Single Record

**Supabase:**

```typescript
const { data, error } = await supabase
  .from("posts")
  .select("*")
  .eq("id", "record-id")
  .single();
```

**SnackBase:**

```typescript
const record = await client.records.get("posts", "record-id");
```

### Insert / Create Record

**Supabase:**

```typescript
const { data, error } = await supabase
  .from("posts")
  .insert({
    title: "Hello World",
    content: "My first post",
  })
  .select()
  .single();
```

**SnackBase:**

```typescript
const record = await client.records.create("posts", {
  title: "Hello World",
  content: "My first post",
});
```

### Update Record

**Supabase:**

```typescript
const { data, error } = await supabase
  .from("posts")
  .update({ title: "Updated Title" })
  .eq("id", "record-id")
  .select()
  .single();
```

**SnackBase:**

```typescript
const record = await client.records.update("posts", "record-id", {
  title: "Updated Title",
});
```

### Delete Record

**Supabase:**

```typescript
const { error } = await supabase.from("posts").delete().eq("id", "record-id");
```

**SnackBase:**

```typescript
await client.records.delete("posts", "record-id");
```

## Real-Time Subscriptions

### Subscribe to Changes

**Supabase:**

```typescript
const channel = supabase
  .channel("posts-changes")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "posts",
    },
    (payload) => {
      console.log("Change:", payload);
    },
  )
  .subscribe();

// Cleanup
supabase.removeChannel(channel);
```

**SnackBase:**

```typescript
const unsubscribe = client.realtime.subscribe("posts", (event) => {
  console.log("Action:", event.action);
  console.log("Record:", event.record);
});

// Cleanup
unsubscribe();
```

### Filtered Subscriptions

**Supabase:**

```typescript
const channel = supabase
  .channel("filtered-posts")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "posts",
      filter: "status=eq.published",
    },
    (payload) => {
      console.log("New published post:", payload);
    },
  )
  .subscribe();
```

**SnackBase:**

```typescript
const unsubscribe = client.realtime.subscribe(
  "posts",
  { filter: 'status = "published"' },
  (event) => {
    console.log("Published post:", event.record);
  },
);
```

## Query Builder

**Supabase:**

```typescript
const { data } = await supabase
  .from("posts")
  .select("id, title, author(name)")
  .eq("status", "published")
  .gt("views", 100)
  .order("created_at", { ascending: false })
  .limit(20);
```

**SnackBase:**

```typescript
const result = await client
  .query("posts")
  .select("id", "title", "author.name")
  .expand("author")
  .filter("status", "=", "published")
  .filter("views", ">", 100)
  .sort("createdAt", "desc")
  .limit(20)
  .execute();
```

## File Storage

### Upload File

**Supabase:**

```typescript
const { data, error } = await supabase.storage
  .from("files")
  .upload("path/to/file.jpg", file);
```

**SnackBase:**

```typescript
const record = await client.files.upload(file, {
  collection: "files",
});
```

### Get Public URL

**Supabase:**

```typescript
const { data } = supabase.storage
  .from("files")
  .getPublicUrl("path/to/file.jpg");
```

**SnackBase:**

```typescript
const url = client.files.getUrl("file-token");
```

### Download File

**Supabase:**

```typescript
const { data, error } = await supabase.storage
  .from("files")
  .download("path/to/file.jpg");
```

**SnackBase:**

```typescript
const blob = await client.files.download("file-token");
```

## Error Handling

**Supabase:**

```typescript
const { data, error } = await supabase.from("posts").select("*");

if (error) {
  console.error("Error:", error.message);
  console.error("Details:", error.details);
  console.error("Hint:", error.hint);
}
```

**SnackBase:**

```typescript
import { ValidationError, SnackBaseError } from "@snackbase/sdk";

try {
  const result = await client.records.list("posts");
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Fields:", error.fields);
  } else if (error instanceof SnackBaseError) {
    console.error("Message:", error.message);
  }
}
```

## React Integration

### Supabase with React

```tsx
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

function Posts() {
  const supabase = createClientComponentClient();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    supabase
      .from("posts")
      .select("*")
      .then(({ data }) => {
        setPosts(data);
      });
  }, []);

  return <div>{/* ... */}</div>;
}
```

### SnackBase with React

```tsx
import { SnackBaseProvider, useQuery } from "@snackbase/sdk/react";

function App() {
  return (
    <SnackBaseProvider baseUrl="https://your-project.snackbase.dev">
      <Posts />
    </SnackBaseProvider>
  );
}

function Posts() {
  const { data, loading } = useQuery<Post>("posts");

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {data?.items.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

## Migration Checklist

### Step 1: Update Initialization

- [ ] Replace `createClient()` with `new SnackBaseClient()`
- [ ] Update configuration options
- [ ] Add API key

### Step 2: Update Authentication

- [ ] Replace `supabase.auth.signUp()` with `client.auth.register()`
- [ ] Replace `supabase.auth.signInWithPassword()` with `client.auth.login()`
- [ ] Replace `supabase.auth.signOut()` with `client.auth.logout()`
- [ ] Update session management

### Step 3: Update Database Operations

- [ ] Replace `supabase.from()` with `client.records`
- [ ] Update `.select()` to `.list()` or `.get()`
- [ ] Update `.insert()` to `.create()`
- [ ] Update filter syntax

### Step 4: Update Real-Time

- [ ] Replace channels with `client.realtime.subscribe()`
- [ ] Update event handlers

### Step 5: Update Storage

- [ ] Replace `supabase.storage` with `client.files`
- [ ] Update upload/download methods

### Step 6: Update Error Handling

- [ ] Replace Supabase errors with typed errors

### Step 7: Test

- [ ] Test authentication flows
- [ ] Test CRUD operations
- [ ] Test real-time subscriptions
- [ ] Test file operations

## Quick Reference

| Supabase                               | SnackBase                        |
| -------------------------------------- | -------------------------------- |
| `supabase.auth.signUp()`               | `client.auth.register()`         |
| `supabase.auth.signInWithPassword()`   | `client.auth.login()`            |
| `supabase.auth.signOut()`              | `client.auth.logout()`           |
| `supabase.auth.getUser()`              | `client.user`                    |
| `supabase.from(table)`                 | `client.records`                 |
| `.select('*')`                         | `.list(collection)`              |
| `.select().eq('id', id).single()`      | `.get(collection, id)`           |
| `.insert(data)`                        | `.create(collection, data)`      |
| `.update(data).eq('id', id)`           | `.update(collection, id, data)`  |
| `.delete().eq('id', id)`               | `.delete(collection, id)`        |
| `.eq(column, value)`                   | `filter: { [column]: value }`    |
| `.order(column, { ascending: false })` | `sort: `-${toCamelCase(column)}` |
| `.range(0, 19)`                        | `page: 1, perPage: 20`           |
| `supabase.channel().on()`              | `client.realtime.subscribe()`    |
| `supabase.storage.from(bucket)`        | `client.files`                   |

## Common Patterns

### Authenticated Requests

**Supabase:**

```typescript
// Row Level Security handles auth
const { data } = await supabase.from("posts").select("*");
```

**SnackBase:**

```typescript
// Collection rules handle auth
const result = await client.records.list("posts");
```

### Pagination

**Supabase:**

```typescript
const { data } = await supabase.from("posts").select("*").range(0, 19);
```

**SnackBase:**

```typescript
const result = await client.records.list("posts", {
  page: 1,
  perPage: 20,
});
```

### Joins / Relations

**Supabase:**

```typescript
const { data } = await supabase
  .from("posts")
  .select("*, author(*), comments(*)");
```

**SnackBase:**

```typescript
const result = await client.records.list("posts", {
  expand: "author,comments",
});
```

## Troubleshooting

### "Relation not found"

- Use the `expand` parameter instead of joins
- Ensure relations are defined in collection schema

### Real-time events not received

- Ensure the collection has real-time enabled
- Check collection rules allow access
- Verify connection is established

### Authentication errors

- Check that user is verified
- Ensure collection rules are properly configured
