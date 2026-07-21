import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const dashboardTool: Tool = {
  name: 'snackbase_dashboard',
  description:
    'Get SnackBase dashboard statistics — total accounts, users, collections (including public_collections_count), records, recent activity, and system health. Optional range: 7d | 30d | 90d.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_stats'],
        description: 'The dashboard action to perform.',
      },
      range: {
        type: 'string',
        enum: ['7d', '30d', '90d'],
        description: 'Time range for growth metrics and time series (default 7d).',
      },
    },
    required: ['action'],
  },
};

export async function handleDashboardTool(args: any) {
  const client = createClient();
  const { action, range } = args;

  try {
    switch (action) {
      case 'get_stats': {
        const stats = await client.dashboard.getStats(range ? { range } : undefined);
        return {
          content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
