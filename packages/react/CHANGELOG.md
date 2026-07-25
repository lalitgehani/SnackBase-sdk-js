# Changelog

## Unreleased

## 0.4.0 - 2026-07-26

### Added

- **Codelist hooks** (requires `@snackbase/sdk` ≥ 0.7.0 with `client.codelists`):
  - `useCodelistValues(code, { lang, active, accountId, enabled })` — effective values for pickers
  - `useCodelists({ scope, active, enabled })` — list codelist metadata
  - `useCodelistOverride()` — `setOverride` / `clearOverride` with loading/error
- Prefer `useCodelistValues(code)` for shared picker dictionaries (example: a product-seeded `regions` list)

## 0.3.0

Parity release of `@snackbase/react` against `@snackbase/sdk` 0.6.x (Phases 1–4 of PRD-react-sdk-parity).

### Phase 1 — Correctness

- `useAuth` syncs full `AuthState` including real `expiresAt` (no hard-coded null)
- Subscribes to `auth:error`; exposes `error`
- `useSubscription` calls `realtime.connect()` when needed; `connected` only when transport is connected
- Shared collection subscriptions are ref-counted; latest callback always used
- Unit tests for `useRecord` and `useMutation`
- Provider JSDoc documents pre-built `client` contract

### Phase 2 — Core app parity

- `useAuth` app actions: `refreshAccessToken`, `getCurrentUser`, verify/OAuth/SAML helpers
- `useMutation`: `patch`, `batchCreate` / `batchUpdate` / `batchDelete`, `aggregate`
- `useQuery`: QueryBuilder factory + `enabled` option (params form unchanged)
- `useSubscription`: multi-handler form alongside legacy `(collection, event, callback)`
- Optional lightweight invalidation (`invalidateOnSuccess`, default **false**)
- Peer `react` / `react-dom` remain `>=18`

### Phase 3 — Domain hooks

- `useRealtime`, `useFiles`, `useInvitation`
- Config-based provider (`baseUrl` + config) with stable client identity
- Curated type re-exports from package entry
- `useGroups` / `useCurrentUser` explicitly deferred (see README)

### Phase 4 — Docs & hardening

- Mintlify docs use `@snackbase/react` (not `@snackbase/sdk/react`)
- Strict Mode / stale-fetch coverage for query & subscription
- Inventory test is a regression gate for new SDK service getters
- Security note: no token logging

### Phase 5 — Optional / deferred

- **Implemented:** `useClientAction`, intentional non-goals published, maintainer process in README
- **Deferred:** create-snackbase-app template refresh, subscription throttle option, formal post-release metrics schedule (owner: maintainers, 4–6 weeks post-publish)

### Migration notes

- Import from `@snackbase/react`, not `@snackbase/sdk/react`.
- Multi-handler subscription keys are `create` / `update` / `delete` (not `onCreate`).
- Token refresh action is `refreshAccessToken()`; state field remains `refreshToken: string | null`.
- Additive APIs only; existing `useQuery(collection, params)` and legacy `useSubscription` form remain valid.

## 0.2.0

Initial workspace package with provider + five domain hooks.
