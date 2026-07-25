# @snackbase/mcp

Model Context Protocol (MCP) server for [SnackBase](https://github.com/snackbase). Exposes SnackBase domain operations as MCP tools for AI agents (Claude, Cursor, etc.).

## Requirements

- Node.js 20+
- A SnackBase backend URL and **API key** (MCP does not support interactive login)

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `SNACKBASE_URL` | yes | Base URL of the SnackBase API |
| `SNACKBASE_API_KEY` | yes | API key (`sb_ak.…`) |
| `SNACKBASE_ACCOUNT_ID` | no | Account scope when the key can access multiple accounts |
| `SNACKBASE_TIMEOUT` | no | Request timeout ms (default 30000) |
| `SNACKBASE_DEBUG` | no | Extra stderr logging |

### Auth policy (API key only)

- Tools run with the **permissions of the API key** (service principal).
- **No** password login, OAuth, SAML, register, or reset tools.
- Prefer least-privilege keys. Superadmin keys can manage jobs/admin configs for all tenants — treat as high blast radius.
- Do not store tokens on disk; the client factory reads env only.

### Optional live smoke

```bash
export SNACKBASE_URL=http://localhost:8000
export SNACKBASE_API_KEY=your-key
# Call ListTools / a read action via your MCP client, or drive the SDK:
# list collections, list webhooks, list jobs (superadmin)
```

Smoke is skipped when env is unset; unit + structural tests remain the CI gate.

## Registered tools (22)

| Tool | Domain |
|------|--------|
| `snackbase_collections` | Collection schemas |
| `snackbase_records` | Record CRUD / batch / aggregate |
| `snackbase_collection_rules` | Access rules |
| `snackbase_users` | Users (incl. resend verification) |
| `snackbase_groups` | Groups |
| `snackbase_roles` | Roles |
| `snackbase_accounts` | Accounts |
| `snackbase_invitations` | Admin invitations (not public accept) |
| `snackbase_api_keys` | API keys |
| `snackbase_admin` | Provider / configuration admin |
| `snackbase_dashboard` | Stats (`range` optional) |
| `snackbase_audit_logs` | Audit logs |
| `snackbase_email_templates` | Templates + logs |
| `snackbase_macros` | SQL macros |
| `snackbase_migrations` | Migration status |
| `snackbase_webhooks` | Outbound webhooks |
| `snackbase_hooks` | Hooks automation |
| `snackbase_endpoints` | Custom HTTP endpoints |
| `snackbase_workflows` | Workflows + instances |
| `snackbase_jobs` | Job queue (**superadmin**) |
| `snackbase_files` | Download URL + delete |
| `snackbase_codelists` | Shared dictionaries / effective values |

### Intentional non-exposure

| Surface | Reason |
|---------|--------|
| Auth interactive (login/OAuth/SAML/register/reset) | API-key-only MCP security model |
| Realtime (WebSocket/SSE) | Long-lived streams; use `@snackbase/sdk` realtime in app code |
| `records.query` QueryBuilder | Fluent builder, not a single RPC |
| Invitation `getPublic` / `accept` | End-user browser flows |
| File `upload` | Binary multipart not safe over MCP without encoding design |

## Action and pagination conventions

- MCP actions are **snake_case**; handlers map to SDK **camelCase** methods.
- Prefer **`limit`/`offset`** for list params unless the SDK service truly uses **`page`/`page_size`** (accounts, users, groups, invitations, collections).
- Records use **`skip`/`limit`** plus optional cursor fields.
- Webhooks **list** has no pagination; deliveries use `limit`/`offset`.

Enforced by `tests/sdk-mcp-coverage.test.ts` (known bad patterns: `per_page` on jobs, two-arg `getInstance`, etc.).

## SDK–MCP parity gate

When adding a public method to `packages/sdk/src/core/*-service.ts`:

1. Add an MCP action in the matching tool **or**
2. Add the method to `INTENTIONAL_NON_EXPOSURE` in `tests/sdk-mcp-coverage.test.ts` with a rationale comment.

Same monorepo PR preferred. CI runs `pnpm --filter @snackbase/mcp test`.

## Realtime decision

**Keep intentional non-exposure** for this release. Alternatives: use `@snackbase/sdk` `client.realtime` in application code. A streaming MCP design would require a separate PRD.

## Development

```bash
pnpm --filter @snackbase/mcp test
pnpm --filter @snackbase/mcp typecheck
pnpm --filter @snackbase/mcp build
# stdio entry
node packages/mcp/dist/index.mjs   # requires env
```

## Release checklist

- [ ] Coverage + unit tests green
- [ ] typecheck + build green
- [ ] CHANGELOG updated
- [ ] Version bumped
- [ ] docs/mcp lists registered tools only
- [ ] Skills package does not invent unregistered `snackbase_*` tool names
- [ ] Intentional allowlist reviewed

## License

See repository root.
