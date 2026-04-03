import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const webhooksTool: Tool = {
  name: 'snackbase_webhooks',
  description: 'Manage SnackBase webhooks. Create, update, delete, list, test webhooks, and view delivery history.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'get', 'create', 'update', 'delete', 'test', 'list_deliveries'],
        description: 'The action to perform on webhooks.',
      },
      webhook_id: {
        type: 'string',
        description: 'The ID of the webhook (required for get, update, delete, test, list_deliveries).',
      },
      name: {
        type: 'string',
        description: 'A display name for the webhook (required for create).',
      },
      url: {
        type: 'string',
        description: 'The URL to deliver webhook events to (required for create).',
      },
      events: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of event types to subscribe to (required for create).',
      },
      enabled: {
        type: 'boolean',
        description: 'Whether the webhook is active.',
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

export async function handleWebhooksTool(args: any) {
  const client = createClient();
  const { action, webhook_id, name, url, events, enabled, page, page_size } = args;

  try {
    switch (action) {
      case 'list':
        const webhooks = await client.webhooks.list({ page, page_size });
        return {
          content: [{ type: 'text', text: JSON.stringify(webhooks, null, 2) }],
        };

      case 'get':
        if (!webhook_id) throw new Error('webhook_id is required for get action');
        const webhook = await client.webhooks.get(webhook_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(webhook, null, 2) }],
        };

      case 'create':
        if (!name || !url || !events) throw new Error('name, url, and events are required for create action');
        const newWebhook = await client.webhooks.create({ name, url, events, enabled });
        return {
          content: [{ type: 'text', text: JSON.stringify(newWebhook, null, 2) }],
        };

      case 'update':
        if (!webhook_id) throw new Error('webhook_id is required for update action');
        const updatedWebhook = await client.webhooks.update(webhook_id, { url, events, enabled });
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedWebhook, null, 2) }],
        };

      case 'delete':
        if (!webhook_id) throw new Error('webhook_id is required for delete action');
        const deleteResult = await client.webhooks.delete(webhook_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(deleteResult, null, 2) }],
        };

      case 'test':
        if (!webhook_id) throw new Error('webhook_id is required for test action');
        const testResult = await client.webhooks.test(webhook_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(testResult, null, 2) }],
        };

      case 'list_deliveries':
        if (!webhook_id) throw new Error('webhook_id is required for list_deliveries action');
        const deliveries = await client.webhooks.listDeliveries(webhook_id, { page, page_size });
        return {
          content: [{ type: 'text', text: JSON.stringify(deliveries, null, 2) }],
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
