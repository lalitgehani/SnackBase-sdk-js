import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const auditLogsTool: Tool = {
  name: 'snackbase_audit_logs',
  description: 'Query SnackBase audit logs for compliance and investigation. List, view details, and export audit trail data.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'get', 'export'],
        description: 'The audit log action to perform.',
      },
      account_id: {
        type: 'string',
        description: 'Filter by account ID.',
      },
      table_name: {
        type: 'string',
        description: 'Filter by table name.',
      },
      record_id: {
        type: 'string',
        description: 'Filter by record ID.',
      },
      user_id: {
        type: 'string',
        description: 'Filter by user ID.',
      },
      operation: {
        type: 'string',
        description: 'Filter by operation type (e.g., create, update, delete).',
      },
      from_date: {
        type: 'string',
        description: 'Filter by start date (ISO 8601).',
      },
      to_date: {
        type: 'string',
        description: 'Filter by end date (ISO 8601).',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination.',
      },
      skip: {
        type: 'number',
        description: 'Number of items to skip.',
      },
      limit: {
        type: 'number',
        description: 'Number of items to return.',
      },
      sort: {
        type: 'string',
        description: 'Sorting criteria.',
      },
      log_id: {
        type: 'string',
        description: 'Audit log entry ID (required for get action).',
      },
      format: {
        type: 'string',
        enum: ['json', 'csv', 'pdf'],
        description: 'Export format (defaults to json).',
      }
    },
    required: ['action'],
  },
};

export async function handleAuditLogsTool(args: any) {
  const client = createClient();
  const { 
    action, 
    log_id, 
    format,
    ...filters 
  } = args;

  try {
    switch (action) {
      case 'list':
        const listResult = await client.auditLogs.list(filters);
        return {
          content: [{ type: 'text', text: JSON.stringify(listResult, null, 2) }],
        };

      case 'get':
        if (!log_id) {
          throw new Error('log_id is required for get action');
        }
        const getResult = await client.auditLogs.get(log_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(getResult, null, 2) }],
        };

      case 'export':
        const exportResult = await client.auditLogs.export(filters, format);
        return {
          content: [{ type: 'text', text: exportResult }],
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
