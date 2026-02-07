---
name: records
description: Record CRUD operations, filtering, pagination, and bulk operations
metadata:
  tags: record, crud, filter, query, pagination, bulk
---

The `records` service provides dynamic CRUD operations for any collection. Use generics for type safety.

## Type-Safe Operations

Define your record types:

```typescript
interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: number;
  due_date?: string;
  assignee_id?: string;
  created_at: string;
  updated_at: string;
}
```

## Create a Record

```typescript
const task = await client.records.create<Task>('tasks', {
  title: 'Fix authentication bug',
  status: 'todo',
  priority: 5
});

console.log(task.id); // Auto-generated
```

## Get a Record

```typescript
const task = await client.records.get<Task>('tasks', taskId);
console.log(task.title);
```

## Update a Record

### Partial Update (PATCH)

```typescript
const updated = await client.records.update(
  'tasks',
  taskId,
  { status: 'done' } // Only updates provided fields
);
```

### Full Replacement (PUT)

```typescript
const replaced = await client.records.replace(
  'tasks',
  taskId,
  {
    title: 'Updated title',
    status: 'todo',
    priority: 3
    // All required fields must be provided
  }
);
```

## Delete a Record

```typescript
await client.records.delete('tasks', taskId);
// Returns true if successful
```

## List Records

```typescript
const result = await client.records.list<Task>('tasks', {
  // Pagination
  skip: 0,
  limit: 50,

  // Sorting
  sort: '-priority,created_at', // Descending priority, then ascending created_at

  // Field selection
  fields: ['id', 'title', 'status'],

  // Expand relations
  expand: ['created_by', 'assignee']
});

console.log(result.items);   // Task[]
console.log(result.total);    // Total count
console.log(result.skip);    // Records skipped
console.log(result.limit);   // Max records returned
```

## Filtering

The SDK supports SQL-style filter expressions:

### Exact Match

```typescript
filter: 'status="todo"'
```

### Comparison Operators

```typescript
filter: 'priority > 3'
filter: 'priority >= 4'
filter: 'priority < 3'
filter: 'created_at <= "2025-01-01"'
```

### String Operators

```typescript
filter: 'name LIKE "John%"'    // Starts with
filter: 'email LIKE "%@company.com"'  // Contains
filter: 'title LIKE "%bug"'    // Ends with
```

### Logical Operators

```typescript
// AND (implicit)
filter: 'status="todo" AND priority > 3'

// OR
filter: '(status="urgent" OR priority >= 4)'

// NOT
filter: 'NOT status="archived"'
```

### Using Object Format (Auto-Converted)

For simple exact matches, you can pass an object:

```typescript
filter: { status: 'todo' }
// Auto-converted to: 'status="todo"'
```

## Bulk Operations

### Bulk Create

```typescript
const tasks = await client.records.bulkCreate<Task>('tasks', [
  { title: 'Task 1', status: 'todo', priority: 1 },
  { title: 'Task 2', status: 'todo', priority: 2 },
  { title: 'Task 3', status: 'todo', priority: 3 }
]);
```

### Bulk Update

```typescript
const updated = await client.records.bulkUpdate(
  'tasks',
  [
    { id: '1', changes: { status: 'done' } },
    { id: '2', changes: { status: 'done' } }
  ]
);
```

### Bulk Delete

```typescript
const result = await client.records.bulkDelete(
  'tasks',
  ['task-1', 'task-2', 'task-3']
);

console.log(result.deleted); // Array of deleted IDs
console.log(result.failed);  // Array of failed IDs
```

## Aggregation

```typescript
const result = await client.records.aggregate('tasks', {
  groupBy: ['status'],
  aggregates: {
    count: { count: '*' },
    avgPriority: { avg: 'priority' },
    maxPriority: { max: 'priority' }
  }
});

// Result:
// [
//   { status: 'todo', count: 10, avgPriority: 3.2, maxPriority: 5 },
//   { status: 'done', count: 5, avgPriority: 2.8, maxPriority: 4 }
// ]
```

## Base Record Properties

All records have these base properties:

```typescript
interface BaseRecord {
  id: string;           // Unique ID
  collection_id: string; // Collection ID
  collection_name: string; // Collection name
  created_at: string;    // ISO timestamp
  updated_at: string;    // ISO timestamp
}
```

## Dynamic Collections

For collections without a defined type, use `any`:

```typescript
const records = await client.records.list('dynamic_collection');
// Returns: RecordListResponse<any>
```
