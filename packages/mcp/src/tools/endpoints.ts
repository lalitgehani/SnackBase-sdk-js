import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const endpointsTool: Tool = {
  name: 'snackbase_endpoints',
  description: 'Manage SnackBase custom HTTP endpoints — serverless functions exposed as REST routes. Create, update, toggle, list endpoints, and view execution history.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'get', 'create', 'update', 'delete', 'toggle', 'list_executions'],
        description: 'The action to perform on endpoints.',
      },
      endpoint_id: {
        type: 'string',
        description: 'The ID of the endpoint (required for get, update, delete, toggle, list_executions).',
      },
      name: {
        type: 'string',
        description: 'The name of the endpoint (required for create).',
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        description: 'HTTP method for the endpoint (required for create).',
      },
      path: {
        type: 'string',
        description: 'URL path for the endpoint, e.g. "/my-endpoint" (required for create).',
      },
      enabled: {
        type: 'boolean',
        description: 'Whether the endpoint is enabled.',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination.',
      },
      page_size: {
        type: 'number',
        description: 'Number of results per page.',
      },
    },
    required: ['action'],
  },
};

export async function handleEndpointsTool(args: any) {
  const client = createClient();
  const { action, endpoint_id, name, method, path, enabled, page, page_size } = args;

  try {
    switch (action) {
      case 'list':
        const endpoints = await client.endpoints.list({ page, page_size });
        return {
          content: [{ type: 'text', text: JSON.stringify(endpoints, null, 2) }],
        };

      case 'get':
        if (!endpoint_id) throw new Error('endpoint_id is required for get action');
        const endpoint = await client.endpoints.get(endpoint_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(endpoint, null, 2) }],
        };

      case 'create':
        if (!name || !method || !path) throw new Error('name, method, and path are required for create action');
        const newEndpoint = await client.endpoints.create({ name, method, path, enabled });
        return {
          content: [{ type: 'text', text: JSON.stringify(newEndpoint, null, 2) }],
        };

      case 'update':
        if (!endpoint_id) throw new Error('endpoint_id is required for update action');
        const updatedEndpoint = await client.endpoints.update(endpoint_id, { name, method, path, enabled });
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedEndpoint, null, 2) }],
        };

      case 'delete':
        if (!endpoint_id) throw new Error('endpoint_id is required for delete action');
        const deleteResult = await client.endpoints.delete(endpoint_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(deleteResult, null, 2) }],
        };

      case 'toggle':
        if (!endpoint_id) throw new Error('endpoint_id is required for toggle action');
        const toggledEndpoint = await client.endpoints.toggle(endpoint_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(toggledEndpoint, null, 2) }],
        };

      case 'list_executions':
        if (!endpoint_id) throw new Error('endpoint_id is required for list_executions action');
        const executions = await client.endpoints.listExecutions(endpoint_id, { page, page_size });
        return {
          content: [{ type: 'text', text: JSON.stringify(executions, null, 2) }],
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
