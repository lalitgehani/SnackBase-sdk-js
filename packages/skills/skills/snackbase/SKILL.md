---
name: snackbase-sdk
description: >
  SnackBase JavaScript/TypeScript SDK patterns, best practices, and API reference.
  Use when working with the SnackBase-js client library (@snackbase/sdk ≥ 0.7.0) for any of
  these tasks: (1) Initializing SnackBaseClient with configuration options including accountId,
  (2) Implementing authentication flows (email/password, OAuth, SAML, API keys),
  (3) Performing CRUD operations on collections or records with string filters and batch APIs,
  (4) Uploading or downloading files, (5) Managing webhooks (create/test/listDeliveries),
  (6) Authoring hooks, workflows, custom endpoints, and jobs (automation services),
  (7) Reading dashboard stats with getStats({ range }),
  (8) Subscribing to realtime collection events,
  (9) Managing collection rules, groups, invitations, and roles (not PermissionService),
  (10) Handling SDK errors (AuthenticationError, ValidationError, ApiKeyRestrictedError, etc.),
  (11) Writing tests that mock HttpClient with Vitest,
  (12) Configuring storage backends, macros, email templates, migrations, API keys,
  (13) Managing system/account configurations and providers via AdminService,
  (14) Using first-class codelists (client.codelists / useCodelistValues) for shared
  dimensions such as regions pickers — not collection fan-out.
  Trigger on mentions of SnackBase, @snackbase/sdk, SnackBaseClient, hooks, workflows,
  endpoints, jobs, dashboard, realtime, collection rules, codelists, controlled terminology,
  regions catalog, or any SnackBase service name.
---

# SnackBase SDK

Aligned with **@snackbase/sdk ≥ 0.7.0**. Skills document the TypeScript client only
(not MCP tool schemas — see [@snackbase/mcp](https://www.npmjs.com/package/@snackbase/mcp)
for Claude tool-use servers).

## Key Principles

1. Services always return `response.data`, never the full response object
2. Auth is handled by HTTP interceptors — services never manage auth headers directly
3. Array query params are comma-joined: `fields: ['id', 'name']` becomes `?fields=id,name`
4. **Filters are strings only** (SQL-like expressions). There is no object-filter auto-JSON-stringify.
   Example: `filter: 'status = "active" AND priority > 3'`
5. Use `PATCH` / `client.records.patch` for partial updates; use `PUT` / `client.records.update` for full replacements
6. Valid **FieldType** values: `text`, `number`, `boolean`, `datetime`, `email`, `url`, `json`,
   `reference`, `file`, `date`, `computed` (not `relation`, `select`, `multi_select`, or `phone`)
7. Automation accessors: `client.hooks`, `client.endpoints`, `client.workflows`, `client.jobs`
8. Dashboard: `client.dashboard.getStats({ range: '7d' | '30d' | '90d' })`
9. Anonymous public collection access: set config `accountId` (sends `X-Account-ID` when unauthenticated)

## Quick Start

```typescript
import { SnackBaseClient } from "@snackbase/sdk";

const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  apiKey: "sb_ak....", // format sb_ak.<payload>.<signature>
  // accountId: "AB1234", // optional: public/anonymous collection scoping
});

const users = await client.users.list();
const record = await client.records.get("posts", "record_id");
```

## Reference Guides

| Task | Reference |
| ---- | --------- |
| Initialize client | [references/client.md](references/client.md) |
| Authenticate users | [references/authentication.md](references/authentication.md) |
| Manage collections | [references/collections.md](references/collections.md) |
| Query/create records | [references/records.md](references/records.md) |
| Handle errors | [references/errors.md](references/errors.md) |
| Upload/download files | [references/files.md](references/files.md) |
| Set up webhooks | [references/webhooks.md](references/webhooks.md) |
| Hooks (event/schedule/manual) | [references/hooks.md](references/hooks.md) |
| Custom endpoints | [references/endpoints.md](references/endpoints.md) |
| Workflows | [references/workflows.md](references/workflows.md) |
| Background jobs | [references/jobs.md](references/jobs.md) |
| Dashboard stats | [references/dashboard.md](references/dashboard.md) |
| Realtime subscriptions | [references/realtime.md](references/realtime.md) |
| Access control (groups, roles, invitations, rules) | [references/access-control.md](references/access-control.md) |
| Platform utilities (macros, email, migrations, API keys) | [references/platform.md](references/platform.md) |
| Write tests (Vitest) | [references/testing.md](references/testing.md) |
| Configure storage | [references/storage.md](references/storage.md) |
| Admin configurations & providers | [references/admin.md](references/admin.md) |
| Codelists (shared dimensions / regions) | [references/codelists.md](references/codelists.md) |
| Full API reference | [references/api-reference.md](references/api-reference.md) |

## Service Architecture

All services follow a consistent constructor pattern with `HttpClient` dependency:

```typescript
export class ExampleService {
  constructor(private http: HttpClient) {}

  async list(params?: ListParams): Promise<ListResponse> {
    const response = await this.http.get<ListResponse>("/api/v1/resource", {
      params,
    });
    return response.data; // Always unwrap response.data
  }
}
```

Exceptions:

- `AuthService` receives `http`, `authManager`, `apiKey`, and `defaultAccount`
- `FileService` receives `http`, `getBaseUrl()`, and `getToken()` functions
- `RealTimeService` receives realtime config (baseUrl, getToken, authManager, retries)

## Adding a New Service

1. Create type definitions in `src/types/[domain].ts` (entity, create, update, list params, list response interfaces)
2. Create service class in `src/core/[domain]-service.ts` with `HttpClient` constructor
3. Register in `src/core/client.ts`: import, add private property, instantiate in constructor, add public getter
4. Export types in `src/index.ts`
5. Add test file `src/core/[domain]-service.test.ts` following patterns in [references/testing.md](references/testing.md)
6. Update this skill package and run `pnpm --filter @snackbase/skills verify` (see package README)
