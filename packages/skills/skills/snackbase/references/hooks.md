Hooks automate account logic on schedule, record events, or manual trigger.

Aligned with `HookService` and `types/hook.ts` in `@snackbase/sdk` ≥ 0.6.0.
Accessor: `client.hooks`

## Methods

| Method | Description |
| ------ | ----------- |
| `list(params?)` | List hooks (`trigger_type`, `enabled`, `limit`, `offset`) |
| `get(id)` | Get hook by ID |
| `create(data)` | Create hook |
| `update(id, data)` | PATCH update |
| `delete(id)` | Delete hook |
| `toggle(id)` | PATCH `.../hooks/{id}/toggle` |
| `trigger(id)` | POST `.../hooks/{id}/trigger` → `{ queued: boolean }` |
| `listExecutions(id, params?)` | Execution history (`limit`, `offset`) |

List params use **`limit` / `offset`**, not `page` / `page_size`.

## Trigger types

```typescript
type HookTriggerConfig =
  | { type: 'schedule'; cron: string }
  | { type: 'event'; event: string; collection?: string }
  | { type: 'manual' };
```

## Create: event trigger

```typescript
const hook = await client.hooks.create({
  name: 'notify-on-task-create',
  description: 'Notify external system when a task is created',
  trigger: {
    type: 'event',
    event: 'create',
    collection: 'tasks',
  },
  condition: 'priority > 3',
  actions: [
    {
      type: 'send_webhook',
      url: 'https://example.com/hooks/tasks',
      method: 'POST',
    },
  ],
  enabled: true,
});
```

## Create: schedule trigger

```typescript
const nightly = await client.hooks.create({
  name: 'nightly-cleanup',
  trigger: { type: 'schedule', cron: '0 2 * * *' },
  actions: [
    {
      type: 'send_email',
      to: 'ops@example.com',
      template_id: 'digest-template-id',
      subject: 'Nightly digest',
      // optional: body, variables
    },
  ],
  enabled: true,
});

// Response may include cron, cron_description, last_run_at, next_run_at, account_id
console.log(nightly.cron, nightly.cron_description, nightly.next_run_at);
```

## Create: manual trigger

```typescript
const manual = await client.hooks.create({
  name: 'manual-export',
  trigger: { type: 'manual' },
  actions: [{ type: 'create_record', collection: 'exports', data: { status: 'queued' } }],
});

const { queued } = await client.hooks.trigger(manual.id);
```

## List, toggle, executions

```typescript
const { items, total } = await client.hooks.list({
  trigger_type: 'event',
  enabled: true,
  limit: 20,
  offset: 0,
});

const toggled = await client.hooks.toggle(hook.id);

const history = await client.hooks.listExecutions(hook.id, { limit: 10, offset: 0 });
// status: success | failed | partial
```

## Action shapes

Prefer action types already used by the backend (e.g. `send_webhook`, `send_email`, `create_record`). Do not invent unsupported action type catalogs beyond what the platform accepts.

## Hook shape (selected fields)

```typescript
interface Hook {
  id: string;
  account_id: string;
  name: string;
  description?: string | null;
  trigger: HookTriggerConfig;
  condition?: string | null;
  actions: Record<string, any>[];
  enabled: boolean;
  last_run_at?: string | null;
  next_run_at?: string | null;
  cron?: string | null;
  cron_description?: string | null;
  created_at: string;
  updated_at: string;
}
```
