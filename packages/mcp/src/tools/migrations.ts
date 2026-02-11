import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const migrationsTool: Tool = {
  name: 'snackbase_migrations',
  description: 'Query SnackBase migration status. View all revisions, current database revision, and migration history. Read-only — use CLI for applying migrations.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'get_current', 'get_history'],
        description: 'The action to perform on migrations.',
      },
    },
    required: ['action'],
  },
};

export async function handleMigrationsTool(args: any) {
  const client = createClient();
  const { action } = args;

  try {
    switch (action) {
      case 'list':
        const revisions = await client.migrations.list();
        return {
          content: [{ type: 'text', text: JSON.stringify(revisions, null, 2) }],
        };

      case 'get_current':
        const current = await client.migrations.getCurrent();
        return {
          content: [{ type: 'text', text: JSON.stringify(current, null, 2) }],
        };

      case 'get_history':
        const history = await client.migrations.getHistory();
        return {
          content: [{ type: 'text', text: JSON.stringify(history, null, 2) }],
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
