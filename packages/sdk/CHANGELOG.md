# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-07-21

Contract alignment with SnackBase backend **v0.7.x** (including post-v0.7.1 HEAD dashboard and workflow APIs). Prefer this release when targeting current server schemas.

### Breaking Changes

- **Collection `FieldType`**: aligned with the backend field enum.
  - **Removed** invalid SDK-only types: `relation`, `phone`, `select`, `multi_select`
  - **Added** backend types: `reference`, `file`, `computed`
  - Reference fields must use `type: 'reference'` (not `'relation'`) with `collection` and `on_delete` (`cascade` | `set_null` | `restrict`)
- **List query params** for automation services now match the backend (`limit` / `offset`), not `page` / `page_size`:
  - `EndpointListParams`, `EndpointExecutionListParams`
  - `WorkflowListParams`, `WorkflowInstanceListParams`
  - `WebhookDeliveryListParams`
- **`WebhookService.list()`** no longer accepts pagination arguments (backend returns all webhooks for the account)
- **`DashboardStats`** shape updated to the HEAD dashboard API (see Added / Changed). Clients typing against the old `SystemHealth` (`status` / `uptime` / `version`) or `recent_registrations: User[]` need updates

### Added

- `FieldDefinition` metadata required or returned by the backend: `on_delete`, `pii`, `mask_type` (plus existing `expression` / `return_type` for computed fields)
- Full custom **endpoint** request/response types: `description`, `auth_required`, `condition`, `actions`, `response_template`, `account_id`, `created_by`
- Endpoint / workflow list filters: `method`, `enabled`, `trigger_type`, instance `status`
- `DashboardService.getStats({ range?: '7d' | '30d' | '90d' })`
- Dashboard HEAD types: `range`, `previous_period`, `time_series`, `records_by_collection`, `feature_counts`, `jobs_by_status`, `hook_executions_summary`, `webhook_deliveries_summary`, `RecentRegistration`, corrected `SystemHealth` (`database_status`, `storage_usage_mb`)
- `WorkflowService.toggle(id)` → `PATCH /api/v1/workflows/{id}/toggle`
- `WorkflowService.resumeInstance(id)` (alias of `retryInstance`; hits `POST .../workflow-instances/{id}/resume`)
- Workflow step layout fields: `position_x`, `position_y` (visual editor; ignored by executor)
- Hook response extras: `account_id`, `cron`, `cron_description`

### Changed

- `FieldTypeToTs` / schema inference utilities map `reference`, `file`, and `computed` instead of removed type names
- Job retry documentation: retries jobs in **dead**, **failed**, or **retrying** status (not “cancelled”)
- Package typecheck config: valid `ignoreDeprecations` for TypeScript 5.9; unit test files excluded from `tsc --noEmit` for the package sources

### Migration notes

```ts
// Collections — reference fields
// before
{ name: 'author_id', type: 'relation', collection: 'users' }
// after
{ name: 'author_id', type: 'reference', collection: 'users', on_delete: 'cascade' }

// List automation resources
// before
client.workflows.list({ page: 1, page_size: 20 })
client.endpoints.list({ page: 1, page_size: 20 })
client.webhooks.listDeliveries(id, { page: 1, page_size: 10 })
// after
client.workflows.list({ limit: 20, offset: 0, trigger_type: 'manual', enabled: true })
client.endpoints.list({ limit: 20, offset: 0, method: 'GET', enabled: true })
client.webhooks.listDeliveries(id, { limit: 10, offset: 0 })
client.webhooks.list() // no pagination args

// Dashboard
const stats = await client.dashboard.getStats({ range: '30d' })
// stats.system_health.database_status, stats.time_series, stats.feature_counts, …

// Workflows
await client.workflows.toggle(workflowId)
```

## [0.5.0] - 2026-04-05

Major feature release aligning the SDK with SnackBase backend **v0.7.0** automation and records APIs (webhooks, hooks, endpoints, workflows, jobs, batch/aggregate, cursor pagination, filter rewrite).

