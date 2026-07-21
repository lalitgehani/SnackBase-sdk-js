The `records` service provides dynamic CRUD operations for any collection. Use generics for type safety.

Aligned with `RecordService` in `@snackbase/sdk` ≥ 0.6.0.

## Table of Contents

- [Type-Safe Operations](#type-safe-operations)
- [Create a Record](#create-a-record)
- [Get a Record](#get-a-record)
- [Update a Record](#update-a-record)
- [Delete a Record](#delete-a-record)
- [List Records](#list-records)
- [Cursor Pagination](#cursor-pagination)
- [Filtering](#filtering)
- [Query Builder](#query-builder)
- [Batch Operations](#batch-operations)
- [Aggregation](#aggregation)
- [Base Record Properties](#base-record-properties)

## Type-Safe Operations

```typescript
interface Task {
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: number;
  due_date?: string;
  assignee_id?: string;
}
```

System fields (`id`, `account_id`, `created_at`, `updated_at`, optional `created_by` / `updated_by`) are on `BaseRecord` and merged into responses.

## Create a Record

```typescript
const task = await client.records.create<Task>('tasks', {
  title: 'Fix authentication bug',
  status: 'todo',
  priority: 5,
});

console.log(task.id); // Auto-generated
```

## Get a Record

```typescript
const task = await client.records.get<Task>('tasks', taskId);
// Optional fields / expand (arrays are comma-joined)
const slim = await client.records.get<Task>('tasks', taskId, {
  fields: ['id', 'title'],
  expand: ['assignee_id'], // reference field paths
});
```

## Update a Record

### Full Replacement (PUT) — `update`

```typescript
const replaced = await client.records.update('tasks', taskId, {
  title: 'Updated title',
  status: 'todo',
  priority: 3,
});
```

### Partial Update (PATCH) — `patch`

```typescript
const updated = await client.records.patch('tasks', taskId, {
  status: 'done', // only provided fields change
});
```

## Delete a Record

```typescript
await client.records.delete('tasks', taskId);
// Returns { success: true }
```

## List Records

```typescript
const result = await client.records.list<Task>('tasks', {
  skip: 0,
  limit: 50,
  sort: '-priority,created_at',
  fields: ['id', 'title', 'status'],
  expand: ['assignee_id'], // reference field paths, comma-joined over the wire
  filter: 'status = "todo" AND priority > 3',
});

console.log(result.items);
console.log(result.total);
console.log(result.skip);
console.log(result.limit);
```

## Cursor Pagination

```typescript
const page1 = await client.records.list<Task>('tasks', {
  limit: 20,
  cursor: undefined,
  include_count: true,
});

// Forward
const page2 = await client.records.list<Task>('tasks', {
  limit: 20,
  cursor: page1.next_cursor ?? undefined,
});

// Backward
const prev = await client.records.list<Task>('tasks', {
  limit: 20,
  cursor_before: page2.prev_cursor ?? undefined,
});

console.log(page1.next_cursor, page1.prev_cursor, page1.has_more);
```

## Filtering

Filters are **string only**. Do not pass object literals as `filter`.

### Operators (query builder / backend)

| Operator | Meaning |
| -------- | ------- |
| `=` `!=` | Equality |
| `>` `>=` `<` `<=` | Comparison |
| `~` | Contains / LIKE-style match |
| `IN` | Membership in a list |
| `IS NULL` / `IS NOT NULL` | Null checks |

```typescript
// Exact match
filter: 'status = "todo"'

// Comparison
filter: 'priority > 3'
filter: 'created_at <= "2025-01-01"'

// Contains (~), not SQL LIKE as the primary operator
filter: 'title ~ "bug"'

// Logical
filter: 'status = "todo" AND priority > 3'
filter: '(status = "urgent" OR priority >= 4)'
```

## Query Builder

```typescript
// First page
const page1 = await client.records
  .query<Task>('tasks')
  .filter('status = "todo"')
  .filter('priority', '>', 3)
  .get();

// Next page — cursor() requires a string token (e.g. from list/query next_cursor)
const page2 = await client.records
  .query<Task>('tasks')
  .filter('status = "todo"')
  .cursor(page1.next_cursor!)
  .get();
```

`query(collection)` returns a `QueryBuilder` with `.filter`, `.select`, `.expand`, `.sort`, `.cursor(token: string)`, `.get`, etc.

## Batch Operations

Use `batchCreate` / `batchUpdate` / `batchDelete` (not bulk*).

### Batch Create

```typescript
const created = await client.records.batchCreate('tasks', [
  { title: 'Task 1', status: 'todo', priority: 1 },
  { title: 'Task 2', status: 'todo', priority: 2 },
]);
// { created: BaseRecord[], count: number }
```

### Batch Update

Payload items are `{ id, data }` (not `{ id, changes }`):

```typescript
const updated = await client.records.batchUpdate('tasks', [
  { id: '1', data: { status: 'done' } },
  { id: '2', data: { status: 'done' } },
]);
// { updated: BaseRecord[], count: number }
```

### Batch Delete

```typescript
const result = await client.records.batchDelete('tasks', [
  'task-1',
  'task-2',
  'task-3',
]);
// { deleted: string[], count: number }
```

## Aggregation

Params use string `functions`, optional `group_by`, `filter`, and `having`:

```typescript
const result = await client.records.aggregate('tasks', {
  functions: 'count(),avg(priority),max(priority)',
  group_by: 'status',
  filter: 'priority > 0',
  having: 'count() > 5',
});

// AggregationResponse: { results: Record<string, any>[], total_groups: number }
console.log(result.results, result.total_groups);
```

## Base Record Properties

```typescript
interface BaseRecord {
  id: string;
  account_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  [key: string]: any;
}
```

There is no required `collection_id` / `collection_name` on records.

## Dynamic Collections

```typescript
const records = await client.records.list('dynamic_collection');
// RecordListResponse<any>
```
