# Migrating from Firebase

This guide helps you migrate from Firebase to SnackBase.

## Overview

Both Firebase and SnackBase provide backend-as-a-service features. This guide highlights the key differences and provides migration examples.

## Key Differences

| Feature   | Firebase          | SnackBase                     |
| --------- | ----------------- | ----------------------------- |
| Client    | `initializeApp()` | `new SnackBaseClient()`       |
| Auth      | `getAuth()`       | `client.auth`                 |
| Database  | `getFirestore()`  | `client.records`              |
| Real-time | `onSnapshot()`    | `client.realtime.subscribe()` |
| Storage   | `getStorage()`    | `client.files`                |

## Installation

### Remove Firebase

```bash
npm uninstall firebase
```

### Install SnackBase

```bash
npm install @snackbase/sdk
```

## Initialization

### Firebase

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const app = initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
});

const auth = getAuth(app);
const db = getFirestore(app);
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

**Firebase:**

```typescript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// Sign up
const userCredential = await createUserWithEmailAndPassword(
  auth,
  "user@example.com",
  "password",
);

// Sign in
const userCredential = await signInWithEmailAndPassword(
  auth,
  "user@example.com",
  "password",
);

// Sign out
await signOut(auth);

// Listen to auth changes
const unsubscribe = onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User:", user.uid);
  }
});
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

// Listen to auth changes
const unsubscribe = client.on("auth:login", (state) => {
  console.log("User:", state.user.id);
});

client.on("auth:logout", () => {
  console.log("Logged out");
});
```

### OAuth Authentication

**Firebase:**

```typescript
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);
```

**SnackBase:**

```typescript
// OAuth requires redirect flow
// Step 1: Redirect to OAuth provider
window.location.href = "https://your-project.snackbase.dev/api/v1/oauth/google";

// Step 2: Handle callback
const authState = await client.auth.authenticateWithOAuth({
  provider: "google",
  code: "authorization-code",
  redirectUrl: window.location.origin + "/auth/callback",
});
```

### Password Reset

**Firebase:**

```typescript
import { sendPasswordResetEmail } from "firebase/auth";

await sendPasswordResetEmail(auth, "user@example.com");
```

**SnackBase:**

```typescript
await client.auth.forgotPassword({
  email: "user@example.com",
});
```

## Database Operations

### Add / Create Document

**Firebase:**

```typescript
import { addDoc, collection } from "firebase/firestore";

const docRef = await addDoc(collection(db, "posts"), {
  title: "Hello World",
  content: "My first post",
  createdAt: serverTimestamp(),
});
```

**SnackBase:**

```typescript
const record = await client.records.create("posts", {
  title: "Hello World",
  content: "My first post",
});
```

### Set / Replace Document

**Firebase:**

```typescript
import { doc, setDoc } from "firebase/firestore";

await setDoc(doc(db, "posts", "doc-id"), {
  title: "Updated Title",
  content: "Updated content",
});
```

**SnackBase:**

```typescript
const record = await client.records.replace("posts", "record-id", {
  title: "Updated Title",
  content: "Updated content",
});
```

### Update Document

**Firebase:**

```typescript
import { doc, updateDoc } from "firebase/firestore";

await updateDoc(doc(db, "posts", "doc-id"), {
  title: "Updated Title",
});
```

**SnackBase:**

```typescript
const record = await client.records.update("posts", "record-id", {
  title: "Updated Title",
});
```

### Get Document

**Firebase:**

```typescript
import { doc, getDoc } from "firebase/firestore";

const docSnap = await getDoc(doc(db, "posts", "doc-id"));
if (docSnap.exists()) {
  const data = docSnap.data();
}
```

**SnackBase:**

```typescript
const record = await client.records.get("posts", "record-id");
```

### Query / Get Documents

**Firebase:**

```typescript
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

const q = query(
  collection(db, "posts"),
  where("status", "==", "published"),
  orderBy("createdAt", "desc"),
);

const querySnapshot = await getDocs(q);
const posts = querySnapshot.docs.map((doc) => doc.data());
```

