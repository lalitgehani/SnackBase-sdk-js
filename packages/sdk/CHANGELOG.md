# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
