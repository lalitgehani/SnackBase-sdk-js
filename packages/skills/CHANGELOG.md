# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Deferred (non-blocking)

- Skills for `@snackbase/react`, `@snackbase/pocketbase-compat`, `@snackbase/supabase-compat`
- Exhaustive OpenAPI dump / full workflow action-type catalog
- Multi-language client skills

## [0.4.0] - 2026-08-03

### Changed

- Release alignment with `@snackbase/sdk` 0.8.0 and SnackBase backend 0.8.0.
- The codelist guidance remains the source of truth for shared dictionaries and effective values.

## [0.3.0] - 2026-07-26

### Added

- **`references/codelists.md`** — first-class `client.codelists` guidance (list/get/getValues, admin manage, overrides)
- Client and API reference maps include `codelists` for `@snackbase/sdk` ≥ 0.7.0

### Changed

- Prefer `client.codelists.getValues(code)` for shared picker dictionaries created by operators or product seeds (no platform-default regions list)

## [0.2.0] - 2026-07-21

### Changed

- **SDK 0.6.0 alignment** — skill tree rewritten against `@snackbase/sdk` 0.5.0/0.6.0 contracts
- Filters documented as **string-only** (removed object filter auto-JSON-stringify guidance)
- Records: `batchCreate` / `batchUpdate` / `batchDelete` (removed `bulk*`), correct aggregate params, cursor pagination, `query()` builder
- Collections: valid FieldTypes including `reference`, `file`, `computed` (removed `relation` / `select` / `multi_select` / `phone` as field types)
- Webhooks: events `create`|`update`|`delete`; `test` + `listDeliveries`; secret only on create (removed `getSecret` / `rotateSecret` / `trigger`)
- Client: full service map; `accountId` for anonymous public access; `collectionRules` instead of inventing `PermissionService`
- Files: `upload(file, { filename?, contentType? })`, `getDownloadUrl`, `delete`
- Admin types aligned to `display_name` / `config` create payload
- Auth/errors refresh (TokenType, snake_case reset fields, `ApiKeyRestrictedError`, `EmailVerificationRequiredError`)

### Added

- Automation guides: `hooks.md`, `endpoints.md`, `workflows.md`, `jobs.md`, `dashboard.md`
- Secondary guides: `realtime.md`, `access-control.md`, `platform.md` (macros, email templates, migrations, API keys)
- Structural gate: `scripts/verify-against-sdk.mjs` (`pnpm verify`)
- Process notes: SDK release coupling, MCP vs skills boundary, deferred backlog, agent-failure feedback

### Removed

- Local dual tree `packages/skills/.claude/skills` as a second source of truth (publish/install source is only `skills/snackbase/`)

## [0.1.0] - 2026-02-21

### Added

- Initial public release of `@snackbase/skills` — Claude AI skills for SnackBase SDK development
- `snackbase` skill with comprehensive reference guides:
  - `references/admin.md` — Full `AdminService` reference covering configuration management, provider management, default provider management (v0.6.0+), and MCP tool action mapping
  - `references/api-reference.md` — Complete service method signatures for all SDK services including `AdminService`
  - `references/authentication.md` — Authentication flows reference
  - `references/client.md` — Client initialization reference
  - `references/collections.md` — Collection management reference
  - `references/records.md` — Record CRUD reference
  - `references/errors.md` — Error handling reference
  - `references/files.md` — File upload/download reference
  - `references/webhooks.md` — Webhook/event handling reference
  - `references/testing.md` — Vitest testing patterns reference
  - `references/storage.md` — Storage backend configuration reference
- Skill triggers on: SnackBase, `@snackbase/sdk`, `SnackBaseClient`, any SnackBase service name, or admin configuration terms
