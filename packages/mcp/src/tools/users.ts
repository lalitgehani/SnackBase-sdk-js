import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const usersTool: Tool = {
  name: 'snackbase_users',
  description: 'Manage SnackBase users. List, create, update, delete users, set passwords, and verify email addresses.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'get', 'create', 'update', 'delete', 'set_password', 'verify_email'],
        description: 'The action to perform on users.',
      },
      user_id: {
        type: 'string',
        description: 'The unique ID of the user (required for get, update, delete, set_password, verify_email).',
      },
      email: {
        type: 'string',
        description: 'Email address (required for create).',
      },
      account_id: {
        type: 'string',
        description: 'The account ID the user belongs to (required for create).',
      },
      password: {
        type: 'string',
        description: 'User password (optional for create, required for set_password).',
      },
      role: {
        type: 'string',
        description: 'User role (optional for create/update).',
      },
      is_active: {
        type: 'boolean',
        description: 'Whether the user is active (optional for update).',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination (optional for list).',
      },
      page_size: {
        type: 'number',
        description: 'Number of items per page (optional for list).',
      },
      role_id: {
        type: 'string',
        description: 'Filter by role ID (optional for list).',
      },
      search: {
        type: 'string',
        description: 'Search string (optional for list).',
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

export async function handleUsersTool(args: any) {
  const client = createClient();
  const { 
    action, 
    user_id, 
    email, 
    account_id, 
    password, 
    role, 
    is_active, 
    page, 
    page_size, 
    role_id, 
    search, 
    sort_by, 
    sort_order 
  } = args;

  try {
    switch (action) {
      case 'list':
        const users = await client.users.list({
          page,
          page_size,
          account_id,
          role_id,
          is_active,
          search,
          sort_by,
          sort_order: sort_order as 'asc' | 'desc',
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(users, null, 2) }],
        };

      case 'get':
        if (!user_id) throw new Error('user_id is required for get action');
        const user = await client.users.get(user_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(user, null, 2) }],
        };

      case 'create':
        if (!email || !account_id) throw new Error('email and account_id are required for create action');
        const newUser = await client.users.create({
          email,
          account_id,
          password,
          role,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(newUser, null, 2) }],
        };

      case 'update':
        if (!user_id) throw new Error('user_id is required for update action');
        const updatedUser = await client.users.update(user_id, {
          email,
          role,
          is_active,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedUser, null, 2) }],
        };

      case 'delete':
        if (!user_id) throw new Error('user_id is required for delete action');
        const deleteResult = await client.users.delete(user_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(deleteResult, null, 2) }],
        };

      case 'set_password':
        if (!user_id || !password) throw new Error('user_id and password are required for set_password action');
        const setPasswordResult = await client.users.setPassword(user_id, password);
        return {
          content: [{ type: 'text', text: JSON.stringify(setPasswordResult, null, 2) }],
        };

      case 'verify_email':
        if (!user_id) throw new Error('user_id is required for verify_email action');
        const verifyEmailResult = await client.users.verifyEmail(user_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(verifyEmailResult, null, 2) }],
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