**SnackBase:**

```typescript
const result = await client.records.list("posts", {
  filter: { status: "published" },
  sort: "-createdAt",
});

console.log(result.items);
```

### Delete Document

**Firebase:**

```typescript
import { doc, deleteDoc } from "firebase/firestore";

await deleteDoc(doc(db, "posts", "doc-id"));
```

**SnackBase:**

```typescript
await client.records.delete("posts", "record-id");
```

### Real-Time Queries

**Firebase:**

```typescript
import { collection, query, onSnapshot } from "firebase/firestore";

const q = query(collection(db, "posts"));
const unsubscribe = onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      console.log("New post:", change.doc.data());
    }
  });
});

// Cleanup
unsubscribe();
```

**SnackBase:**

```typescript
const unsubscribe = client.realtime.subscribe("posts", (event) => {
  if (event.action === "create") {
    console.log("New post:", event.record);
  }
});

// Cleanup
unsubscribe();
```

### Query Operators

**Firebase:**

```typescript
import { collection, query, where } from "firebase/firestore";

// Equality
where("status", "==", "published");

// Greater than
where("views", ">", 100);

// Array contains
where("tags", "array-contains", "tech");

// In array
where("category", "in", ["tech", "science"]);
```

**SnackBase:**

```typescript
// Equality
filter: {
  status: "published";
}

// Greater than
filter: {
  views: {
    $gt: 100;
  }
}

// Or using query builder
client
  .query("posts")
  .filter("status", "=", "published")
  .filter("views", ">", 100);
```

## Storage

### Upload File

**Firebase:**

```typescript
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const storageRef = ref(storage, "files/image.jpg");
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);
```

**SnackBase:**

```typescript
const record = await client.files.upload(file);
const url = client.files.getUrl(record.token);
```

### Download File

**Firebase:**

```typescript
import { ref, getBytes } from "firebase/storage";

const storageRef = ref(storage, "files/image.jpg");
const bytes = await getBytes(storageRef);
```

**SnackBase:**

```typescript
const blob = await client.files.download("file-token");
```

### Delete File

**Firebase:**

```typescript
import { ref, deleteObject } from "firebase/storage";

const storageRef = ref(storage, "files/image.jpg");
await deleteObject(storageRef);
```

**SnackBase:**

```typescript
await client.records.delete("files", "record-id");
```

## React Integration

### Firebase with React

```tsx
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";

function Posts() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "posts"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPosts(data);
    });

    return unsubscribe;
  }, []);

  return <div>{/* ... */}</div>;
}
```

### SnackBase with React

