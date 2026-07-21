Webhooks deliver outbound HTTP notifications when records change in a collection.

Aligned with `WebhookService` and `types/webhook.ts` in `@snackbase/sdk` ≥ 0.6.0.

## Table of Contents

- [Create a Webhook](#create-a-webhook)
- [Webhook Events](#webhook-events)
- [List / Get / Update / Delete](#list--get--update--delete)
- [Test a Webhook](#test-a-webhook)
- [List Deliveries](#list-deliveries)
- [Secret Handling](#secret-handling)
- [Handling Webhook Requests](#handling-webhook-requests)
- [Webhook Properties](#webhook-properties)

## Create a Webhook

Required: `url`, `collection`, `events`. Optional: `secret`, string `filter`, `enabled`, `headers`.

```typescript
const webhook = await client.webhooks.create({
  url: 'https://myapp.com/webhooks/snackbase',
  collection: 'tasks',
  events: ['create', 'update', 'delete'],
  secret: 'webhook-secret-key', // optional; server may generate one
  filter: 'status = "done"', // string filter only
  enabled: true,
  headers: { 'X-Custom': 'value' },
});

console.log(webhook.id);
console.log(webhook.secret); // only on create response — store securely
```

There is **no** object-shaped `filter: { collection: ... }`. Collection is a top-level field.

## Webhook Events

Events are record lifecycle only:

| Event | Description |
| ----- | ----------- |
| `create` | A record was created in the collection |
| `update` | A record was updated |
| `delete` | A record was deleted |

## List / Get / Update / Delete

`list()` has **no pagination params**.

```typescript
const { items, total } = await client.webhooks.list();

const webhook = await client.webhooks.get(webhookId);

const updated = await client.webhooks.update(webhookId, {
  events: ['create', 'update'],
  url: 'https://myapp.com/webhooks/new-url',
  enabled: false,
});

await client.webhooks.delete(webhookId);
```

## Test a Webhook

There is no `trigger` method. Use `test(id)`:

```typescript
const result = await client.webhooks.test(webhookId);

console.log(result.success);
console.log(result.status_code);
console.log(result.response_body);
console.log(result.error);
```

## List Deliveries

Deliveries use `limit` / `offset` (not page/page_size):

```typescript
const deliveries = await client.webhooks.listDeliveries(webhookId, {
  limit: 20,
  offset: 0,
});

deliveries.items.forEach((d) => {
  console.log(d.id, d.status, d.response_status, d.attempt_number);
});
```

## Secret Handling

- Secret is returned **only** on create as `WebhookCreateResponse.secret`
- There are **no** `getSecret` or `rotateSecret` methods
- To rotate: create a new webhook (or update if backend accepts a new secret on update) and redeploy the consumer secret

## Handling Webhook Requests

### Signature verification (HMAC-SHA256)

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expected;
}
```

### Express.js

```typescript
app.post(
  '/webhooks/snackbase',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['x-snackbase-signature'] as string;
    if (!verifyWebhookSignature(req.body, signature, WEBHOOK_SECRET)) {
      return res.status(401).send('Invalid signature');
    }
    const event = JSON.parse(req.body.toString());
    res.status(200).send('OK');
  },
);
```

## Webhook Properties

```typescript
type WebhookEvent = 'create' | 'update' | 'delete';

interface Webhook {
  id: string;
  account_id: string;
  url: string;
  collection: string;
  events: WebhookEvent[];
  filter: string | null;
  enabled: boolean;
  headers: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface WebhookCreateResponse extends Webhook {
  secret: string; // create only
}

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  attempt_number: number;
  delivered_at: string | null;
  next_retry_at: string | null;
  status: string;
  created_at: string;
}
```

## Security Best Practices

1. Always verify signatures
2. Use HTTPS webhook URLs
3. Store secrets in environment variables
4. Return 200 quickly; process asynchronously
5. Handle retries idempotently
