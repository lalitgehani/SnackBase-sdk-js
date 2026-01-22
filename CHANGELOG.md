# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of SnackBase SDK for JavaScript/TypeScript

### Features
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
- `@snackbase/sdk/react` - React integration

### Build Output
- ESM (`.mjs`) - 14.87 KB gzipped
- CommonJS (`.js`)
- TypeScript declarations (`.d.ts`)

## [0.1.0] - 2025-01-XX

### Added
- Initial beta release
- Complete Phase 1-4 implementation
- Core SDK features
- React hooks
- Real-time subscriptions
- Query builder
- 231 tests passing

## [Future Releases]

### Planned
- Integration tests with test server
- Performance benchmarks
- Request deduplication
- Advanced caching strategies
- Vue 3 integration
- Angular integration
- Svelte integration
