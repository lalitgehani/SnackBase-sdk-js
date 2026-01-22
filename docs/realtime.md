# Real-Time Features Guide

This guide covers real-time data synchronization using WebSockets and Server-Sent Events (SSE).

## Overview

SnackBase real-time features allow you to:

- Subscribe to record changes in collections
- Receive instant updates when records are created, updated, or deleted
- Filter subscriptions to receive only relevant events
- Use query builders to define complex subscription criteria

## Connection Management

The SDK automatically manages the real-time connection. It will:

1. Connect when you create your first subscription
2. Automatically reconnect on disconnection
3. Use exponential backoff for reconnection attempts
4. Clean up connections when all subscriptions are removed

### Manual Connection

```typescript
// Manually connect (optional - auto-connects on first subscription)
await client.realtime.connect();

// Check connection status
if (client.realtime.isConnected) {
  console.log("Connected to real-time service");
}

// Manually disconnect
await client.realtime.disconnect();
```

## Basic Subscriptions

### Subscribe to a Collection

```typescript
// Subscribe to all events on a collection
const unsubscribe = client.realtime.subscribe("posts", (event) => {
  console.log("Action:", event.action);
  console.log("Record:", event.record);
  console.log("Collection:", event.collection);
});

// Later: unsubscribe when done
unsubscribe();
```

### Event Types

| Action   | Description                    |
| -------- | ------------------------------ |
| `create` | A new record was created       |
| `update` | An existing record was updated |
| `delete` | A record was deleted           |

## Filtered Subscriptions

### Subscribe with Filters

```typescript
// Subscribe with a server-side filter
const unsubscribe = client.realtime.subscribe(
  "posts",
  {
    filter: 'status = "published"',
  },
  (event) => {
    console.log("Published post changed:", event.record);
  },
);
```

### Filter Syntax

Filters use the same syntax as the query builder:

```typescript
// Simple equality
filter: 'status = "published"';

// Comparison operators
filter: "views > 100";

// Multiple conditions
filter: 'status = "published" && views > 100';

// Regex matching
filter: 'title ~ "^Breaking:"';

// IN operator
filter: 'category IN ["tech", "science"]';
```

### Subscribe with Expanded Relations

```typescript
// Expand relations to get full related data
const unsubscribe = client.realtime.subscribe(
  "posts",
  {
    expand: "author,comments",
  },
  (event) => {
    // event.record.author contains the full author object
    // event.record.comments contains the full comments array
    console.log("Post by:", event.record.author.name);
  },
);
```

## Query-Based Subscriptions

Subscribe to records matching a query builder query:

```typescript
// Build a complex query
const query = client
  .query("posts")
  .filter("status", "=", "published")
  .filter("views", ">", 100)
  .sort("createdAt", "desc");

// Subscribe to query results
const unsubscribe = client.realtime.subscribeByQuery(query, (event) => {
  console.log("Matching post changed:", event.record);
});
```

## Handling Real-Time Events

### Event Handler Signature

```typescript
type RealTimeEventHandler = (event: RealTimeEvent) => void;

interface RealTimeEvent {
  action: "create" | "update" | "delete";
  record: Record<string, any>;
  collection: string;
}
```

### Handling Different Actions

```typescript
const unsubscribe = client.realtime.subscribe("posts", (event) => {
  switch (event.action) {
    case "create":
      console.log("New post:", event.record);
      // Add to UI
      addPostToUI(event.record);
      break;

    case "update":
      console.log("Updated post:", event.record);
      // Update in UI
      updatePostInUI(event.record);
      break;

    case "delete":
      console.log("Deleted post:", event.record);
      // Remove from UI
      removePostFromUI(event.record.id);
      break;
  }
});
```

### Handling Errors

```typescript
// Real-time service emits auth_error events
client.realtime.on("auth_error", (error) => {
  console.error("Real-time auth error:", error);
  // Re-authenticate or redirect to login
});

// Connection errors are logged automatically
// Configure logging to see them
const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  enableLogging: true,
  logLevel: "debug",
});
```

