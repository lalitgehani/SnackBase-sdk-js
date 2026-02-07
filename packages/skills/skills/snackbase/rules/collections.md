---
name: collections
description: Collection CRUD operations, schema management, and versioning
metadata:
  tags: collection, schema, crud, versioning
---

Collections define the structure for storing records. Use the `collections` service for all schema operations.

## Create a Collection

```typescript
const collection = await client.collections.create({
  name: 'tasks',
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      options: ['todo', 'in-progress', 'done'],
      required: true
    },
    { name: 'priority', type: 'number' },
    { name: 'dueDate', type: 'datetime' },
    { name: 'assigneeId', type: 'text' }
  ]
});

console.log(collection.id);    // Auto-generated ID
console.log(collection.name);  // 'tasks'
console.log(collection.fields); // Field definitions
```

## List Collections

```typescript
const collections = await client.collections.list();

console.log(`Found ${collections.length} collections`);
collections.forEach(col => {
  console.log(`${col.name} - ${col.field_count} fields`);
});
```

## Get a Collection

```typescript
// Get by collection ID
const collection = await client.collections.get('collection-id');

console.log(collection.name);
console.log(collection.fields);
console.log(collection.record_count);
```

## Update a Collection

```typescript
await client.collections.update('collection-id', {
  name: 'Project Tasks',
  fields: [
    // Updated field definitions
  ]
});
```

### Update Fields

```typescript
const collection = await client.collections.get('collection-id');

await client.collections.update('collection-id', {
  fields: [
    ...collection.fields,
    { name: 'tags', type: 'multi_select', options: ['urgent', 'bug', 'feature'] }
  ]
});
```

## Delete a Collection

```typescript
await client.collections.delete('collection-id');
// Warning: This also deletes all records in the collection
```

## Export Collections

```typescript
const exportData = await client.collections.export({
  collection_ids: ['collection-id-1', 'collection-id-2']
});

console.log(exportData.version); // Export format version
console.log(exportData.exported_at); // ISO timestamp
console.log(exportData.collections); // Array of collection schemas
```

## Import Collections

```typescript
const result = await client.collections.import({
  data: exportData, // CollectionExportData from export
  strategy: 'update' // 'error' | 'skip' | 'update'
});

console.log(result.success); // Overall success
console.log(result.imported_count); // Number of collections imported
console.log(result.collections); // Per-collection results
```

## Collection Properties

```typescript
interface Collection {
  id: string;           // Unique ID
  name: string;         // Collection name
  fields: FieldDefinition[]; // Field definitions
  record_count: number; // Number of records
  field_count: number;  // Number of fields
  created_at: string;   // ISO timestamp
  updated_at: string;   // ISO timestamp
}

interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  default?: any;
  unique?: boolean;
  options?: string[]; // For select and multi_select
  collection?: string; // For relation fields
}

type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'url'
  | 'phone'
  | 'select'
  | 'multi_select'
  | 'relation'
  | 'json';
```
