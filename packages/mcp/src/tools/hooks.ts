import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const hooksTool: Tool = {
  name: 'snackbase_hooks',
  description: 'Manage SnackBase hooks — event-driven or scheduled server-side automation. Create, update, toggle, trigger hooks, and view execution history.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'get', 'create', 'update', 'delete', 'toggle', 'trigger', 'list_executions'],
        description: 'The action to perform on hooks.',
      },
      hook_id: {
        type: 'string',
        description: 'The ID of the hook (required for get, update, delete, toggle, trigger, list_executions).',
      },
      name: {
        type: 'string',
        description: 'The name of the hook (required for create).',
      },
      description: {
        type: 'string',
        description: 'A description of what the hook does.',
      },
      trigger: {
        type: 'object',
        description: 'Trigger configuration for the hook (required for create). Contains type and type-specific config.',
      },
      condition: {
        type: 'string',
        description: 'Optional condition expression that must be true for the hook to run.',
      },
      actions: {
        type: 'array',
        description: 'List of action objects to execute when the hook fires.',
      },
      enabled: {
        type: 'boolean',
        description: 'Whether the hook is enabled.',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return.',
      },
      skip: {
        type: 'number',
        description: 'Number of results to skip.',
      },
    },
    required: ['action'],
  },
};

export async function handleHooksTool(args: any) {
  const client = createClient();
  const { action, hook_id, name, description, trigger, condition, actions, enabled, limit, skip } = args;

  try {
    switch (action) {
      case 'list':
        const hooks = await client.hooks.list({ limit, offset: skip });
        return {
          content: [{ type: 'text', text: JSON.stringify(hooks, null, 2) }],
        };

      case 'get':
        if (!hook_id) throw new Error('hook_id is required for get action');
        const hook = await client.hooks.get(hook_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(hook, null, 2) }],
        };

      case 'create':
        if (!name || !trigger) throw new Error('name and trigger are required for create action');
        const newHook = await client.hooks.create({ name, description, trigger, condition, actions, enabled });
        return {
          content: [{ type: 'text', text: JSON.stringify(newHook, null, 2) }],
        };

      case 'update':
        if (!hook_id) throw new Error('hook_id is required for update action');
        const updatedHook = await client.hooks.update(hook_id, { name, description, trigger, condition, actions, enabled });
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedHook, null, 2) }],
        };

      case 'delete':
        if (!hook_id) throw new Error('hook_id is required for delete action');
        const deleteResult = await client.hooks.delete(hook_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(deleteResult, null, 2) }],
        };

      case 'toggle':
        if (!hook_id) throw new Error('hook_id is required for toggle action');
        const toggledHook = await client.hooks.toggle(hook_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(toggledHook, null, 2) }],
        };

      case 'trigger':
        if (!hook_id) throw new Error('hook_id is required for trigger action');
        const triggerResult = await client.hooks.trigger(hook_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(triggerResult, null, 2) }],
        };

      case 'list_executions':
        if (!hook_id) throw new Error('hook_id is required for list_executions action');
        const executions = await client.hooks.listExecutions(hook_id, { limit, offset: skip });
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
