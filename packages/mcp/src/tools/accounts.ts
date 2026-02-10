import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const accountsTool: Tool = {
  name: 'snackbase_accounts',
  description: 'Manage SnackBase accounts (tenants). Create, update, delete accounts and list their users.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'get', 'create', 'update', 'delete', 'get_users'],
        description: 'The action to perform on accounts.',
      },
      account_id: {
        type: 'string',
        description: 'The unique ID of the account (required for get, update, delete, get_users).',
      },
      name: {
        type: 'string',
        description: 'The name of the account (required for create/update).',
      },
      slug: {
        type: 'string',
        description: 'The slug of the account (optional for create).',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination (optional for list, get_users).',
      },
      page_size: {
        type: 'number',
        description: 'Number of items per page (optional for list, get_users).',
      },
      search: {
        type: 'string',
        description: 'Search string (optional for list).',
      },
      is_active: {
        type: 'boolean',
        description: 'Filter by active status (optional for list).',
      },
      sort_by: {
        type: 'string',
        description: 'Field to sort by (optional for list).',
      },
      sort_order: {
        type: 'string',
        enum: ['asc', 'desc'],
        description: 'Sort order (optional for list).',
      },
    },
    required: ['action'],
  },
};

export async function handleAccountsTool(args: any) {
  const client = createClient();
  const {
    action,
    account_id,
    name,
    slug,
    page,
    page_size,
    search,
    is_active,
    sort_by,
    sort_order,
  } = args;

  try {
    switch (action) {
      case 'list':
        const accounts = await client.accounts.list({
          page,
          page_size,
          search,
          is_active,
          sort_by,
          sort_order: sort_order as 'asc' | 'desc',
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(accounts, null, 2) }],
        };

      case 'get':
        if (!account_id) throw new Error('account_id is required for get action');
        const account = await client.accounts.get(account_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(account, null, 2) }],
        };

      case 'create':
        if (!name) throw new Error('name is required for create action');
        const newAccount = await client.accounts.create({
          name,
          slug,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(newAccount, null, 2) }],
        };

      case 'update':
        if (!account_id || !name) throw new Error('account_id and name are required for update action');
        const updatedAccount = await client.accounts.update(account_id, {
          name,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedAccount, null, 2) }],
        };

      case 'delete':
        if (!account_id) throw new Error('account_id is required for delete action');
        const deleteResult = await client.accounts.delete(account_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(deleteResult, null, 2) }],
        };

      case 'get_users':
        if (!account_id) throw new Error('account_id is required for get_users action');
        const users = await client.accounts.getUsers(account_id, {
          page,
          page_size,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(users, null, 2) }],
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
