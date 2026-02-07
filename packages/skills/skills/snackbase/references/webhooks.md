Webhooks allow your application to receive real-time notifications when events occur in SnackBase.

## Table of Contents

- [Create a Webhook](#create-a-webhook)
- [Webhook Events](#webhook-events)
- [List / Get / Update / Delete Webhooks](#list-webhooks)
- [Secret Management](#get-webhook-secret) (Get, Rotate)
- [Trigger a Test Webhook](#trigger-a-test-webhook)
- [Handling Webhook Requests](#handling-webhook-requests) (Express.js, Next.js)
- [Webhook Event Structure](#webhook-event-structure)
- [Security Best Practices](#security-best-practices)
- [Webhook Properties](#webhook-properties)

## Create a Webhook

```typescript
const webhook = await client.webhooks.create({
  url: 'https://myapp.com/webhooks/snackbase',
  events: ['record.created', 'record.updated', 'record.deleted'],
  secret: 'webhook-secret-key',
  filter: {
    collection: 'tasks'
  }
});

console.log(webhook.id);
console.log(webhook.secret); // Store this securely!
```

## Webhook Events

| Event | Description |
|-------|-------------|
| `record.created` | A record was created |
| `record.updated` | A record was updated |
| `record.deleted` | A record was deleted |
| `user.created` | A user was created |
| `user.updated` | A user was updated |
| `collection.created` | A collection was created |
| `collection.updated` | A collection schema was updated |

## List Webhooks

```typescript
const webhooks = await client.webhooks.list();

webhooks.items.forEach(wh => {
  console.log(`${wh.url} - ${wh.events.join(', ')}`);
});
```

## Get a Webhook

```typescript
const webhook = await client.webhooks.get(webhookId);
console.log(webhook.url);
console.log(webhook.events);
```

## Update a Webhook

```typescript
const updated = await client.webhooks.update(webhookId, {
  events: ['record.created', 'record.updated'], // Removed record.deleted
  url: 'https://myapp.com/webhooks/new-url'
});
```

## Delete a Webhook

```typescript
await client.webhooks.delete(webhookId);
```

## Get Webhook Secret

```typescript
const { secret } = await client.webhooks.getSecret(webhookId);
console.log('Store this securely:', secret);
```

## Rotate Webhook Secret

```typescript
const { secret } = await client.webhooks.rotateSecret(webhookId);
// The old secret will no longer work
console.log('New secret:', secret);
```

## Trigger a Test Webhook

```typescript
const result = await client.webhooks.trigger(webhookId);

console.log(result.success); // true if delivery succeeded
console.log(result.statusCode); // HTTP status code from your endpoint
console.log(result.response); // Response body from your endpoint
```

## Handling Webhook Requests

### Signature Verification Pattern

Verify the `x-snackbase-signature` header using HMAC-SHA256:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(payload: string | Buffer, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return signature === expected;
}
```

### Express.js

```typescript
app.post('/webhooks/snackbase', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-snackbase-signature'] as string;
  if (!verifyWebhookSignature(req.body, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  const event = JSON.parse(req.body.toString());
  // Handle event.type and event.data
  res.status(200).send('OK');
});
```

### Next.js App Router

```typescript
export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-snackbase-signature')!;
  const payload = await request.text();
  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET!)) {
    return new Response('Invalid signature', { status: 401 });
  }
  const event = JSON.parse(payload);
  // Handle event.type and event.data
  return new Response('OK', { status: 200 });
}
```

## Webhook Event Structure

```typescript
interface WebhookEvent {
  id: string;           // Unique event ID
  type: string;         // Event type (e.g., 'record.created')
  accountId: string;    // Account that triggered the event
  timestamp: string;    // ISO timestamp
  data: {
    collection: string; // Collection name
    record: any;        // Record data
    recordId: string;   // Record ID
  };
}
```

## Security Best Practices

1. **Always verify signatures** - Never trust unverified webhook requests
2. **Use HTTPS** - Webhook URLs must use HTTPS
3. **Store secrets securely** - Use environment variables, not hardcoding
4. **Return 200 OK quickly** - Process events asynchronously
5. **Idempotency** - Handle duplicate events (webhooks may be retried)

## Webhook Properties

```typescript
interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;      // Only returned on create or getSecret
  filter?: {
    collection?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```
