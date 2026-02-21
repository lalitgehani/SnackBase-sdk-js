# @snackbase/supabase-compat

A **drop-in replacement** for `@supabase/supabase-js` that points to a **SnackBase** backend.

Swap your imports, keep your code, and migrate from Supabase to self-hosted SnackBase in minutes.

## Quick Start

### 1. Install

```bash
npm install @snackbase/supabase-compat
```

### 2. Swap Import & URL

```diff
- import { createClient } from '@supabase/supabase-js'
- const supabase = createClient('https://xyz.supabase.co', 'anon-key')
+ import { createClient } from '@snackbase/supabase-compat'
+ const supabase = createClient('http://localhost:8000', 'your-api-key')
```

### 3. Use as Normal

```javascript
const { data, error } = await supabase
  .from("posts")
  .select("*")
  .eq("status", "published");
```

---

## Support Matrix

| Feature      | Supabase API                            | Status         | Notes                                |
| :----------- | :-------------------------------------- | :------------- | :----------------------------------- |
| **Auth**     | `auth.signUp()`, `signInWithPassword()` | ✅ Full        |                                      |
|              | `auth.signOut()`, `auth.getSession()`   | ✅ Full        |                                      |
|              | `auth.onAuthStateChange()`              | ✅ Full        |                                      |
|              | `auth.admin.*`                          | ✅ Full        | List, Create, Update, Delete, Invite |
|              | `auth.signInWithOAuth()`                | ✅ Full        | Returns redirect URL                 |
|              | `auth.signInAnonymously()`              | ❌ Unsupported | Use email/password                   |
| **Data**     | `from().select().eq().neq()`            | ✅ Full        |                                      |
|              | `.order()`, `.limit()`, `.range()`      | ✅ Full        |                                      |
|              | `.insert()`, `.update()`, `.delete()`   | ✅ Full        |                                      |
|              | `.upsert()`                             | ⚠️ Partial     | Create + Catch Conflict strategy     |
|              | `.rpc()`                                | ❌ Unsupported | No RPC support yet                   |
| **Storage**  | `storage.from().upload() / download()`  | ✅ Full        |                                      |
|              | `storage.from().getPublicUrl()`         | ✅ Full        |                                      |
|              | `storage.from().list()`                 | ❌ Unsupported |                                      |
| **Realtime** | `channel().on('postgres_changes')`      | ✅ Full        | Filter by table and event            |
|              | `presence` / `broadcast`                | ❌ Unsupported |                                      |

---

## Key Differences & Migration Tips

### 1. No "Buckets" in Storage

SnackBase treats storage as a flat file system. When you use `supabase.storage.from('avatars')`, we simply prefix your file paths with `avatars/`.

### 2. Error Handling

Like the Supabase SDK, all methods return `{ data, error }` and **never throw**.
SnackBase errors are automatically mapped to the Supabase error shape.

### 3. User Metadata

SnackBase doesn't have a native `user_metadata` field yet. `user.user_metadata` currently returns an empty object `{}` to maintain type compatibility.

### 4. Realtime Payload

Payloads are normalized to match Supabase's `postgres_changes` format:

```javascript
{
  schema: 'public',
  table: 'posts',
  eventType: 'INSERT',
  new: { ... },
  old: {},
  commit_timestamp: '...'
}
```

---

## Development & Testing

This package is part of the SnackBase-js monorepo and depends on `@snackbase/sdk`.

```bash
# Run tests
pnpm test

# Typecheck
pnpm typecheck

# Build
pnpm build
```

## License

MIT
