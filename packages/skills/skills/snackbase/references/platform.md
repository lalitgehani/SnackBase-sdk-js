Platform utilities for macros, email templates, migrations, and API keys.

Aligned with `@snackbase/sdk` ≥ 0.6.0.

## Macros — `client.macros`

```typescript
const { items, total } = await client.macros.list();

const macro = await client.macros.create({
  name: 'count_active_tasks',
  description: 'Count active tasks',
  sql_query: 'SELECT COUNT(*) FROM tasks WHERE status = ?',
  parameters: ['status'],
});

const got = await client.macros.get(String(macro.id));
await client.macros.update(String(macro.id), {
  description: 'Updated description',
});

const test = await client.macros.test(String(macro.id), ['todo']);
// { result, execution_time, rows_affected }

await client.macros.delete(String(macro.id));
```

## Email templates — `client.emailTemplates`

```typescript
const templates = await client.emailTemplates.list({
  template_type: 'verification',
  locale: 'en',
});

const template = await client.emailTemplates.get(templateId);

await client.emailTemplates.update(templateId, {
  subject: 'Verify your email',
  html_body: '<p>Click {{link}}</p>',
  text_body: 'Click {{link}}',
  enabled: true,
});

const rendered = await client.emailTemplates.render({
  template_type: 'verification',
  locale: 'en',
  variables: { link: 'https://app.example.com/verify?t=...' },
});
// { subject, html_body, text_body }

// Optional: sendTest / listLogs / getLog for delivery diagnostics
const logs = await client.emailTemplates.listLogs({ limit: 20 });
```

## Migrations — `client.migrations`

Superadmin read-only Alembic status:

```typescript
const list = await client.migrations.list();
const current = await client.migrations.getCurrent();
// CurrentRevisionResponse | null
const history = await client.migrations.getHistory();
```

## API keys — `client.apiKeys`

Base path: **`/api/v1/admin/api-keys`**

Key format: `sb_ak.<payload>.<signature>` (plaintext key only on create).

```typescript
const { items, total } = await client.apiKeys.list({ limit: 20, offset: 0 });

const created = await client.apiKeys.create({
  name: 'ci-bot',
  expires_at: '2027-01-01T00:00:00Z', // optional
});
// Store created.key immediately — not retrievable in full later

const key = await client.apiKeys.get(created.id);
await client.apiKeys.revoke(created.id);
```

Use the key as `apiKey` on `SnackBaseClient` config (`X-API-Key` header).
