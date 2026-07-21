import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const usersTool: Tool = {
  name: 'snackbase_users',
  description:
    'Manage SnackBase users. List, create, update, delete users, set passwords, verify email, and resend verification. Create requires role_id (number). List uses page/page_size pagination.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: [
          'list',
          'get',
          'create',
          'update',
          'delete',
          'set_password',
          'verify_email',
          'resend_verification',
        ],
        description: 'The action to perform on users.',
      },
      user_id: {
        type: 'string',
        description:
          'The unique ID of the user (required for get, update, delete, set_password, verify_email, resend_verification).',
      },
      email: {
        type: 'string',
        description: 'Email address (required for create).',
      },
      account_id: {
        type: 'string',
        description: 'The account ID the user belongs to (required for create; optional list filter).',
      },
      password: {
        type: 'string',
        description: 'User password (optional for create, required for set_password).',
      },
      role_id: {
        type: 'number',
        description: 'Numeric role ID (required for create; optional list filter as string via role_id_filter).',
      },
      role: {
        type: 'string',
        description: 'User role string (optional for update only).',
      },
      is_active: {
        type: 'boolean',
        description: 'Whether the user is active (optional for list/update).',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination (list; page/page_size style).',
      },
      page_size: {
        type: 'number',
        description: 'Number of items per page (list; page/page_size style).',
      },
      role_id_filter: {
        type: 'string',
        description: 'Filter list by role ID string (optional for list).',
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
    role_id,
    role,
    is_active,
    page,
    page_size,
    role_id_filter,
    search,
    sort_by,
    sort_order,
  } = args;

  try {
    switch (action) {
      case 'list': {
        const users = await client.users.list({
          page,
          page_size,
          account_id,
          role_id: role_id_filter ?? (typeof role_id === 'string' ? role_id : undefined),
          is_active,
          search,
          sort_by,
          sort_order: sort_order as 'asc' | 'desc',
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(users, null, 2) }],
        };
      }

      case 'get': {
        if (!user_id) throw new Error('user_id is required for get action');
        const user = await client.users.get(user_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(user, null, 2) }],
        };
      }

      case 'create': {
        if (!email || !account_id || role_id === undefined || role_id === null) {
          throw new Error('email, account_id, and role_id are required for create action');
        }
        const newUser = await client.users.create({
          email,
          account_id,
          password,
          role_id: Number(role_id),
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(newUser, null, 2) }],
        };
      }

      case 'update': {
        if (!user_id) throw new Error('user_id is required for update action');
        const updatedUser = await client.users.update(user_id, {
          email,
          role,
          is_active,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedUser, null, 2) }],
        };
      }

      case 'delete': {
        if (!user_id) throw new Error('user_id is required for delete action');
        const deleteResult = await client.users.delete(user_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(deleteResult, null, 2) }],
        };
      }

      case 'set_password': {
        if (!user_id || !password) {
          throw new Error('user_id and password are required for set_password action');
        }
        const setPasswordResult = await client.users.setPassword(user_id, password);
        return {
          content: [{ type: 'text', text: JSON.stringify(setPasswordResult, null, 2) }],
        };
      }

      case 'verify_email': {
        if (!user_id) throw new Error('user_id is required for verify_email action');
        const verifyEmailResult = await client.users.verifyEmail(user_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(verifyEmailResult, null, 2) }],
        };
      }

      case 'resend_verification': {
        if (!user_id) throw new Error('user_id is required for resend_verification action');
        const resendResult = await client.users.resendVerification(user_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(resendResult, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
