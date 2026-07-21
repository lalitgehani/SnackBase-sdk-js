import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const jobsTool: Tool = {
  name: 'snackbase_jobs',
  description:
    'Manage SnackBase background job queue (superadmin-only). List jobs, get queue statistics, retry failed jobs, and cancel pending jobs. Pagination uses limit/offset.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'stats', 'retry', 'cancel'],
        description: 'The action to perform on jobs.',
      },
      job_id: {
        type: 'string',
        description: 'The ID of the job (required for retry, cancel).',
      },
      status: {
        type: 'string',
        enum: ['pending', 'running', 'completed', 'failed', 'retrying', 'dead'],
        description: 'Filter jobs by status (list).',
      },
      queue: {
        type: 'string',
        description: 'Filter by queue name (list).',
      },
      handler: {
        type: 'string',
        description: 'Filter by handler name (list).',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of jobs to return (default/max per backend; limit/offset pagination).',
      },
      offset: {
        type: 'number',
        description: 'Number of jobs to skip (limit/offset pagination).',
      },
    },
    required: ['action'],
  },
};

export async function handleJobsTool(args: any) {
  const client = createClient();
  const { action, job_id, status, queue, handler, limit, offset } = args;

  try {
    switch (action) {
      case 'list': {
        const jobs = await client.jobs.list({ status, queue, handler, limit, offset });
        return {
          content: [{ type: 'text', text: JSON.stringify(jobs, null, 2) }],
        };
      }

      case 'stats': {
        const stats = await client.jobs.stats();
        return {
          content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
        };
      }

      case 'retry': {
        if (!job_id) throw new Error('job_id is required for retry action');
        const retriedJob = await client.jobs.retry(job_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(retriedJob, null, 2) }],
        };
      }

      case 'cancel': {
        if (!job_id) throw new Error('job_id is required for cancel action');
        await client.jobs.cancel(job_id);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true }, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