### Breaking Changes

- **Record filters are string-only**: `RecordListParams.filter` is `string` (SQL-like expressions). Object filters are no longer JSON-stringified by `RecordService.list()`.
- **Legacy filter operators removed** from `FilterOperator` / query builder: `!~`, `?=`, `?!=` (never supported by the backend). Supported operators: `=`, `!=`, `>`, `>=`, `<`, `<=`, `~`, `IN`, `IS NULL`, `IS NOT NULL`.
- Direct query-param field filters (`?status=active`) are not used by the SDK; use `?filter=status = "active"` via the `filter` param.

### Added

#### Records

- **Cursor-based pagination** (alongside offset/`skip` pagination)
  - Params: `cursor`, `cursor_before`, `include_count`
  - Response: `next_cursor`, `prev_cursor`, `has_more`
  - `QueryBuilder.cursor(value)` / `QueryBuilder.cursorBefore(value)`
- **Batch operations** (atomic create/update/delete)
  - `RecordService.batchCreate(collection, records[])` → `POST /api/v1/records/{collection}/batch`
  - `RecordService.batchUpdate(collection, [{ id, data }])` → `PATCH .../batch`
  - `RecordService.batchDelete(collection, ids[])` → `DELETE .../batch`
  - Types: `BatchCreateRequest`, `BatchUpdateRequest`, `BatchDeleteRequest`, and matching response types
- **Aggregation**
  - `RecordService.aggregate(collection, params)` → `GET /api/v1/records/{collection}/aggregate`
  - Supports `functions`, `group_by`, `filter`, `having` (`AggregationParams` / `AggregationResponse`)
- **Expand** support on list/get for reference fields (`expand` query param)

#### Collections & access

- Computed field properties on `FieldDefinition`: `expression`, `return_type`
- `Collection.has_public_access?: boolean`
- `DashboardStats.public_collections_count`
- **Anonymous public collection access**: optional `accountId` on client config injects `X-Account-ID` when unauthenticated

#### Automation services (registered on `SnackBaseClient`)

- **`client.webhooks`** (`WebhookService`) — CRUD, `test`, `listDeliveries` under `/api/v1/webhooks`
- **`client.hooks`** (`HookService`) — CRUD, `toggle`, `trigger`, `listExecutions` under `/api/v1/hooks` (schedule / event / manual triggers)
- **`client.endpoints`** (`EndpointService`) — CRUD, `toggle`, `listExecutions` under `/api/v1/endpoints` (dispatch remains raw HTTP at `/api/v1/x/...`)
- **`client.workflows`** (`WorkflowService`) — CRUD, `trigger`, instance list/get/cancel/retry-resume under `/api/v1/workflows` and `/api/v1/workflow-instances`
- **`client.jobs`** (`JobService`) — superadmin job queue: `list`, `stats`, `retry`, `cancel` under `/api/v1/admin/jobs`

#### Other

- Expanded integration test coverage for jobs, dashboard, hooks, endpoints, admin, files, groups, invitations, migrations, and related services
- Realtime reconnection fix: prevent stale socket handlers from interfering with reconnect
- Service contract refactors for auth, webhooks, workflows, macros, audit logs, email templates, API keys, roles, and collections against the updated backend

### Changed

- Filter handling simplified to pass string expressions through to the API without legacy operator rewrites
- Collection API compatibility fixes for schema serialization (`schema` ↔ `fields` normalization where needed)

### Migration notes

