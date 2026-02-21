# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-02-21

### Added

- `update_status` action — enable or disable a configuration via `updateConfigurationStatus(configId, enabled)`; returns `{ status, enabled, is_default }`
- `set_default` action — set a configuration as the default provider for its category and scope via `setConfigurationDefault(configId)`; provider must be enabled
- `unset_default` action — clear the default flag from a configuration via `unsetConfigurationDefault(configId)`

### Changed

- Updated `config_id` parameter description to cover the new enable/disable and default management actions

## [0.1.0] - 2026-02-01

### Added

- Initial release of `@snackbase/mcp` — MCP server for SnackBase
- `snackbase_admin` tool with actions: `get_stats`, `get_recent`, `list_system`, `list_account`, `get_values`, `update_values`, `create`, `list_providers`, `test_connection`
- `snackbase_collections` tool for collection management
- `snackbase_records` tool for record CRUD operations
- `snackbase_users` tool for user management
- `snackbase_accounts` tool for account management
- `snackbase_groups` tool for group management
- `snackbase_roles` tool for role management
- `snackbase_invitations` tool for invitation management
- `snackbase_api_keys` tool for API key management
- `snackbase_audit_logs` tool for audit log access
- `snackbase_email_templates` tool for email template management
- `snackbase_macros` tool for macro management
- `snackbase_files` tool for file operations
- `snackbase_migrations` tool for migration management
- `snackbase_dashboard` tool for dashboard metrics
- `snackbase_collection_rules` tool for collection rule management
