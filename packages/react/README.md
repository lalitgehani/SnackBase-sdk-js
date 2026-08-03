# @snackbase/react

React bindings for [SnackBase](https://snackbase.dev) — thin hooks over `@snackbase/sdk`.

**Peer dependencies:** `react` / `react-dom` `>=18`  
**SDK:** `@snackbase/sdk` `0.8.x` (workspace dependency during development)

## Install

```bash
pnpm add @snackbase/react @snackbase/sdk react
```

## Quick start

```tsx
import { SnackBaseClient } from "@snackbase/sdk";
import {
  SnackBaseProvider,
  useAuth,
  useQuery,
  useMutation,
  useSubscription,
} from "@snackbase/react";

const client = new SnackBaseClient({ baseUrl: "http://localhost:8000" });

function App() {
  return (
    <SnackBaseProvider client={client}>
      <Main />
    </SnackBaseProvider>
  );
}

// Or config form:
// <SnackBaseProvider baseUrl="http://localhost:8000"><Main /></SnackBaseProvider>
```

## Hooks

| Hook | Purpose |
| ---- | ------- |
| `useAuth` | Auth state (`expiresAt`, session flags) + app auth actions |
| `useQuery` | List + QueryBuilder + `enabled` |
| `useRecord` | Single record |
| `useMutation` | create / update / patch / del / batch / aggregate (+ optional invalidation) |
| `useSubscription` | Realtime events (legacy callback **or** multi-handler) |
| `useRealtime` | Connection state / connect / disconnect |
| `useFiles` | upload / getDownloadUrl / remove |
| `useInvitation` | public get + accept |
| `useCodelistValues` | Effective values for shared picker dictionaries |
| `useCodelists` | List codelist metadata |
| `useCodelistOverride` | Set / clear account-level codelist overrides |
| `useClientAction` | Generic `{ run, loading, error, data, reset }` for any async fn |
| `useSnackBase` | Raw client escape hatch |

### Auth note

`AuthState.refreshToken` is the **refresh token string**. The action that calls `client.refreshToken()` is named **`refreshAccessToken`** to avoid a TypeScript/runtime name clash.

### Mutation invalidation

```ts
useMutation("posts", { invalidateOnSuccess: true }); // default false
```

When true, successful mutations notify mounted `useQuery` / `useRecord` for the same collection.

## Intentional non-wrappers (admin)

There are **no** dedicated hooks for:

`admin`, `migrations`, `jobs`, `webhooks`, `hooks`, `endpoints`, `workflows`, `macros`, `collectionRules`, `auditLogs`, `dashboard`, `emailTemplates`, collections schema CRUD, `accounts`, and related tenancy admin APIs.

Use:

```tsx
const client = useSnackBase();
await client.workflows.list();
// or
const { run, loading } = useClientAction(() => client.jobs.list());
```

A full React admin kit would be a separate package/PRD.

### Deferred app helpers

- **`useGroups` / `useCurrentUser` profile hooks** — deferred; use `useRecord` / `useSnackBase().groups` / `useAuth().getCurrentUser` for now.
- **Template updates (`create-snackbase-app`)** — deferred to a follow-up; templates still work with existing client patterns.
- **Subscription event throttle** — deferred (default off); handlers already avoid provider-wide re-renders.
- **Post-release metrics review** — schedule 4–6 weeks after npm publish (owner: SDK maintainers).

## Security

- Hooks never `console.log` tokens or passwords.
- Do not render `token` / `refreshToken` in UI.
- OAuth/SAML only delegate to the SDK.

## Maintainer process: new SDK service

When `@snackbase/sdk` adds a client `*Service` getter:

1. Update `EXPECTED_SERVICE_GETTERS` in `src/sdk-react-gap-inventory.test.ts` (CI fails until you do).
2. Decide: **dedicated hook** (add to `HOOK_COVERED_SERVICES`) or **intentional non-wrapper** (add to `INTENTIONAL_NON_WRAPPERS` + README).
3. Ship hook + tests, or document the non-wrapper.

Example PR note: *“Added `client.billing` → intentional non-wrapper via `useSnackBase()` until product demand.”*

## SDK compatibility

The React package is intentionally a thin integration over `@snackbase/sdk`. Keep the
two packages on the same release line when possible; the current package release targets
SDK `0.8.x` and exposes `client.codelists` through the codelist hooks.

## Docs

Mintlify: `/sdk/js/react/*` (setup, use-auth, use-query, use-record, use-mutation, use-subscription).

## Development

```bash
pnpm --filter @snackbase/react test
pnpm --filter @snackbase/react typecheck
pnpm --filter @snackbase/react build
```

## License

MIT