```ts
// Filters — string expressions only
// before (no longer supported)
await client.records.list('posts', { filter: { status: 'active' } })
// after
await client.records.list('posts', { filter: 'status = "active"' })
// or
await client.records.query('posts').filter('status', '=', 'active').get()

// Cursor pagination
const page = await client.records.list('posts', { limit: 50, cursor: prev.next_cursor ?? undefined })
// page.next_cursor, page.prev_cursor, page.has_more

// Batch / aggregate
await client.records.batchCreate('items', [{ name: 'a' }, { name: 'b' }])
await client.records.aggregate('orders', { functions: 'count(),sum(total)', group_by: 'status' })

// Automation
await client.webhooks.create({ url, collection: 'posts', events: ['create'] })
await client.hooks.create({ name: 'on-create', trigger: { type: 'event', event: 'records.create' }, actions: [...] })
await client.workflows.trigger(workflowId, { key: 'value' })
await client.jobs.stats() // superadmin
```

## [0.4.0] - 2026-02-21

### Added

- `is_default?: boolean` field to `Configuration` interface (optional for backward compatibility with older backends)
- `SetDefaultResult` interface — response shape for `POST .../set-default`
- `UnsetDefaultResult` interface — response shape for `DELETE .../set-default`
- `UpdateConfigurationStatusResult` interface — accurate partial response for enable/disable PATCH endpoint (`{ status, enabled, is_default }`)
- `AdminService.setConfigurationDefault(configId)` — sets a configuration as the default provider for its category and account scope; only enabled providers can be set as default; atomically clears existing default in the same scope
- `AdminService.unsetConfigurationDefault(configId)` — clears the default flag from a configuration without setting a new default

### Changed

- **BREAKING**: `AdminService.updateConfigurationStatus()` return type corrected from `Promise<Configuration>` to `Promise<UpdateConfigurationStatusResult>` — the actual API response is a partial object `{ status, enabled, is_default }`, not a full `Configuration`

## [0.3.0] - 2026-02-15

### Added

- `TokenType` enum for token type detection
- `token_type` field to User interface (required)
- `tokenType` field to AuthState interface (required)
- `isSuperadmin()` method to SnackBaseClient and AuthManager
- `isApiKeySession()` method to check API key authentication
- `isPersonalTokenSession()` method to check personal token authentication
- `isOAuthSession()` method to check OAuth authentication
- `tokenType` getter on SnackBaseClient
- `SYSTEM_ACCOUNT_ID` constant for superadmin detection
- `detectTokenType()`, `isSuperadmin()`, `formatMaskedKey()`, `isValidTokenPrefix()` utility functions
- `extra_metadata.auth_method` support in audit logs
- `ApiKeyRestrictedError` error type
- `EmailVerificationRequiredError` error type

### Changed

- **BREAKING**: API key format changed to `sb_ak.<payload>.<signature>` (3-part)
- **BREAKING**: System account ID changed to nil UUID format
- **BREAKING**: `user.user_id` alias removed
- **BREAKING**: `User.token_type` is now required (not optional)
- **BREAKING**: `AuthState.tokenType` is now required (not optional)
- API key endpoint path changed to `/api/v1/admin/api-keys`
- Enhanced error messages for authentication failures
- Improved error handling for 403 responses

### Fixed

- Correct superadmin detection using new account ID format
- Proper masked key formatting for new API key format

### Security

- Token blacklist support for immediate revocation
- Enhanced audit logging with authentication method tracking

## [0.2.0] - 2025-01-XX

### Breaking Changes

- **Package Name Changes**: React integration moved from `@snackbase/sdk/react` to `@snackbase/react`
- **Field Name Convention**: API responses now use snake_case field names consistently
  - `createdAt` → `created_at`
  - `updatedAt` → `updated_at`
  - `collectionId` → `collection_id`
  - `collectionName` → `collection_name`
  - `authorId` → `author_id`
  - `emailVisibility` → `email_visibility`
- **Pagination API**: Changed from page-based to offset-based pagination
  - Removed: `page`, `perPage`, `totalItems`, `totalPages`
  - Added: `skip`, `limit`, `total`
- **Filter Format**: Record filters now use SQL-style expressions
  - Old: `{ status: "published" }`
  - New: `'status="published"'`
- **Collection Creation API**: Simplified collection schema definition
  - Old: `{ schema: { type: 'base', fields: [...] } }`
  - New: `{ fields: [...] }`
