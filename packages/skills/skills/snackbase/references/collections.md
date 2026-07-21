Collections define the structure for storing records. Use the `collections` service for schema operations.

Aligned with `CollectionService` and `types/collection.ts` in `@snackbase/sdk` ≥ 0.6.0.

## Table of Contents

- [Create a Collection](#create-a-collection)
- [List Collections](#list-collections)
- [Get a Collection](#get-a-collection)
- [Update a Collection](#update-a-collection)
- [Delete a Collection](#delete-a-collection)
- [Export / Import](#export--import)
- [Collection Properties](#collection-properties)
- [Field Types](#field-types)

## Create a Collection

Use only valid FieldTypes. Prefer `text` + `reference` + `computed` instead of invented types like `select`.

```typescript
const collection = await client.collections.create({
  name: 'tasks',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'status', type: 'text', required: true }, // store enum values as text
    { name: 'priority', type: 'number' },
    { name: 'due_date', type: 'datetime' },
    {
      name: 'assignee_id',
      type: 'reference',
      collection: 'users',
      on_delete: 'set_null', // cascade | set_null | restrict
    },
    {
      name: 'priority_label',
      type: 'computed',
      expression: "CASE WHEN priority >= 4 THEN 'high' ELSE 'normal' END",
      return_type: 'text',
    },
    {
      name: 'contact_email',
      type: 'email',
      pii: true,
      mask_type: 'email',
    },
  ],
  list_rule: '', // empty string = public; null = locked
  view_rule: '',
  create_rule: '@request.auth.id != ""',
  update_rule: '@request.auth.id != ""',
  delete_rule: null, // locked
});

console.log(collection.id, collection.name, collection.has_public_access);
```

## List Collections

```typescript
const collections = await client.collections.list();
// Collection[] (SDK unwraps the backend items envelope)

collections.forEach((col) => {
  console.log(`${col.name} - ${col.field_count} fields`);
});

// Names only
const names = await client.collections.listNames();
```

## Get a Collection

```typescript
const collection = await client.collections.get('collection-id');
console.log(collection.name, collection.fields, collection.record_count);
console.log(collection.has_public_access);
```

## Update a Collection

Field **types cannot be changed** for data safety. Backend accepts PUT.

```typescript
const collection = await client.collections.get('collection-id');

await client.collections.update('collection-id', {
  fields: [
    ...collection.fields,
    { name: 'notes', type: 'text' },
  ],
});
```

## Delete a Collection

```typescript
await client.collections.delete('collection-id');
// Also drops the physical table / records
```

## Export / Import

```typescript
const exportData = await client.collections.export({
  collection_ids: ['collection-id-1', 'collection-id-2'],
});

const result = await client.collections.import({
  data: exportData,
  strategy: 'update', // 'error' | 'skip' | 'update'
});

console.log(result.success, result.imported_count);
```

## Collection Properties

```typescript
interface Collection {
  id: string;
  name: string;
  fields: FieldDefinition[];
  record_count: number;
  field_count: number;
  created_at: string;
  updated_at: string;
  /** Accessible without authentication when rules allow */
  has_public_access?: boolean;
}

interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  default?: any;
  unique?: boolean;
  options?: string[] | Record<string, any> | null;
  /** Target collection name (required for reference) */
  collection?: string | null;
  /** cascade | set_null | restrict */
  on_delete?: 'cascade' | 'set_null' | 'restrict' | string | null;
  pii?: boolean;
  mask_type?: 'email' | 'ssn' | 'phone' | 'name' | 'full' | 'custom' | string | null;
  expression?: string | null; // computed fields
  return_type?: 'text' | 'number' | 'boolean' | 'datetime' | null;
}
```

## Field Types

Valid `FieldType` values (backend enum):

```typescript
type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'datetime'
  | 'email'
  | 'url'
  | 'json'
  | 'reference'
  | 'file'
  | 'date'
  | 'computed';
```

**Not supported** as field types: `relation`, `select`, `multi_select`, `phone`.
Use `reference` for relations, `text` (or `json`) for constrained values, and `mask_type: 'phone'` only as a PII mask strategy when `pii: true`.

### Reference fields

```typescript
{
  name: 'project_id',
  type: 'reference',
  collection: 'projects',
  on_delete: 'cascade',
}
```

### Computed fields

```typescript
{
  name: 'full_name',
  type: 'computed',
  expression: "first_name || ' ' || last_name",
  return_type: 'text',
}
```

### Access rules on create

Rule semantics (Permission System V2):

- `null` — locked (access denied)
- `""` (empty string) — public
- expression string — evaluated against request context