## React Integration

### Using `useSubscription` Hook

```tsx
import { useSubscription, useSnackBase } from "@snackbase/sdk/react";

function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);

  // Subscribe to posts changes
  useSubscription("posts", (event) => {
    switch (event.action) {
      case "create":
        setPosts((prev) => [...prev, event.record as Post]);
        break;
      case "update":
        setPosts((prev) =>
          prev.map((p) => (p.id === event.record.id ? event.record : p)),
        );
        break;
      case "delete":
        setPosts((prev) => prev.filter((p) => p.id !== event.record.id));
        break;
    }
  });

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Filtered Subscriptions in React

```tsx
import { useSubscription } from "@snackbase/sdk/react";

function PublishedPosts() {
  const [posts, setPosts] = useState<Post[]>([]);

  // Subscribe only to published posts
  useSubscription(
    "posts",
    {
      filter: 'status = "published"',
    },
    (event) => {
      // Handle only published posts
      setPosts((prev) => {
        switch (event.action) {
          case "create":
            return [...prev, event.record as Post];
          case "update":
            return prev.map((p) =>
              p.id === event.record.id ? event.record : p,
            );
          case "delete":
            return prev.filter((p) => p.id !== event.record.id);
          default:
            return prev;
        }
      });
    },
  );

  return <PostList posts={posts} />;
}
```

### Query-Based Subscriptions in React

```tsx
import { useSnackBase, useSubscription } from "@snackbase/sdk/react";
import { useEffect, useState } from "react";

function TrendingPosts() {
  const { client } = useSnackBase();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    // Build query
    const query = client
      .query("posts")
      .filter("views", ">", 1000)
      .sort("views", "desc");

    // Subscribe to query
    const unsubscribe = client.realtime.subscribeByQuery(query, (event) => {
      // Handle events
    });

    return unsubscribe;
  }, [client]);

  return <PostList posts={posts} />;
}
```

## Best Practices

### 1. Always Unsubscribe

```typescript
// ✅ Good: Unsubscribe when done
useEffect(() => {
  const unsubscribe = client.realtime.subscribe("posts", handler);
  return unsubscribe; // Cleanup function
}, []);

// ❌ Bad: Never unsubscribe
useEffect(() => {
  client.realtime.subscribe("posts", handler);
}, []);
```

### 2. Use Server-Side Filters

```typescript
// ✅ Good: Server-side filtering
const unsubscribe = client.realtime.subscribe(
  "posts",
  { filter: 'status = "published"' },
  handler,
);

// ❌ Bad: Client-side filtering
const unsubscribe = client.realtime.subscribe("posts", (event) => {
  if (event.record.status === "published") {
    // Handle event
  }
});
```

### 3. Handle Race Conditions

```typescript
// When a record is updated immediately after creation
const unsubscribe = client.realtime.subscribe("posts", (event) => {
  if (event.action === "create" || event.action === "update") {
    // Upsert: update if exists, insert if not
    setPosts((prev) => {
      const existing = prev.find((p) => p.id === event.record.id);
      if (existing) {
        return prev.map((p) => (p.id === event.record.id ? event.record : p));
      }
      return [...prev, event.record];
    });
  }
});
```

### 4. Batch Updates

```typescript
// For high-frequency updates, batch them
let updateTimeout: NodeJS.Timeout;
const unsubscribe = client.realtime.subscribe("posts", (event) => {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    // Process all pending updates at once
    refreshPosts();
  }, 100);
});
```

### 5. Handle Connection State

```typescript
// Show connection status to users
const [isConnected, setIsConnected] = useState(false);

useEffect(() => {
  const checkConnection = setInterval(() => {
    setIsConnected(client.realtime.isConnected);
  }, 1000);

  return () => clearInterval(checkConnection);
}, []);

