import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const collectionRulesTool: Tool = {
  name: 'snackbase_collection_rules',
  description: 'Manage access control rules for SnackBase collections. Get, update, validate, and test permission rules that control who can list, view, create, update, and delete records.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get', 'update', 'validate', 'test'],
        description: 'The action to perform on collection rules.',
      },
      collection_name: {
        type: 'string',
        description: 'The name of the collection (required for get, update).',
      },
      data: {
        type: 'object',
        properties: {
          list_rule: { type: ['string', 'null'] },
          view_rule: { type: ['string', 'null'] },
          create_rule: { type: ['string', 'null'] },
          update_rule: { type: ['string', 'null'] },
          delete_rule: { type: ['string', 'null'] },
          list_fields: { type: 'string', description: 'Comma-separated field list or "*"' },
          view_fields: { type: 'string', description: 'Comma-separated field list or "*"' },
          create_fields: { type: 'string', description: 'Comma-separated field list or "*"' },
          update_fields: { type: 'string', description: 'Comma-separated field list or "*"' },
        },
        description: 'The rule and field configuration data (required for update).',
      },
      rule: {
        type: 'string',
        description: 'The rule expression to validate or test (required for validate, test).',
      },
      operation: {
        type: 'string',
        enum: ['list', 'view', 'create', 'update', 'delete'],
        description: 'The operation to validate the rule for (required for validate).',
      },
      collection_fields: {
        type: 'array',
        items: { type: 'string' },
        description: 'Available field names in the collection (required for validate).',
      },
      context: {
        type: 'object',
        description: 'Test context with user/record data (required for test).',
      },
    },
    required: ['action'],
  },
};

export async function handleCollectionRulesTool(args: any) {
  const client = createClient();
  const { action, collection_name, data, rule, operation, collection_fields, context } = args;

  try {
    switch (action) {
      case 'get':
        if (!collection_name) throw new Error('collection_name is required for get action');
        const rules = await client.collectionRules.get(collection_name);
        return {
          content: [{ type: 'text', text: JSON.stringify(rules, null, 2) }],
        };

      case 'update':
        if (!collection_name || !data) throw new Error('collection_name and data are required for update action');
        const updatedRules = await client.collectionRules.update(collection_name, data);
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedRules, null, 2) }],
        };

      case 'validate':
        if (!rule || !operation || !collection_fields) {
          throw new Error('rule, operation, and collection_fields are required for validate action');
        }
        const validationResult = await client.collectionRules.validateRule(rule, operation, collection_fields);
        return {
          content: [{ type: 'text', text: JSON.stringify(validationResult, null, 2) }],
        };

      case 'test':
        if (!rule || !context) throw new Error('rule and context are required for test action');
        const testResult = await client.collectionRules.testRule(rule, context);
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
