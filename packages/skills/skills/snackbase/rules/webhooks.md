---
name: webhooks
description: Webhook management, signature verification, and event handling
metadata:
  tags: webhook, event, notification, signature
---

Webhooks allow your application to receive real-time notifications when events occur in SnackBase.

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

### Express.js Example

```typescript
import crypto from 'crypto';
import express from 'express';

const app = express();
app.use(express.raw({ type: 'application/json' }));

app.post('/webhooks/snackbase', (req, res) => {
  const signature = req.headers['x-snackbase-signature'] as string;
  const payload = req.body;

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }

  // Parse event
  const event = JSON.parse(payload.toString());

  switch (event.type) {
    case 'record.created':
      console.log('Record created:', event.data);
      break;
    case 'record.updated':
      console.log('Record updated:', event.data);
      break;
    case 'record.deleted':
      console.log('Record deleted:', event.data);
      break;
  }

  res.status(200).send('OK');
});
```

### Next.js App Router Example

```typescript
import { NextRequest } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-snackbase-signature');
  const payload = await request.text();

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(payload);

  // Handle event...
  console.log('Received:', event.type, event.data);

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
