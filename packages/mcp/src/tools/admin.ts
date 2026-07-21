import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const adminTool: Tool = {
  name: 'snackbase_admin',
  description:
    'Manage SnackBase admin configurations. Configure system settings, providers (email, OAuth, storage), delete configs, inspect provider schemas, and test connections. Superadmin-oriented.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: [
          'get_stats',
          'get_recent',
          'list_system',
          'list_account',
          'get_values',
          'update_values',
          'update_status',
          'create',
          'delete',
          'list_providers',
          'get_provider_schema',
          'test_connection',
          'set_default',
          'unset_default',
        ],
        description: 'The admin action to perform.',
      },
      limit: {
        type: 'number',
        description: 'Limit for recent configurations (default 10).',
      },
      category: {
        type: 'string',
        description: 'Filter configurations or providers by category.',
      },
      account_id: {
        type: 'string',
        description: 'Account ID for account-specific configurations (optional on create).',
      },
      config_id: {
        type: 'string',
        description: 'Configuration ID for get/update/delete/status/default actions.',
      },
      values: {
        type: 'object',
        description: 'Configuration values for update_values.',
      },
      display_name: {
        type: 'string',
        description: 'Display name for the new configuration (required for create).',
      },
      provider_name: {
        type: 'string',
        description: 'Provider name for create, get_provider_schema, or test_connection.',
      },
      enabled: {
        type: 'boolean',
        description: 'Whether the configuration is enabled (create or update_status).',
      },
      config: {
        type: 'object',
        description: 'Provider config object for create or test_connection.',
      },
    },
    required: ['action'],
  },
};

export async function handleAdminTool(args: any) {
  const client = createClient();
  const {
    action,
    limit,
    category,
    account_id,
    config_id,
    values,
    display_name,
    provider_name,
    enabled,
    config,
  } = args;

  try {
    switch (action) {
      case 'get_stats': {
        const stats = await client.admin.getConfigurationStats();
        return {
          content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
        };
      }

      case 'get_recent': {
        const recent = await client.admin.getRecentConfigurations(limit);
        return {
          content: [{ type: 'text', text: JSON.stringify(recent, null, 2) }],
        };
      }

      case 'list_system': {
        const systemConfigs = await client.admin.listSystemConfigurations(category);
        return {
          content: [{ type: 'text', text: JSON.stringify(systemConfigs, null, 2) }],
        };
      }

      case 'list_account': {
        if (!account_id) throw new Error('account_id is required for list_account action');
        const accountConfigs = await client.admin.listAccountConfigurations(account_id, category);
        return {
          content: [{ type: 'text', text: JSON.stringify(accountConfigs, null, 2) }],
        };
      }

      case 'get_values': {
        if (!config_id) throw new Error('config_id is required for get_values action');
        const configValues = await client.admin.getConfigurationValues(config_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(configValues, null, 2) }],
        };
      }

      case 'update_values': {
        if (!config_id) throw new Error('config_id is required for update_values action');
        if (!values) throw new Error('values are required for update_values action');
        const updatedValues = await client.admin.updateConfigurationValues(config_id, values);
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedValues, null, 2) }],
        };
      }

      case 'create': {
        if (!display_name || !category || !provider_name || !config) {
          throw new Error(
            'display_name, category, provider_name, and config are required for create action',
          );
        }
        const newConfig = await client.admin.createConfiguration({
          display_name,
          category,
          provider_name,
          config,
          account_id,
          enabled,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(newConfig, null, 2) }],
        };
      }

      case 'delete': {
        if (!config_id) throw new Error('config_id is required for delete action');
        const deleteResult = await client.admin.deleteConfiguration(config_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(deleteResult, null, 2) }],
        };
      }

      case 'list_providers': {
        const providers = await client.admin.listProviders(category);
        return {
          content: [{ type: 'text', text: JSON.stringify(providers, null, 2) }],
        };
      }

      case 'get_provider_schema': {
        if (!category || !provider_name) {
          throw new Error('category and provider_name are required for get_provider_schema action');
        }
        const schema = await client.admin.getProviderSchema(category, provider_name);
        return {
          content: [{ type: 'text', text: JSON.stringify(schema, null, 2) }],
        };
      }

      case 'test_connection': {
        if (!category || !provider_name || !config) {
          throw new Error('category, provider_name, and config are required for test_connection action');
        }
        const testResult = await client.admin.testConnection(category, provider_name, config);
        return {
          content: [{ type: 'text', text: JSON.stringify(testResult, null, 2) }],
        };
      }

      case 'update_status': {
        if (!config_id) throw new Error('config_id is required for update_status action');
        if (enabled === undefined) throw new Error('enabled is required for update_status action');
        const statusResult = await client.admin.updateConfigurationStatus(config_id, enabled);
        return {
          content: [{ type: 'text', text: JSON.stringify(statusResult, null, 2) }],
        };
      }

      case 'set_default': {
        if (!config_id) throw new Error('config_id is required for set_default action');
        const setDefaultResult = await client.admin.setConfigurationDefault(config_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(setDefaultResult, null, 2) }],
        };
      }

      case 'unset_default': {
        if (!config_id) throw new Error('config_id is required for unset_default action');
        const unsetDefaultResult = await client.admin.unsetConfigurationDefault(config_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(unsetDefaultResult, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