```tsx
import {
  SnackBaseProvider,
  useQuery,
  useSubscription,
} from "@snackbase/sdk/react";

function App() {
  return (
    <SnackBaseProvider baseUrl="https://your-project.snackbase.dev">
      <Posts />
    </SnackBaseProvider>
  );
}

function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);

  // Initial fetch
  const { data } = useQuery<Post>("posts");

  useEffect(() => {
    if (data?.items) setPosts(data.items);
  }, [data]);

  // Real-time updates
  useSubscription("posts", "create", (event) => {
    setPosts((prev) => [...prev, event.record]);
  });

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

## Error Handling

**Firebase:**

```typescript
try {
  await addDoc(collection(db, "posts"), data);
} catch (error) {
  if (error instanceof FirebaseError) {
    console.error("Code:", error.code);
    console.error("Message:", error.message);
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

## Migration Checklist

### Step 1: Update Initialization

- [ ] Replace `initializeApp()` with `new SnackBaseClient()`
- [ ] Remove Firebase config
- [ ] Update configuration options

### Step 2: Update Authentication

- [ ] Replace `createUserWithEmailAndPassword()` with `client.auth.register()`
- [ ] Replace `signInWithEmailAndPassword()` with `client.auth.login()`
- [ ] Replace `signOut()` with `client.auth.logout()`
- [ ] Update auth state listeners
- [ ] Update OAuth flows

### Step 3: Update Database Operations

- [ ] Replace `addDoc()` with `client.records.create()`
- [ ] Replace `setDoc()` with `client.records.replace()`
- [ ] Replace `updateDoc()` with `client.records.update()`
- [ ] Replace `getDoc()` with `client.records.get()`
- [ ] Replace `getDocs()` with `client.records.list()`
- [ ] Replace `deleteDoc()` with `client.records.delete()`

### Step 4: Update Real-Time

- [ ] Replace `onSnapshot()` with `client.realtime.subscribe()`
- [ ] Update event handlers

### Step 5: Update Storage

- [ ] Replace Firebase Storage with `client.files`
- [ ] Update upload/download methods

### Step 6: Update Type Definitions

- [ ] Replace Firestore types with SnackBase types
- [ ] Update document ID references (id vs record.id)

### Step 7: Test

- [ ] Test authentication flows
- [ ] Test CRUD operations
- [ ] Test real-time subscriptions
- [ ] Test file operations

## Quick Reference

| Firebase                           | SnackBase                                         |
| ---------------------------------- | ------------------------------------------------- |
| `initializeApp()`                  | `new SnackBaseClient()`                           |
| `createUserWithEmailAndPassword()` | `client.auth.register()`                          |
| `signInWithEmailAndPassword()`     | `client.auth.login()`                             |
| `signOut()`                        | `client.auth.logout()`                            |
| `onAuthStateChanged()`             | `client.on('auth:login')`                         |
| `addDoc(collection, data)`         | `client.records.create(collection, data)`         |
| `setDoc(doc(), data)`              | `client.records.replace(collection, id, data)`    |
| `updateDoc(doc(), data)`           | `client.records.update(collection, id, data)`     |
| `getDoc(doc())`                    | `client.records.get(collection, id)`              |
| `getDocs(query)`                   | `client.records.list(collection, params)`         |
| `deleteDoc(doc())`                 | `client.records.delete(collection, id)`           |
| `where(field, '==', value)`        | `filter: { [field]: value }`                      |
| `orderBy(field, 'desc')`           | `sort: `-${toCamelCase(field)}`                   |
| `limit(20)`                        | `limit: 20`                                       |
| `onSnapshot(query, callback)`      | `client.realtime.subscribe(collection, callback)` |
| `uploadBytes(ref, file)`           | `client.files.upload(file)`                       |
| `getDownloadURL(ref)`              | `client.files.getUrl(token)`                      |

## Common Patterns

### Document IDs

**Firebase:**

```typescript
const docRef = await addDoc(collection(db, "posts"), data);
const id = docRef.id; // Auto-generated
```

**SnackBase:**

```typescript
const record = await client.records.create("posts", data);
const id = record.id; // Auto-generated
```

### Server Timestamps

**Firebase:**

```typescript
import { serverTimestamp } from "firebase/firestore";

await addDoc(collection(db, "posts"), {
  title: "Hello",
  createdAt: serverTimestamp(),
});
```

**SnackBase:**

```typescript
// Timestamps are automatic
await client.records.create("posts", {
  title: "Hello",
  // createdAt and updatedAt are added automatically
});
```

### Batch Operations

**Firebase:**

```typescript
import { writeBatch, doc } from "firebase/firestore";

const batch = writeBatch(db);
batch.set(doc(db, "posts", "id1"), data1);
batch.set(doc(db, "posts", "id2"), data2);
await batch.commit();
```

**SnackBase:**

```typescript
// Use Promise.all for batch operations
const [record1, record2] = await Promise.all([
  client.records.create("posts", data1),
  client.records.create("posts", data2),
]);
```

## Troubleshooting

### "Document not found"

- Ensure the record exists
- Check collection name spelling

### "Permission denied"

- Check collection rules
- Verify user is authenticated

### Real-time updates not working

- Ensure connection is established
- Check collection rules allow access
- Verify subscription is properly set up
