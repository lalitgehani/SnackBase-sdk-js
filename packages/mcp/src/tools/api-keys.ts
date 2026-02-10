import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const apiKeysTool: Tool = {
  name: 'snackbase_api_keys',
  description: 'Manage SnackBase API keys. Create, list, and revoke API keys for programmatic access.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'create', 'revoke'],
        description: 'The action to perform on API keys.',
      },
      key_id: {
        type: 'string',
        description: 'The unique ID of the API key (required for revoke).',
      },
      name: {
        type: 'string',
        description: 'A descriptive name for the API key (required for create).',
      },
      expires_at: {
        type: 'string',
        format: 'date-time',
        description: 'Optional ISO date-time string when the key should expire (for create).',
      },
    },
    required: ['action'],
  },
};

export async function handleApiKeysTool(args: any) {
  const client = createClient();
  const { action, key_id, name, expires_at } = args;

  try {
    switch (action) {
      case 'list':
        const keys = await client.apiKeys.list();
        return {
          content: [{ type: 'text', text: JSON.stringify(keys, null, 2) }],
        };

      case 'create':
        if (!name) throw new Error('name is required for create action');
        const newKey = await client.apiKeys.create({
          name,
          expires_at,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(newKey, null, 2) }],
        };

      case 'revoke':
        if (!key_id) throw new Error('key_id is required for revoke action');
        const revokeResult = await client.apiKeys.revoke(key_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(revokeResult, null, 2) }],
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
