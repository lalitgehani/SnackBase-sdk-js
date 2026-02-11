import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const macrosTool: Tool = {
  name: 'snackbase_macros',
  description: 'Manage SnackBase SQL macros for custom permission logic. Create, test, and manage macros used in collection access rules.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'get', 'create', 'update', 'delete', 'test'],
        description: 'The action to perform on macros.',
      },
      macro_id: {
        type: 'string',
        description: 'The unique ID of the macro (required for get, update, delete, test).',
      },
      name: {
        type: 'string',
        description: 'The name of the macro (required for create).',
      },
      description: {
        type: 'string',
        description: 'A description of what the macro does (required for create).',
      },
      sql_query: {
        type: 'string',
        description: 'The SQL query for the macro (required for create).',
      },
      parameters: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of parameter names used in the SQL query (required for create).',
      },
      params: {
        type: 'object',
        description: 'Parameter values for testing the macro (required for test).',
      },
    },
    required: ['action'],
  },
};

export async function handleMacrosTool(args: any) {
  const client = createClient();
  const { action, macro_id, name, description, sql_query, parameters, params } = args;

  try {
    switch (action) {
      case 'list':
        const macros = await client.macros.list();
        return {
          content: [{ type: 'text', text: JSON.stringify(macros, null, 2) }],
        };

      case 'get':
        if (!macro_id) throw new Error('macro_id is required for get action');
        const macro = await client.macros.get(macro_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(macro, null, 2) }],
        };

      case 'create':
        if (!name || !description || !sql_query || !parameters) {
          throw new Error('name, description, sql_query, and parameters are required for create action');
        }
        const newMacro = await client.macros.create({
          name,
          description,
          sql_query,
          parameters,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(newMacro, null, 2) }],
        };

      case 'update':
        if (!macro_id) throw new Error('macro_id is required for update action');
        const updatedMacro = await client.macros.update(macro_id, {
          name,
          description,
          sql_query,
          parameters,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedMacro, null, 2) }],
        };

      case 'delete':
        if (!macro_id) throw new Error('macro_id is required for delete action');
        const deleteResult = await client.macros.delete(macro_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(deleteResult, null, 2) }],
        };

      case 'test':
        if (!macro_id || !params) throw new Error('macro_id and params are required for test action');
        const testResult = await client.macros.test(macro_id, params);
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
