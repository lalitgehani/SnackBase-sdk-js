# SDK integration tests

These tests exercise `@snackbase/sdk` against a live SnackBase backend. They create
temporary users, accounts, collections, records, and automation resources, then clean up
the resources they track.

## Configuration

From the monorepo root, set the backend URL and, for admin or email-verification flows,
an API key:

```bash
export SNACKBASE_URL=http://localhost:8090
export SNACKBASE_API_KEY=your-api-key
export SNACKBASE_TEST_EMAIL=test@example.com       # optional fixed test identity
export SNACKBASE_TEST_PASSWORD='TestPass123!'       # optional
```

`SNACKBASE_URL` defaults to `http://localhost:8090`. `SNACKBASE_API_KEY` is needed for
superadmin operations and for manually verifying newly registered users; provide it for
the full suite. Some admin-only cases return early without a key, but auth and record
scenarios still need a disposable backend configured for the test flow.

Realtime integration tests require Node.js 21+ so the WebSocket transport is available
globally. Other SDK development commands require Node.js 20+.

## Running the tests

Run the integration project from the monorepo root. The workspace config runs these tests
sequentially to avoid SQLite locking:

```bash
pnpm test:integration

# Or with a custom backend:
SNACKBASE_URL=http://localhost:8000 \
SNACKBASE_API_KEY=your-api-key \
pnpm test:integration
```

`pnpm --filter @snackbase/sdk test` runs the SDK unit-test project only; it does not run
these integration tests.

## Test layout

```text
tests/integration/
├── setup.ts
├── accounts.integration.test.ts
├── admin.integration.test.ts
├── api-keys.integration.test.ts
├── audit-logs.integration.test.ts
├── auth.integration.test.ts
├── collection-rules.integration.test.ts
├── collections.integration.test.ts
├── dashboard.integration.test.ts
├── email-templates.integration.test.ts
├── endpoints.integration.test.ts
├── files.integration.test.ts
├── groups.integration.test.ts
├── hooks.integration.test.ts
├── invitations.integration.test.ts
├── jobs.integration.test.ts
├── macros.integration.test.ts
├── migrations.integration.test.ts
├── realtime.integration.test.ts
├── records.integration.test.ts
├── roles.integration.test.ts
├── users.integration.test.ts
├── webhooks.integration.test.ts
└── workflows.integration.test.ts
```

`setup.ts` provides `createTestClient()`, unique test-data generators, resource tracking,
cleanup, `verifyUser()`, `waitFor()`, and retry helpers. Keep tests independent and use
unique names for resources shared by the live backend.

## Local backend

Start SnackBase separately before running the tests:

```bash
cd /path/to/SnackBase
uv run python -m snackbase serve
```

If the server uses port `8000`, set `SNACKBASE_URL=http://localhost:8000`. Do not point
the suite at production data: integration tests create and delete resources.
