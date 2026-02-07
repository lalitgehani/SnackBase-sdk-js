# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
