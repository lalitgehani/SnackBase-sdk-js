import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const rolesTool: Tool = {
  name: 'snackbase_roles',
  description: 'Manage SnackBase roles for role-based access control. List, create, update, and delete roles.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'get', 'create', 'update', 'delete'],
        description: 'The action to perform on roles.',
      },
      role_id: {
        type: 'string',
        description: 'The unique ID of the role (required for get, update, delete).',
      },
      name: {
        type: 'string',
        description: 'The name of the role (required for create).',
      },
      description: {
        type: 'string',
        description: 'A description of the role (optional for create/update).',
      },
    },
    required: ['action'],
  },
};

export async function handleRolesTool(args: any) {
  const client = createClient();
  const { 
    action, 
    role_id, 
    name, 
    description 
  } = args;

  try {
    switch (action) {
      case 'list':
        const roles = await client.roles.list();
        return {
          content: [{ type: 'text', text: JSON.stringify(roles, null, 2) }],
        };

      case 'get':
        if (!role_id) throw new Error('role_id is required for get action');
        const role = await client.roles.get(role_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(role, null, 2) }],
        };

      case 'create':
        if (!name) throw new Error('name is required for create action');
        const newRole = await client.roles.create({
          name,
          description,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(newRole, null, 2) }],
        };

      case 'update':
        if (!role_id) throw new Error('role_id is required for update action');
        const updatedRole = await client.roles.update(role_id, {
          name,
          description,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedRole, null, 2) }],
        };

      case 'delete':
        if (!role_id) throw new Error('role_id is required for delete action');
        const deleteResult = await client.roles.delete(role_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(deleteResult, null, 2) }],
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
