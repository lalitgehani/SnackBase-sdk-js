Workflows orchestrate multi-step automations with instance tracking.

Aligned with `WorkflowService` and `types/workflow.ts` in `@snackbase/sdk` ≥ 0.6.0.
Accessor: `client.workflows`

## Methods

| Method | Path / notes |
| ------ | ------------ |
| `list(params?)` | `trigger_type`, `enabled`, `limit`, `offset` |
| `get(id)` | GET `/api/v1/workflows/{id}` |
| `create(data)` | POST `/api/v1/workflows` |
| `update(id, data)` | PUT |
| `delete(id)` | DELETE |
| `toggle(id)` | **PATCH** `/api/v1/workflows/{id}/toggle` |
| `trigger(id, input?)` | POST `.../trigger` → `{ message, instance_id }` |
| `listInstances(id, params?)` | `status`, `limit`, `offset` |
| `getInstance(instanceId)` | GET `/api/v1/workflow-instances/{instanceId}` |
| `cancelInstance(instanceId)` | POST `.../cancel` |
| `resumeInstance(instanceId)` | POST `.../resume` |
| `retryInstance(instanceId)` | Alias of `resumeInstance` (resume path, not a separate retry-only URL) |

## Create

```typescript
const workflow = await client.workflows.create({
  name: 'onboarding',
  description: 'New user onboarding',
  trigger: {
    type: 'event', // event | schedule | manual | webhook
    event: 'create',
    collection: 'users',
  },
  steps: [
    {
      name: 'send_welcome',
      type: 'action',
      action_type: 'send_email',
      position_x: 100, // optional UI layout only
      position_y: 40,
      next: null,
    },
  ],
  enabled: true,
});
```

## Toggle, trigger, instances

```typescript
const toggled = await client.workflows.toggle(workflow.id);

const { instance_id } = await client.workflows.trigger(workflow.id, {
  source: 'admin-ui',
});

const { items } = await client.workflows.listInstances(workflow.id, {
  status: 'running',
  limit: 20,
  offset: 0,
});

const detail = await client.workflows.getInstance(instance_id);
// detail.step_logs for per-step history

await client.workflows.cancelInstance(instance_id);
await client.workflows.resumeInstance(instance_id); // failed instances
// or client.workflows.retryInstance(instance_id) — same resume path
```

## Webhook-trigger token

When `trigger.type` is `webhook`, the backend may expose a token in trigger config. Invoke that HTTP endpoint raw if documented for your deployment — it is not a separate SDK client method beyond workflow CRUD/trigger.

## Instance status

`pending` | `running` | `waiting` | `completed` | `failed` | `cancelled`
