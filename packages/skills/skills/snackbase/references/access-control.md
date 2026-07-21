Identity and access helpers for multi-tenant RBAC.

**There is no `PermissionService` or `client.permissions`.** Use `client.collectionRules` for collection-level rules (Permission System V2).

Aligned with `@snackbase/sdk` ≥ 0.6.0.

## Collection rules — `client.collectionRules`

```typescript
const rules = await client.collectionRules.get('tasks');
// CollectionRule: list_rule, view_rule, create_rule, update_rule, delete_rule,
// list_fields, view_fields, create_fields, update_fields

await client.collectionRules.update('tasks', {
  list_rule: '', // empty string = public
  view_rule: '@request.auth.id != ""',
  create_rule: '@request.auth.id != ""',
  update_rule: '@request.auth.id = record.created_by',
  delete_rule: null, // null = locked (access denied)
  list_fields: '*',
  view_fields: '*',
  create_fields: 'title,status,priority',
  update_fields: 'title,status,priority',
});

const validation = await client.collectionRules.validateRule(
  '@request.auth.id != ""',
  'create',
  ['title', 'status'],
);
// { valid: boolean, errors?: string[] }

const test = await client.collectionRules.testRule(
  '@request.auth.id != ""',
  { request: { auth: { id: 'user-1' } } },
);
// { result: boolean }
```

### Rule value semantics

| Value | Meaning |
| ----- | ------- |
| `null` | Locked (deny) |
| `""` | Public (allow all) |
| expression string | Evaluated against request context |

## Groups — `client.groups`

```typescript
const groups = await client.groups.list({ search: 'admins' });
const group = await client.groups.get(groupId);
const created = await client.groups.create({
  name: 'editors',
  description: 'Can edit content',
});
await client.groups.update(groupId, { description: 'Updated' });
await client.groups.addMember(groupId, userId);
await client.groups.removeMember(groupId, userId);
await client.groups.delete(groupId);
```

## Invitations — `client.invitations`

```typescript
const { invitations, total } = await client.invitations.list({
  status_filter: 'pending',
});

const invite = await client.invitations.create({
  email: 'new@example.com',
  role_id: roleId,
});

await client.invitations.resend(invite.id);

// Public accept flow (unauthenticated)
const details = await client.invitations.getPublic(token);
// { email, account_name, invited_by_name, expires_at, is_valid }

const auth = await client.invitations.accept(token, 'SecurePassword123!');
// AuthResponse — session established

await client.invitations.cancel(invite.id);
```

## Roles — `client.roles`

```typescript
const { items, total } = await client.roles.list();
const role = await client.roles.get(roleId);
const created = await client.roles.create({
  name: 'editor',
  description: 'Edit records',
});
await client.roles.update(roleId, { description: 'Updated' });
await client.roles.delete(roleId);
```
