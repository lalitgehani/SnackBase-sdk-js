import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const webhooksTool: Tool = {
  name: 'snackbase_webhooks',
  description:
    'Manage SnackBase outbound webhooks for a collection (account-scoped). Create returns a secret once — store it securely. list returns the full set (no pagination). list_deliveries uses limit/offset.',
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
      url: {
        type: 'string',
        description: 'The URL to deliver webhook events to (required for create).',
      },
      collection: {
        type: 'string',
        description: 'Collection name this webhook watches (required for create).',
      },
      events: {
        type: 'array',
        items: { type: 'string' },
        description: 'Event types to subscribe to, e.g. record.create (required for create).',
      },
      secret: {
        type: 'string',
        description: 'Optional webhook signing secret (create/update).',
      },
      filter: {
        type: 'string',
        description: 'Optional filter expression for events (create/update).',
      },
      headers: {
        type: 'object',
        description: 'Optional custom headers map (create/update).',
      },
      enabled: {
        type: 'boolean',
        description: 'Whether the webhook is active.',
      },
      limit: {
        type: 'number',
        description: 'Max deliveries to return (list_deliveries; limit/offset pagination).',
      },
      offset: {
        type: 'number',
        description: 'Deliveries to skip (list_deliveries; limit/offset pagination).',
      },
    },
    required: ['action'],
  },
};

export async function handleWebhooksTool(args: any) {
  const client = createClient();
  const {
    action,
    webhook_id,
    url,
    collection,
    events,
    secret,
    filter,
    headers,
    enabled,
    limit,
    offset,
  } = args;

  try {
    switch (action) {
      case 'list': {
        const webhooks = await client.webhooks.list();
        return {
          content: [{ type: 'text', text: JSON.stringify(webhooks, null, 2) }],
        };
      }

      case 'get': {
        if (!webhook_id) throw new Error('webhook_id is required for get action');
        const webhook = await client.webhooks.get(webhook_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(webhook, null, 2) }],
        };
      }

      case 'create': {
        if (!url || !collection || !events) {
          throw new Error('url, collection, and events are required for create action');
        }
        const newWebhook = await client.webhooks.create({
          url,
          collection,
          events,
          secret,
          filter,
          headers,
          enabled,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(newWebhook, null, 2) }],
        };
      }

      case 'update': {
        if (!webhook_id) throw new Error('webhook_id is required for update action');
        const updatedWebhook = await client.webhooks.update(webhook_id, {
          url,
          collection,
          events,
          secret,
          filter,
          headers,
          enabled,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedWebhook, null, 2) }],
        };
      }

      case 'delete': {
        if (!webhook_id) throw new Error('webhook_id is required for delete action');
        const deleteResult = await client.webhooks.delete(webhook_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(deleteResult, null, 2) }],
        };
      }

      case 'test': {
        if (!webhook_id) throw new Error('webhook_id is required for test action');
        const testResult = await client.webhooks.test(webhook_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(testResult, null, 2) }],
        };
      }

      case 'list_deliveries': {
        if (!webhook_id) throw new Error('webhook_id is required for list_deliveries action');
        const deliveries = await client.webhooks.listDeliveries(webhook_id, { limit, offset });
        return {
          content: [{ type: 'text', text: JSON.stringify(deliveries, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
