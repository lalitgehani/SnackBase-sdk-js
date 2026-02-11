import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const adminTool: Tool = {
  name: 'snackbase_admin',
  description: 'Manage SnackBase admin configurations. Configure system settings, providers (email, OAuth, storage), and test connections.',
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
          'create',
          'list_providers',
          'test_connection'
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
        description: 'Account ID for account-specific configurations.',
      },
      config_id: {
        type: 'string',
        description: 'Configuration ID for getting or updating values.',
      },
      values: {
        type: 'object',
        description: 'Configuration values for create or update.',
      },
      name: {
        type: 'string',
        description: 'Name for the new configuration.',
      },
      provider_name: {
        type: 'string',
        description: 'Provider name for creation or connection test.',
      },
      is_system: {
        type: 'boolean',
        description: 'Whether it is a system-level configuration.',
      },
      enabled: {
        type: 'boolean',
        description: 'Whether the configuration is enabled.',
      },
      config: {
        type: 'object',
        description: 'Configuration object to test connection with.',
      }
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
    name, 
    provider_name, 
    is_system, 
    enabled,
    config
  } = args;

  try {
    switch (action) {
      case 'get_stats':
        const stats = await client.admin.getConfigurationStats();
        return {
          content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
        };

      case 'get_recent':
        const recent = await client.admin.getRecentConfigurations(limit);
        return {
          content: [{ type: 'text', text: JSON.stringify(recent, null, 2) }],
        };

      case 'list_system':
        const systemConfigs = await client.admin.listSystemConfigurations(category);
        return {
          content: [{ type: 'text', text: JSON.stringify(systemConfigs, null, 2) }],
        };

      case 'list_account':
        if (!account_id) throw new Error('account_id is required for list_account action');
        const accountConfigs = await client.admin.listAccountConfigurations(account_id, category);
        return {
          content: [{ type: 'text', text: JSON.stringify(accountConfigs, null, 2) }],
        };

      case 'get_values':
        if (!config_id) throw new Error('config_id is required for get_values action');
        const configValues = await client.admin.getConfigurationValues(config_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(configValues, null, 2) }],
        };

      case 'update_values':
        if (!config_id) throw new Error('config_id is required for update_values action');
        if (!values) throw new Error('values are required for update_values action');
        const updatedValues = await client.admin.updateConfigurationValues(config_id, values);
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedValues, null, 2) }],
        };

      case 'create':
        if (!name || !category || !provider_name || !values) {
          throw new Error('name, category, provider_name, and values are required for create action');
        }
        const newConfig = await client.admin.createConfiguration({
          name,
          category,
          provider_name,
          values,
          is_system,
          account_id,
          enabled
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(newConfig, null, 2) }],
        };

      case 'list_providers':
        const providers = await client.admin.listProviders(category);
        return {
          content: [{ type: 'text', text: JSON.stringify(providers, null, 2) }],
        };

      case 'test_connection':
        if (!category || !provider_name || !config) {
          throw new Error('category, provider_name, and config are required for test_connection action');
        }
        const testResult = await client.admin.testConnection(category, provider_name, config);
        return {
          content: [{ type: 'text', text: JSON.stringify(testResult, null, 2) }],
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