return (
  <div>
    {isConnected ? (
      <span className="status-connected">Live</span>
    ) : (
      <span className="status-disconnected">Reconnecting...</span>
    )}
  </div>
);
```

## WebSocket vs SSE

The SDK automatically chooses the best transport:

| Transport | When Used                   | Pros                         | Cons           |
| --------- | --------------------------- | ---------------------------- | -------------- |
| WebSocket | Modern browsers             | Bidirectional, lower latency | More complex   |
| SSE       | Fallback for older browsers | Simpler, reliable            | Unidirectional |

## Configuration

### Connection Settings

```typescript
const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  // Real-time settings
  maxRealTimeRetries: 5, // Max reconnection attempts
  realTimeReconnectionDelay: 1000, // Initial delay (ms)
});

// Custom reconnection logic
client.realtime.on("disconnected", () => {
  console.log("Disconnected - attempting to reconnect...");
});

client.realtime.on("connected", () => {
  console.log("Reconnected successfully");
});
```

### Authentication

The real-time service automatically uses your authentication token:

```typescript
// After login, real-time connection is authenticated
await client.auth.login({ email, password });

// All subscriptions will use authenticated context
client.realtime.subscribe("posts", handler);
```

## Example: Collaborative Document Editor

```tsx
import { useState, useEffect } from "react";
import { useSnackBase, useSubscription } from "@snackbase/sdk/react";

function DocumentEditor({ documentId }: { documentId: string }) {
  const { client } = useSnackBase();
  const [document, setDocument] = useState<Document | null>(null);

  // Load initial document
  useEffect(() => {
    client.records.get("documents", documentId).then(setDocument);
  }, [client, documentId]);

  // Subscribe to document changes
  useSubscription(
    "documents",
    {
      filter: `id = "${documentId}"`,
    },
    (event) => {
      if (event.action === "update") {
        setDocument(event.record as Document);
      }
    },
  );

  // Handle content changes
  const handleChange = async (content: string) => {
    await client.records.update("documents", documentId, { content });
  };

  if (!document) return <div>Loading...</div>;

  return (
    <div>
      <h1>{document.title}</h1>
      <textarea
        value={document.content}
        onChange={(e) => handleChange(e.target.value)}
      />
      <div className="status">
        Last updated: {new Date(document.updatedAt).toLocaleTimeString()}
      </div>
    </div>
  );
}
```

## Example: Live Dashboard

```tsx
import { useState, useEffect } from "react";
import { useSubscription } from "@snackbase/sdk/react";

function LiveDashboard() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
  });

  // Subscribe to all collections
  useSubscription("users", (event) => {
    setMetrics((prev) => ({
      ...prev,
      totalUsers:
        event.action === "create"
          ? prev.totalUsers + 1
          : event.action === "delete"
            ? prev.totalUsers - 1
            : prev.totalUsers,
    }));
  });

  useSubscription("posts", (event) => {
    setMetrics((prev) => ({
      ...prev,
      totalPosts:
        event.action === "create"
          ? prev.totalPosts + 1
          : event.action === "delete"
            ? prev.totalPosts - 1
            : prev.totalPosts,
    }));
  });

  return (
    <div className="dashboard">
      <div className="metric">
        <h3>Total Users</h3>
        <p>{metrics.totalUsers}</p>
      </div>
      <div className="metric">
        <h3>Total Posts</h3>
        <p>{metrics.totalPosts}</p>
      </div>
    </div>
  );
}
```

## Troubleshooting

### "Not connected" Error

- Ensure you're authenticated (for private collections)
- Check your network connection
- Verify the real-time service is enabled in your dashboard

### Events Not Received

- Verify the filter syntax is correct
- Check collection rules allow access
- Ensure the subscription is properly set up

### Reconnection Issues

- Check the reconnection settings
- Verify your token is still valid
- Check browser console for errors

### Memory Leaks

```typescript
// ✅ Good: Always cleanup
useEffect(() => {
  const unsubscribe = client.realtime.subscribe("posts", handler);
  return unsubscribe;
}, []);

// ❌ Bad: No cleanup
useEffect(() => {
  client.realtime.subscribe("posts", handler);
}, []);
```