- **Collection Rule Fields**: Renamed to snake_case
  - `listRule` → `list_rule`, `viewRule` → `view_rule`, etc.
- **Authentication Response Fields**: Now properly handles snake_case from API
  - `refresh_token` (from API) mapped to `refreshToken`
  - `expires_in` (from API) mapped to `expiresAt`

### Added

- **Collection Export/Import**: Export and import collections with schemas and rules
  - `collections.export()` - Export collections to JSON format
  - `collections.import()` - Import collections with conflict strategies (error, skip, update)
  - `collections.listNames()` - Get list of collection names only
- **Audit Log PDF Export**: Export audit logs in PDF, CSV, or JSON format
  - `auditLogs.export(params, 'pdf')` - Returns base64-encoded PDF
- **Monorepo Structure**: Migrated to pnpm workspace with multiple packages
  - `@snackbase/sdk` - Core SDK package
  - `@snackbase/react` - React integration package
  - `@snackbase/examples` - Example implementations (Next.js, React Native, Vanilla, Vue)
  - `@snackbase/tsconfig` - Shared TypeScript configuration
  - `@snackbase/skills` - Claude Code skills for SDK development
- **Integration Tests**: Added comprehensive integration test suite
  - Authentication flow tests (register, login, logout, password reset)
  - Record CRUD tests with proper auth setup
- **Internal AuthManager Access**: Added `client.internalAuthManager` for advanced use cases
- **Filter Polyfill**: Record service now parses simple filter expressions for backend compatibility

### Changed

- **Package Manager**: Switched from npm to pnpm for monorepo management
- **Build System**: Updated to use Vitest workspace for unit/integration tests
- **TypeScript Configuration**: Centralized into `@snackbase/tsconfig` package
- **Import Paths**: React hooks now import from `@snackbase/react` instead of `@snackbase/sdk/react`

### Fixed

- Authentication service now correctly handles snake_case API responses
- Integration test setup improved with proper user verification
- Test password strength increased (`TestPass123!`)

### Developer Experience

- **Development Commands**: Updated for pnpm monorepo
  - `pnpm dev` - Watch mode for all packages
  - `pnpm build` - Build all packages
  - `pnpm test` - Run all tests
  - `pnpm test:unit` - Unit tests only
  - `pnpm test:integration` - Integration tests only

## [0.1.1] - 2025-01-XX

### Added

- Initial release of SnackBase SDK for JavaScript/TypeScript
- **Core Client**: `SnackBaseClient` with configuration validation
- **HTTP Client**: Fetch-based HTTP client with interceptors
- **Authentication**: Email/password, OAuth, SAML, and API key authentication
- **Services**: 17+ service classes for all SnackBase resources
  - Accounts, Users, Collections, Records
  - Roles, Collection Rules (Permission System V2)
  - Groups, Invitations, Macros
  - API Keys, Audit Logs, Dashboard, Admin
  - Email Templates, Files
- **Real-Time**: WebSocket/SSE support with automatic reconnection
- **Query Builder**: Fluent API for complex queries
- **React Integration**: Context provider and hooks
  - `useAuth`, `useQuery`, `useRecord`, `useMutation`, `useSubscription`
- **Type Safety**: Complete TypeScript definitions
- **Error Handling**: Typed error hierarchy
- **Storage Abstraction**: Platform-agnostic storage backends
- **Logging**: Structured logging system with configurable levels

### Package Exports

- `@snackbase/sdk` - Core SDK
- `@snackbase/sdk/react` - React integration (later renamed to `@snackbase/react`)

### Build Output

- ESM (`.mjs`) - 14.87 KB gzipped
- CommonJS (`.js`)
- TypeScript declarations (`.d.ts`)

## [Future Releases]

### Planned

- Performance benchmarks
- Request deduplication
- Advanced caching strategies
- Vue 3 integration
- Angular integration
- Svelte integration
