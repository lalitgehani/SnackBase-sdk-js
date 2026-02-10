import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const groupsTool: Tool = {
  name: 'snackbase_groups',
  description: 'Manage SnackBase groups and memberships. Create groups, add/remove members, and manage team-based access control.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'get', 'create', 'update', 'delete', 'add_member', 'remove_member'],
        description: 'The action to perform on groups.',
      },
      group_id: {
        type: 'string',
        description: 'The unique ID of the group (required for get, update, delete, add_member, remove_member).',
      },
      name: {
        type: 'string',
        description: 'The name of the group (required for create).',
      },
      description: {
        type: 'string',
        description: 'A description of the group (optional for create/update).',
      },
      user_id: {
        type: 'string',
        description: 'The unique ID of the user (required for add_member, remove_member).',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination (optional for list).',
      },
      page_size: {
        type: 'number',
        description: 'Number of items per page (optional for list).',
      },
      search: {
        type: 'string',
        description: 'Search string (optional for list).',
      },
    },
    required: ['action'],
  },
};

export async function handleGroupsTool(args: any) {
  const client = createClient();
  const { 
    action, 
    group_id, 
    name, 
    description, 
    user_id, 
    page, 
    page_size, 
    search 
  } = args;

  try {
    switch (action) {
      case 'list':
        const groups = await client.groups.list({
          page,
          page_size,
          search,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(groups, null, 2) }],
        };

      case 'get':
        if (!group_id) throw new Error('group_id is required for get action');
        const group = await client.groups.get(group_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(group, null, 2) }],
        };

      case 'create':
        if (!name) throw new Error('name is required for create action');
        const newGroup = await client.groups.create({
          name,
          description,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(newGroup, null, 2) }],
        };

      case 'update':
        if (!group_id) throw new Error('group_id is required for update action');
        const updatedGroup = await client.groups.update(group_id, {
          name,
          description,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedGroup, null, 2) }],
        };

      case 'delete':
        if (!group_id) throw new Error('group_id is required for delete action');
        const deleteResult = await client.groups.delete(group_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(deleteResult, null, 2) }],
        };

      case 'add_member':
        if (!group_id || !user_id) throw new Error('group_id and user_id are required for add_member action');
        const addMemberResult = await client.groups.addMember(group_id, user_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(addMemberResult, null, 2) }],
        };

      case 'remove_member':
        if (!group_id || !user_id) throw new Error('group_id and user_id are required for remove_member action');
        const removeMemberResult = await client.groups.removeMember(group_id, user_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(removeMemberResult, null, 2) }],
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
