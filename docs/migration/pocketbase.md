# Migrating from PocketBase

This guide helps you migrate from PocketBase to SnackBase.

## Overview

Both PocketBase and SnackBase are backend-as-a-service platforms with similar features. This guide highlights the key differences and provides migration examples.

## Key Differences

| Feature   | PocketBase                          | SnackBase                                 |
| --------- | ----------------------------------- | ----------------------------------------- |
| Client    | `new PocketBase('url')`             | `new SnackBaseClient({ baseUrl: 'url' })` |
| Auth      | `pb.authStore`                      | `client.auth` + `client.authManager`      |
| Records   | `pb.collection('name')`             | `client.records`                          |
| Real-time | `pb.collection('name').subscribe()` | `client.realtime.subscribe()`             |
| Types     | Manual definitions                  | Built-in TypeScript types                 |

## Installation

### Remove PocketBase

```bash
npm uninstall pocketbase
```

### Install SnackBase

```bash
npm install @snackbase/sdk
```

## Initialization

### PocketBase

```typescript
import PocketBase from "pocketbase";

const pb = new PocketBase("https://your-project.pocketbase.io");
```

### SnackBase

```typescript
import { SnackBaseClient } from "@snackbase/sdk";

const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  apiKey: process.env.SNACKBASE_API_KEY, // Optional
});
```

## Authentication

### Email/Password Authentication

**PocketBase:**

```typescript
// Login
const authData = await pb
  .collection("users")
  .authWithPassword("user@example.com", "password");

// Access user
const user = pb.authStore.model;

// Logout
pb.authStore.clear();
```

**SnackBase:**

```typescript
// Login
const authState = await client.auth.login({
  email: "user@example.com",
  password: "password",
});

// Access user
const user = client.user;

// Logout
await client.auth.logout();
```

### OAuth Authentication

**PocketBase:**

```typescript
const authData = await pb
  .collection("users")
  .authWithOAuth2({ provider: "google" });
```

**SnackBase:**

```typescript
const authState = await client.auth.authenticateWithOAuth({
  provider: "google",
  code: "authorization-code",
  redirectUrl: "https://your-app.com/callback",
});
```

### Auth State Management

**PocketBase:**

```typescript
// Check if authenticated
const isAuthenticated = pb.authStore.isValid;

// Get token
const token = pb.authStore.token;

// Listen to changes
pb.authStore.subscribe((token, model) => {
  console.log("Auth changed:", token, model);
});
```

**SnackBase:**

```typescript
// Check if authenticated
const isAuthenticated = client.isAuthenticated;

// Get token
const token = client.auth.token;

// Listen to changes
client.on("auth:login", (state) => {
  console.log("Logged in:", state);
});

client.on("auth:logout", () => {
  console.log("Logged out");
});
```

## Record Operations

### List Records

**PocketBase:**

```typescript
const records = await pb.collection("posts").getList(1, 20, {
  filter: 'status = "published"',
  sort: "-created",
});

console.log(records.items);
console.log(records.totalPages);
```

**SnackBase:**

```typescript
const result = await client.records.list("posts", {
  page: 1,
  perPage: 20,
  filter: { status: "published" },
  sort: "-createdAt",
});

console.log(result.items);
console.log(result.totalPages);
```

### Get Single Record

**PocketBase:**

```typescript
const record = await pb.collection("posts").getOne("record-id");
```

**SnackBase:**

```typescript
const record = await client.records.get("posts", "record-id");
```

### Create Record

**PocketBase:**

```typescript
const record = await pb.collection("posts").create({
  title: "Hello World",
  content: "My first post",
});
```

**SnackBase:**

```typescript
const record = await client.records.create("posts", {
  title: "Hello World",
  content: "My first post",
});
```

### Update Record

**PocketBase:**

```typescript
const record = await pb.collection("posts").update("record-id", {
  title: "Updated Title",
});
```

**SnackBase:**

```typescript
const record = await client.records.update("posts", "record-id", {
  title: "Updated Title",
});
```

### Delete Record

**PocketBase:**

```typescript
await pb.collection("posts").delete("record-id");
```

**SnackBase:**

```typescript
await client.records.delete("posts", "record-id");
```

## Real-Time Subscriptions

### Subscribe to Changes

**PocketBase:**

```typescript
// Subscribe to all events
const unsubscribe = await pb.collection("posts").subscribe("*", (e) => {
  console.log("Action:", e.action);
  console.log("Record:", e.record);
});

// Unsubscribe
unsubscribe();
```

**SnackBase:**

```typescript
// Subscribe to all events
const unsubscribe = client.realtime.subscribe("posts", (event) => {
  console.log("Action:", event.action);
  console.log("Record:", event.record);
});

// Unsubscribe
unsubscribe();
```

### Filtered Subscriptions

**PocketBase:**

```typescript
await pb.collection("posts").subscribe("*", (e) => {
  // Filter client-side
  if (e.record.status === "published") {
    console.log("Published post:", e.record);
  }
});
```

**SnackBase:**

```typescript
// Server-side filtering
client.realtime.subscribe(
  "posts",
  { filter: 'status = "published"' },
  (event) => {
    console.log("Published post:", event.record);
  },
);
```

## Query Builder

**PocketBase:**

```typescript
// PocketBase doesn't have a query builder
// Use filter strings
const records = await pb.collection("posts").getList(1, 20, {
  filter: 'status = "published" && created > "2024-01-01"',
  sort: "-created",
});
```

**SnackBase:**

```typescript
// Use the fluent query builder
const result = await client
  .query("posts")
  .filter("status", "=", "published")
  .filter("createdAt", ">", "2024-01-01")
  .sort("createdAt", "desc")
  .page(1)
  .perPage(20)
  .execute();
```

