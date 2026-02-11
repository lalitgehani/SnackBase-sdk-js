import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const dashboardTool: Tool = {
  name: 'snackbase_dashboard',
  description: 'Get SnackBase dashboard statistics — total accounts, users, collections, records, recent activity, and system health.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_stats'],
        description: 'The dashboard action to perform.',
      },
    },
    required: ['action'],
  },
};

export async function handleDashboardTool(args: any) {
  const client = createClient();
  const { action } = args;

  try {
    switch (action) {
      case 'get_stats':
        const stats = await client.dashboard.getStats();
        return {
          content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
