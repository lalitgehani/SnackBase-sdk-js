# Codelists

First-class **shared reference dictionaries** in SnackBase (system or account scope).
Submission **codes** are stable machine keys; **labels** resolve at read time by language.

Aligned with `@snackbase/sdk` (`client.codelists`) and `@snackbase/react` hooks.

## Concepts

| Concept | Meaning |
|---------|---------|
| System codelist | Platform-wide (`scope: system`), e.g. builtin `regions` |
| Account codelist | Private to one tenant |
| Effective values | System values + account extensions − hidden overrides + labels |
| Override | Per-account delta only: visibility, default, sort, metadata merge |
| Field option | Collection field may set `"codelist": "regions"` for create/update membership checks |

Prefer codelists for shared dictionaries instead of copying catalog rows into every tenant collection. Platform migrate does not seed a default list.

## SDK

```typescript
import { SnackBaseClient } from '@snackbase/sdk';

const client = new SnackBaseClient({ baseUrl: '...' });

// Picker SoT
const regions = await client.codelists.getValues('regions', {
  lang: 'en',
  active: true,
});
// [{ code: 'eu-01', label: 'EU Central (Germany)', metadata: {...}, ... }]

const lists = await client.codelists.list();
const meta = await client.codelists.get('regions');

// Account admin: hide a value for own account
await client.codelists.setOverride('regions', 'eu-01', { visibility: 'hidden' });

// Superadmin: must pass tenant account_id
await client.codelists.setOverride(
  'regions',
  'eu-01',
  { visibility: 'hidden' },
  tenantAccountId,
);
```

### Loading picker values

```typescript
// Effective values for a codelist the operator created (example code: regions)
await client.codelists.getValues('regions', { lang: 'en', active: true });
```

## React (`@snackbase/react`)

```tsx
import { useCodelistValues, useCodelists, useCodelistOverride } from '@snackbase/react';

function RegionSelect() {
  const { data, loading, error } = useCodelistValues('regions', { lang: 'en' });
  if (loading) return <span>Loading…</span>;
  if (error) return <span>{error.message}</span>;
  return (
    <select>
      {(data ?? []).map((r) => (
        <option key={r.code} value={r.code}>
          {r.label}
        </option>
      ))}
    </select>
  );
}
```

## Record validation

Schema field option (server-enforced):

```json
{ "name": "region", "type": "text", "required": true, "codelist": "regions" }
```

Invalid or hidden codes for the record’s account are rejected on create/update.

## MCP

Tool: `snackbase_codelists` with actions `list`, `get`, `get_values`, `create`, `update`,
`delete`, `create_value`, `set_override`, `clear_override`.

## Non-goals (v1)

- Full CDISC Controlled Terminology regulatory engine
- Dual source of truth with collection-based region rows
- Per-account label overrides (visibility/default/sort only)
