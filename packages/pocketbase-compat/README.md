# @snackbase/pocketbase-compat

A drop-in replacement for the `pocketbase` JS SDK that routes all requests to a SnackBase backend.

The compatibility client is created with `new PocketBase(url)` and exports both the
default `PocketBase` name and the named `PocketBaseCompat` class. It delegates storage,
authentication, records, and realtime behavior to `@snackbase/sdk`.

## Quick Start

### 1. Install

```bash
npm uninstall pocketbase
npm install @snackbase/pocketbase-compat
```

### 2. Update Imports

Replace your `pocketbase` imports with `@snackbase/pocketbase-compat`:

```diff
-import PocketBase from 'pocketbase';
+import PocketBase from '@snackbase/pocketbase-compat';

const pb = new PocketBase('http://127.0.0.1:8090');
```

That's it! Your existing PocketBase code now talks to SnackBase.

---

## Support Matrix

| Feature         | API                                                         | Status     | Notes                              |
| --------------- | ----------------------------------------------------------- | ---------- | ---------------------------------- |
| **Auth**        | `collection().authWithPassword()`                           | ✅ Full    |                                    |
|                 | `collection().authRefresh()`                                | ✅ Full    |                                    |
|                 | `collection().authWithOAuth2Code()`                         | ✅ Full    | Code-exchange flow                 |
|                 | `collection().authWithOAuth2()`                             | ⚠️ Partial | `urlCallback` only; no popup relay |
|                 | `collection().requestPasswordReset()`                       | ✅ Full    |                                    |
|                 | `collection().confirmPasswordReset()`                       | ✅ Full    |                                    |
|                 | `collection().requestVerification()`                        | ⚠️ Partial | Requires authenticated session     |
|                 | `collection().confirmVerification()`                        | ✅ Full    |                                    |
| **CRUD**        | `collection().getList()`                                    | ✅ Full    |                                    |
|                 | `collection().getFullList()`                                | ✅ Full    |                                    |
|                 | `collection().getFirstListItem()`                           | ✅ Full    |                                    |
|                 | `collection().getOne()`                                     | ✅ Full    |                                    |
|                 | `collection().create()`                                     | ✅ Full    | Includes FormData                  |
|                 | `collection().update()`                                     | ✅ Full    | Includes FormData                  |
|                 | `collection().delete()`                                     | ✅ Full    |                                    |
| **Realtime**    | `collection().subscribe('*', cb)`                           | ✅ Full    |                                    |
|                 | `collection().subscribe('recordId', cb)`                    | ✅ Full    |                                    |
|                 | `collection().unsubscribe()`                                | ✅ Full    |                                    |
|                 | `pb.realtime.subscribe()`                                   | ✅ Full    |                                    |
| **Collections** | `pb.collections.getList/getOne/create/update/delete`        | ✅ Full    |                                    |
| **Files**       | `pb.files.getURL()`                                         | ✅ Full    |                                    |
|                 | `pb.files.getToken()`                                       | ⚠️ Partial | Returns auth token                 |
| **Batch**       | `pb.createBatch().collection().create/update/delete/upsert` | ⚠️ Partial | Non-atomic                         |
| **Health**      | `pb.health.check()`                                         | ⚠️ Partial | Returns synthetic response         |
| **Auth Store**  | `pb.authStore.token/record/isValid/onChange/save/clear`     | ✅ Full    |                                    |
|                 | `pb.authStore.loadFromCookie/exportToCookie`                | ✅ Full    |                                    |

---

## Key Differences

1. **Field Names**: While we map most common PocketBase fields (`id`, `created`, `updated`), SnackBase may have additional system fields or slightly different behaviors for custom fields.
2. **Batch Operations**: Unlike PocketBase's atomic transactions, `@snackbase/pocketbase-compat` implements batches using `Promise.allSettled`. This means some operations in a batch may succeed while others fail.
3. **Filtering Syntax**: We support a large subset of PocketBase's filter syntax, but complex nested expressions may behave differently.
4. **Collection IDs**: SnackBase does not use the same ID format for collections. We provide stable approximations to maintain compatibility.

---

## Known Limitations

- `pb.collections.import()` is currently unsupported.
- `pb.backups`, `pb.crons`, `pb.settings`, and `pb.logs` are not supported and will throw a `NotSupportedError`.
- OAuth2 `authWithOAuth2()` only supports the direct callback flow; the popup relay mechanism is not implemented.
- `pb.health.check()` returns a synthetic healthy response because the SDK has no health endpoint.

---

## Development

```bash
# Build the package
pnpm build

# Run unit tests
pnpm test

# Run integration tests (requires live SnackBase at http://localhost:8000)
SNACKBASE_URL=http://localhost:8000 pnpm test:integration

# Type check
pnpm typecheck
```