## File Uploads

**PocketBase:**

```typescript
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("title", "My File");

const record = await pb.collection("files").create(formData);
```

**SnackBase:**

```typescript
const record = await client.files.upload(fileInput.files[0], {
  collection: "files",
  field: "file",
});

// Or create a record with file
const record = await client.records.create("files", {
  title: "My File",
  file: fileInput.files[0],
});
```

## Error Handling

**PocketBase:**

```typescript
import { ClientResponseError } from "pocketbase";

try {
  await pb.collection("posts").create(data);
} catch (e) {
  if (e instanceof ClientResponseError) {
    console.error("Status:", e.status);
    console.error("Data:", e.data);
    console.error("Message:", e.message);
  }
}
```

**SnackBase:**

```typescript
import { ValidationError, SnackBaseError } from "@snackbase/sdk";

try {
  await client.records.create("posts", data);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Fields:", error.fields);
  } else if (error instanceof SnackBaseError) {
    console.error("Message:", error.message);
  }
}
```

## React Integration

### PocketBase with React

```tsx
import PocketBase from "pocketbase";
import { createContext, useContext } from "react";

const pb = new PocketBase("https://your-project.pocketbase.io");

const PBContext = createContext(pb);

function App() {
  return (
    <PBContext.Provider value={pb}>
      <YourApp />
    </PBContext.Provider>
  );
}

// Custom hook
function usePB() {
  return useContext(PBContext);
}
```

### SnackBase with React

```tsx
import { SnackBaseProvider, useAuth, useQuery } from "@snackbase/sdk/react";

function App() {
  return (
    <SnackBaseProvider baseUrl="https://your-project.snackbase.dev">
      <YourApp />
    </SnackBaseProvider>
  );
}

function Posts() {
  const { user } = useAuth();
  const { data } = useQuery<Post>("posts");

  return (
    <div>
      {user && <p>Welcome, {user.name}</p>}
      {data?.items.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

## Migration Checklist

### Step 1: Update Initialization

- [ ] Replace `new PocketBase()` with `new SnackBaseClient()`
- [ ] Update configuration options
- [ ] Add API key if needed

### Step 2: Update Authentication

- [ ] Replace `pb.collection('users').authWithPassword()` with `client.auth.login()`
- [ ] Update auth state access (`pb.authStore` → `client.user`)
- [ ] Update auth listeners

### Step 3: Update Record Operations

- [ ] Replace `pb.collection('name')` with `client.records`
- [ ] Update `getList()` to `list()`
- [ ] Update `getOne()` to `get()`
- [ ] Update filter syntax for queries

### Step 4: Update Real-Time

- [ ] Replace `subscribe()` with `client.realtime.subscribe()`
- [ ] Update event handler signatures
- [ ] Move client-side filters to server-side

### Step 5: Update Error Handling

- [ ] Replace `ClientResponseError` with typed errors
- [ ] Update error type checking

### Step 6: Update Type Definitions

- [ ] Replace manual types with SDK types
- [ ] Update generic usage for records

### Step 7: Test

- [ ] Test authentication flows
- [ ] Test CRUD operations
- [ ] Test real-time subscriptions
- [ ] Test error handling

## Quick Reference

| PocketBase                                  | SnackBase                                  |
| ------------------------------------------- | ------------------------------------------ |
| `pb.authStore.token`                        | `client.auth.token`                        |
| `pb.authStore.model`                        | `client.user`                              |
| `pb.authStore.isValid`                      | `client.isAuthenticated`                   |
| `pb.authStore.clear()`                      | `client.auth.logout()`                     |
| `pb.collection(name)`                       | `client.records`                           |
| `pb.collection('users').authWithPassword()` | `client.auth.login()`                      |
| `pb.collection('users').create()`           | `client.auth.register()`                   |
| `getList(page, perPage, options)`           | `list(collection, { page, perPage, ... })` |
| `getOne(id)`                                | `get(collection, id)`                      |
| `create(data)`                              | `create(collection, data)`                 |
| `update(id, data)`                          | `update(collection, id, data)`             |
| `delete(id)`                                | `delete(collection, id)`                   |
| `subscribe(event, callback)`                | `realtime.subscribe(collection, callback)` |

## Common Patterns

### Authenticated Requests

**PocketBase:**

```typescript
// Token is automatically included
const posts = await pb.collection("posts").getList(1, 20);
```

**SnackBase:**

```typescript
// Token is automatically included
const posts = await client.records.list("posts", { page: 1, perPage: 20 });
```

### Pagination

**PocketBase:**

```typescript
const page1 = await pb.collection("posts").getList(1, 20);
const page2 = await pb.collection("posts").getList(2, 20);
```

**SnackBase:**

```typescript
const page1 = await client.records.list("posts", { page: 1, perPage: 20 });
const page2 = await client.records.list("posts", { page: 2, perPage: 20 });
```

### Filtering

**PocketBase:**

```typescript
const posts = await pb.collection("posts").getList(1, 20, {
  filter: 'status = "published" && category = "tech"',
});
```

**SnackBase:**

```typescript
// Option 1: Filter string
const posts = await client.records.list("posts", {
  filter: 'status = "published" && category = "tech"',
});

// Option 2: Filter object
const posts = await client.records.list("posts", {
  filter: { status: "published", category: "tech" },
});
```

## Troubleshooting

### "Collection not found"

- Ensure the collection exists in SnackBase
- Check collection name spelling

### "Authentication failed"

- Verify user credentials
- Check if user is verified
- Ensure account ID is correct for multi-account projects

### Real-time events not received

- Verify connection is established
- Check filter syntax
- Ensure collection rules allow access
