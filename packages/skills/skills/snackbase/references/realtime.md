Realtime delivers collection change events over WebSocket.

Aligned with `RealTimeService` and `types/realtime.ts` in `@snackbase/sdk` ≥ 0.6.0.
Accessor: `client.realtime`

## Connect / disconnect

```typescript
await client.realtime.connect();
// Uses JWT from auth manager when present

client.realtime.disconnect();
```

Auth token is taken from the client session automatically. Configure reconnection via client config:

- `maxRealTimeRetries` (default 10)
- `realTimeReconnectionDelay` (default 1000 ms)

## Subscribe / unsubscribe

```typescript
await client.realtime.subscribe('tasks', ['create', 'update', 'delete']);
// operations default to ['create', 'update', 'delete']

await client.realtime.unsubscribe('tasks');
```

## Server message `type` field

Acks and control messages use **`type`**, not a legacy `status: subscribed` shape:

```typescript
interface ServerMessage {
  type: string | 'heartbeat' | 'pong' | 'subscribed' | 'unsubscribed';
  timestamp: string;
  data?: any;
  collection?: string;
}
```

## Events

```typescript
// Connection lifecycle
client.realtime.on('connecting', () => {});
client.realtime.on('connected', () => {});
client.realtime.on('disconnected', () => {});
client.realtime.on('error', (err: Error) => {});
client.realtime.on('auth_error', (err: Error) => {});

// Raw server frames
client.realtime.on('message', (msg: ServerMessage) => {
  if (msg.type === 'subscribed') {
    console.log('subscribed to', msg.collection);
  }
});

// Collection operations: '{collection}.{operation}'
client.realtime.on('tasks.create', (event) => {
  console.log(event);
});

// Wildcards
client.realtime.on('tasks.*', handler);
client.realtime.on('*', handler);
```

Event payload shape:

```typescript
interface RealtimeEvent<T = any> {
  type: string; // e.g. "posts.create"
  timestamp: string;
  data: T; // full record for create/update; ID-oriented for delete
}
```

## Example

```typescript
await client.auth.login({ email, password });
await client.realtime.connect();
await client.realtime.subscribe('tasks', ['create', 'update']);

client.realtime.on('tasks.create', (payload) => {
  console.log('new task', payload);
});
```
