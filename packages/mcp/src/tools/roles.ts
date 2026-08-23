import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const rolesTool: Tool = {
  name: 'snackbase_roles',
  description:
    'Manage SnackBase roles for role-based access control. List, create, update, and delete roles, ' +
    'inspect and bulk-edit their permissions, and validate or test permission rule expressions.',
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
          'get_permissions',
          'get_permissions_matrix',
          'validate_rule',
          'test_rule',
          'update_permissions_bulk',
          'delete_permission',
        ],
        description: 'The action to perform on roles.',
      },
      role_id: {
        type: 'string',
        description:
          'The unique ID of the role (required for get, update, delete, get_permissions, ' +
          'get_permissions_matrix, update_permissions_bulk).',
      },
      name: {
        type: 'string',
        description: 'The name of the role (required for create).',
      },
      description: {
        type: 'string',
        description: 'A description of the role (optional for create/update).',
      },
      rule: {
        type: 'string',
        description:
          'Permission rule expression in the SnackBase rule DSL, e.g. `@has_role("admin") and @owns_record()` ' +
          '(required for validate_rule and test_rule).',
      },
      context: {
        type: 'object',
        description:
          'Sample evaluation context for test_rule, e.g. { "user": { "id": "..." }, "record": { ... } }.',
      },
      updates: {
        type: 'array',
        items: { type: 'object' },
        description: 'Permission update objects applied together (required for update_permissions_bulk).',
      },
      permission_id: {
        type: 'number',
        description: 'Numeric permission ID (required for delete_permission).',
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
    description,
    rule,
    context,
    updates,
    permission_id,
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

      case 'get_permissions': {
        if (!role_id) throw new Error('role_id is required for get_permissions action');
        const permissions = await client.roles.getPermissions(role_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(permissions, null, 2) }],
        };
      }

      case 'get_permissions_matrix': {
        if (!role_id) throw new Error('role_id is required for get_permissions_matrix action');
        const matrix = await client.roles.getPermissionsMatrix(role_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(matrix, null, 2) }],
        };
      }

      case 'validate_rule': {
        if (!rule) throw new Error('rule is required for validate_rule action');
        const validation = await client.roles.validateRule(rule);
        return {
          content: [{ type: 'text', text: JSON.stringify(validation, null, 2) }],
        };
      }

      case 'test_rule': {
        if (!rule) throw new Error('rule is required for test_rule action');
        const result = await client.roles.testRule(rule, context ?? {});
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'update_permissions_bulk': {
        if (!role_id) throw new Error('role_id is required for update_permissions_bulk action');
        if (!Array.isArray(updates)) {
          throw new Error('updates must be an array for update_permissions_bulk action');
        }
        const bulkResult = await client.roles.updatePermissionsBulk(role_id, { updates });
        return {
          content: [{ type: 'text', text: JSON.stringify(bulkResult, null, 2) }],
        };
      }

      case 'delete_permission': {
        if (permission_id === undefined || permission_id === null) {
          throw new Error('permission_id is required for delete_permission action');
        }
        const permissionResult = await client.roles.deletePermission(permission_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(permissionResult, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
