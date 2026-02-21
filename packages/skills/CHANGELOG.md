# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
