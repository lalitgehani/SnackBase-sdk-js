Complete reference for `AdminService` — superadmin operations and system configuration management.

Accessed via `client.admin` (requires superadmin session).
Aligned with `types/admin.ts` in `@snackbase/sdk` ≥ 0.6.0.

## Types

```typescript
interface Configuration {
  id: string;
  display_name: string;
  category: string; // e.g. 'email', 'storage', 'auth'
  provider_name: string; // e.g. 'sendgrid', 'resend', 's3'
  is_system?: boolean;
  is_builtin?: boolean;
  account_id?: string;
  enabled: boolean;
  is_default?: boolean;
  priority?: number;
  logo_url?: string;
  created_at?: string;
  updated_at: string;
}

interface ConfigurationStats {
  system_configs: {
    total: number;
    by_category: Record<string, number>;
  };
  account_configs: {
    total: number;
    by_category: Record<string, number>;
  };
}

interface ConfigurationCreate {
  display_name: string;
  category: string;
  provider_name: string;
  config: Record<string, any>; // provider values
  account_id?: string;
  enabled?: boolean;
}

interface ConfigurationCreateResult {
  id: string;
  status: string;
}

interface UpdateConfigurationStatusResult {
  status: string;
  enabled: boolean;
  is_default: boolean; // may be false if disabling auto-cleared the default
}

interface SetDefaultResult {
  status: string;
  is_default: boolean;
  provider_name: string;
  display_name: string;
}

interface UnsetDefaultResult {
  status: string;
  is_default: boolean; // always false
}

interface ProviderDefinition {
  provider_name: string;
  display_name: string;
  category: string;
  is_builtin: boolean;
  logo_url?: string;
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}
```

## Configuration Listings

```typescript
const stats = await client.admin.getConfigurationStats();
console.log(stats.system_configs.total, stats.account_configs.by_category);

const recent = await client.admin.getRecentConfigurations(10);

const systemConfigs = await client.admin.listSystemConfigurations('email');

const accountConfigs = await client.admin.listAccountConfigurations(
  'AB1234',
  'email',
);
```

## Configuration Values

```typescript
const values = await client.admin.getConfigurationValues('conf-id');

const updated = await client.admin.updateConfigurationValues('conf-id', {
  api_key: 'new-key',
  from_email: 'no-reply@example.com',
});
// { status: string }
```

## Configuration Lifecycle

```typescript
const created = await client.admin.createConfiguration({
  display_name: 'Primary Email',
  category: 'email',
  provider_name: 'sendgrid',
  config: { api_key: 'SG.xxx' },
  enabled: true,
});
// { id, status }

const result = await client.admin.updateConfigurationStatus(created.id, false);
// { status, enabled, is_default }

await client.admin.deleteConfiguration(created.id);
```

## Default Provider Management (v0.6.0+)

Only one configuration can be the default per category+scope at a time. The provider must be enabled before setting as default.

```typescript
const set = await client.admin.setConfigurationDefault('conf-id');
// set.is_default === true, set.provider_name, set.display_name

const unset = await client.admin.unsetConfigurationDefault('conf-id');
// unset.is_default === false
```

**Error cases for `setConfigurationDefault`:**

- `404` — config not found
- `400` — provider is disabled (enable first with `updateConfigurationStatus`)

## Providers

```typescript
const providers = await client.admin.listProviders('email');

const schema = await client.admin.getProviderSchema('email', 'sendgrid');

const test = await client.admin.testConnection('email', 'sendgrid', {
  api_key: 'SG.xxx',
});
// test.success, test.message, test.details
```

## MCP vs SDK

Skills document `client.admin.*` TypeScript methods only. Claude tool-use servers expose different action names via `@snackbase/mcp` — do not treat MCP action strings as SDK methods. See the package README for the MCP boundary.
