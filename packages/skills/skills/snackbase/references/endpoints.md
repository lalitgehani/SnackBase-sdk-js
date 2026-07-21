Custom endpoints define account-scoped HTTP handlers with server-side actions.

Aligned with `EndpointService` and `types/endpoint.ts` in `@snackbase/sdk` ≥ 0.6.0.
Accessor: `client.endpoints`

## Methods

| Method | Description |
| ------ | ----------- |
| `list(params?)` | `method`, `enabled`, `limit`, `offset` |
| `get(id)` | Get by ID |
| `create(data)` | Create endpoint definition |
| `update(id, data)` | PUT update |
| `delete(id)` | Delete |
| `toggle(id)` | PATCH `.../endpoints/{id}/toggle` |
| `listExecutions(id, params?)` | `limit` / `offset` |

## Create body

```typescript
const endpoint = await client.endpoints.create({
  name: 'create-task-shortcut',
  path: 'tasks/quick',
  method: 'POST', // GET | POST | PUT | PATCH | DELETE
  description: 'Quick task create',
  auth_required: true,
  condition: null,
  actions: [
    {
      type: 'create_record',
      collection: 'tasks',
      data: { title: '{{body.title}}', status: 'todo' },
    },
  ],
  response_template: { ok: true, id: '{{result.id}}' },
  enabled: true,
});
```

## List / toggle / executions

```typescript
const { items, total } = await client.endpoints.list({
  method: 'POST',
  enabled: true,
  limit: 20,
  offset: 0,
});

await client.endpoints.toggle(endpoint.id);

const runs = await client.endpoints.listExecutions(endpoint.id, {
  limit: 10,
  offset: 0,
});
```

## Dispatch (runtime invoke)

The SDK manages **definitions** only. Invoke custom endpoints with raw HTTP:

```text
{baseUrl}/api/v1/x/{account_slug}/{path}
```

Example:

```typescript
// Not a client.endpoints method — call HTTP directly
const res = await fetch(
  `${baseUrl}/api/v1/x/my-account/tasks/quick`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: 'From custom endpoint' }),
  },
);
```

## Endpoint shape

```typescript
interface Endpoint {
  id: string;
  account_id: string;
  name: string;
  description: string | null;
  path: string;
  method: string;
  auth_required: boolean;
  condition: string | null;
  actions: Record<string, any>[];
  response_template: Record<string, any> | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}
```
