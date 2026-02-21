Complete reference for `AdminService` — superadmin operations and system configuration management.

Accessed via `client.admin` (requires superadmin session).

## Types

```typescript
interface Configuration {
  id: string;
  name: string;
  category: string; // e.g. 'email', 'storage', 'auth'
  provider_name: string; // e.g. 'sendgrid', 'resend', 's3'
  is_system: boolean;
  account_id?: string; // present for account-scoped configs
  enabled: boolean;
  is_default?: boolean; // v0.6.0+: default provider for this category/scope
  created_at: string;
  updated_at: string;
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

interface ConfigurationStats {
  system_count: number;
  account_count: number;
  by_category: Record<string, { system: number; account: number }>;
}

interface ProviderDefinition {
  name: string;
  display_name: string;
  category: string;
  description?: string;
  is_built_in: boolean;
  icon?: string;
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

interface ConfigurationCreate {
  name: string;
  category: string;
  provider_name: string;
  values: Record<string, any>;
  is_system?: boolean;
  account_id?: string;
  enabled?: boolean;
}
```

## Configuration Listings

```typescript
// Stats across all configurations by category
const stats = await client.admin.getConfigurationStats();

// Recently modified configurations
const recent = await client.admin.getRecentConfigurations(10);

// All system-level configurations, optionally filtered by category
const systemConfigs = await client.admin.listSystemConfigurations("email");

// All configurations for a specific account
const accountConfigs = await client.admin.listAccountConfigurations(
  "acc-123",
  "email",
);
```

## Configuration Values

```typescript
// Retrieve decrypted values (secrets are masked)
const values = await client.admin.getConfigurationValues("conf-id");

// Update configuration values
const updated = await client.admin.updateConfigurationValues("conf-id", {
  api_key: "new-key",
  from_email: "no-reply@example.com",
});
```

## Configuration Lifecycle

```typescript
// Create a new configuration
const config = await client.admin.createConfiguration({
  name: "Primary Email",
  category: "email",
  provider_name: "sendgrid",
  values: { api_key: "SG.xxx" },
  is_system: true,
  enabled: true,
});

// Enable or disable — returns { status, enabled, is_default }
const result = await client.admin.updateConfigurationStatus("conf-id", false);
// If disabling auto-cleared the default: result.is_default === false

// Delete a configuration
await client.admin.deleteConfiguration("conf-id");
```

## Default Provider Management (v0.6.0+)

Only one configuration can be the default per category+scope at a time. The provider must be enabled before setting as default. Setting a new default atomically clears any previous one.

```typescript
// Set as default — provider must be enabled
const set = await client.admin.setConfigurationDefault("conf-id");
// set.is_default === true, set.provider_name, set.display_name

// Clear the default flag without setting a new one
const unset = await client.admin.unsetConfigurationDefault("conf-id");
// unset.is_default === false
```

**Error cases for `setConfigurationDefault`:**

- `404` — config not found
- `400` — provider is disabled (enable it first with `updateConfigurationStatus`)

## Providers

```typescript
// List all available provider definitions, optionally filtered by category
const providers = await client.admin.listProviders("email");

// Get the JSON schema for a provider's configuration values
const schema = await client.admin.getProviderSchema("email", "sendgrid");

// Test a provider connection (15s timeout)
const test = await client.admin.testConnection("email", "sendgrid", {
  api_key: "SG.xxx",
});
// test.success, test.message, test.details
```

## MCP Tool Actions

When using the `@snackbase/mcp` package, these map to the `snackbase_admin` tool:

| Action            | Required params                               | SDK method                           |
| ----------------- | --------------------------------------------- | ------------------------------------ |
| `get_stats`       | —                                             | `getConfigurationStats`              |
| `get_recent`      | —                                             | `getRecentConfigurations(limit)`     |
| `list_system`     | —                                             | `listSystemConfigurations(category)` |
| `list_account`    | `account_id`                                  | `listAccountConfigurations`          |
| `get_values`      | `config_id`                                   | `getConfigurationValues`             |
| `update_values`   | `config_id`, `values`                         | `updateConfigurationValues`          |
| `update_status`   | `config_id`, `enabled`                        | `updateConfigurationStatus`          |
| `create`          | `name`, `category`, `provider_name`, `values` | `createConfiguration`                |
| `list_providers`  | —                                             | `listProviders(category)`            |
| `test_connection` | `category`, `provider_name`, `config`         | `testConnection`                     |
| `set_default`     | `config_id`                                   | `setConfigurationDefault`            |
| `unset_default`   | `config_id`                                   | `unsetConfigurationDefault`          |
