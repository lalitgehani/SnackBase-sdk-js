# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`snackbase_codelists`** tool for first-class codelists (list/get/get_values, create/update/delete, create_value, set_override/clear_override)
- Coverage inventory includes SDK `client.codelists` and 22 registered domain tools
- Prefer `get_values` for shared picker dictionaries created by operators/product seeds

## [0.3.0] - 2026-07-21

### Added

- Registered automation tools previously implemented but unwired: `snackbase_webhooks`, `snackbase_hooks`, `snackbase_endpoints`, `snackbase_workflows`, `snackbase_jobs`
- `snackbase_files` tool with `get_download_url` and `delete` (upload remains intentional non-exposure)
- Workflow actions: `toggle`, `resume_instance` (instance ops use global `instance_id` only)
- Admin actions: `delete`, `get_provider_schema`
- Users action: `resend_verification`
- API keys action: `get` and list `limit`/`offset`
- Email templates action: `get_log`
- Dashboard `range` param (`7d` | `30d` | `90d`)
- Records list `include_count`
- Structural parity gate `tests/sdk-mcp-coverage.test.ts` with intentional non-exposure allowlist
- Package README: auth policy, pagination conventions, SDK drift process, realtime decision

### Fixed

- Workflow instance handlers now call SDK with single `instance_id` (no spurious `workflow_id`)
- Webhook create uses `WebhookCreate` (`url`, `collection`, `events`, …) — removed unsupported `name`
- Webhook `list()` takes no pagination args; `list_deliveries` uses `limit`/`offset`
- Jobs list uses `limit`/`offset` and SDK status enum (`pending`|`running`|`completed`|`failed`|`retrying`|`dead`)
- Endpoints list/executions use `limit`/`offset`; create/update expose full `EndpointCreate` fields
- Admin create maps to `ConfigurationCreate` (`display_name`, `config`, …)
- Users create maps to `UserCreate` (`role_id: number`)
- Invitations list uses `status_filter` (not `status`)
- Macro `test` params schema is `string[]`
- Email template render body fields align with SDK (`subject`/`html_body`/`text_body`)
- Collections field `type` enum matches SDK `FieldType` (`reference`/`file`/`computed`; removed obsolete `phone`/`select`/`multi_select`/`relation`)
- Collections create/update no longer send `has_public_access` or use `as any` (field is not on `CollectionCreate`/`CollectionUpdate`)

### Changed

- Server version metadata → `0.3.0`; 21 registered domain tools
- Jobs/endpoints/hooks/workflows pagination preferred style: `limit`/`offset` (breaking vs prior page/per_page on those tools)

### Documentation

- Mintlify `docs/mcp` updated for full registered set and intentional non-exposures
- Configuration docs: API-key-only auth and superadmin key blast radius notes

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
- Domain tools for collections, records, users, accounts, groups, roles, invitations, api keys, admin, audit logs, email templates, macros, migrations, dashboard, collection rules
