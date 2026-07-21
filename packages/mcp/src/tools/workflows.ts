import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const workflowsTool: Tool = {
  name: 'snackbase_workflows',
  description:
    'Manage SnackBase workflows — multi-step automation pipelines. Create, toggle, trigger, and monitor workflow instances. Instance IDs are global (/api/v1/workflow-instances/...). Pagination uses limit/offset.',
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
          'toggle',
          'trigger',
          'list_instances',
          'get_instance',
          'cancel_instance',
          'retry_instance',
          'resume_instance',
        ],
        description: 'The action to perform on workflows.',
      },
      workflow_id: {
        type: 'string',
        description:
          'The ID of the workflow (required for get, update, delete, toggle, trigger, list_instances).',
      },
      instance_id: {
        type: 'string',
        description:
          'Global workflow instance ID (required for get_instance, cancel_instance, retry_instance, resume_instance). No workflow_id needed for these actions.',
      },
      name: {
        type: 'string',
        description: 'The name of the workflow (required for create).',
      },
      trigger: {
        type: 'object',
        description: 'Trigger configuration for the workflow (required for create). Contains type and type-specific config.',
      },
      steps: {
        type: 'array',
        description: 'Array of workflow step objects.',
      },
      enabled: {
        type: 'boolean',
        description: 'Whether the workflow is enabled (list filter or create/update body).',
      },
      input: {
        type: 'object',
        description: 'Input data to pass when triggering a workflow.',
      },
      trigger_type: {
        type: 'string',
        description: 'Filter workflows by trigger type (optional for list).',
      },
      status: {
        type: 'string',
        description: 'Filter instances by status (optional for list_instances).',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (limit/offset pagination).',
      },
      offset: {
        type: 'number',
        description: 'Number of results to skip (limit/offset pagination).',
      },
    },
    required: ['action'],
  },
};

export async function handleWorkflowsTool(args: any) {
  const client = createClient();
  const {
    action,
    workflow_id,
    instance_id,
    name,
    trigger,
    steps,
    enabled,
    input,
    trigger_type,
    status,
    limit,
    offset,
  } = args;

  try {
    switch (action) {
      case 'list': {
        const workflows = await client.workflows.list({
          limit,
          offset,
          trigger_type,
          enabled,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(workflows, null, 2) }],
        };
      }

      case 'get': {
        if (!workflow_id) throw new Error('workflow_id is required for get action');
        const workflow = await client.workflows.get(workflow_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(workflow, null, 2) }],
        };
      }

      case 'create': {
        if (!name || !trigger) throw new Error('name and trigger are required for create action');
        const newWorkflow = await client.workflows.create({ name, trigger, steps, enabled });
        return {
          content: [{ type: 'text', text: JSON.stringify(newWorkflow, null, 2) }],
        };
      }

      case 'update': {
        if (!workflow_id) throw new Error('workflow_id is required for update action');
        const updatedWorkflow = await client.workflows.update(workflow_id, {
          name,
          trigger,
          steps,
          enabled,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedWorkflow, null, 2) }],
        };
      }

      case 'delete': {
        if (!workflow_id) throw new Error('workflow_id is required for delete action');
        const deleteResult = await client.workflows.delete(workflow_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(deleteResult, null, 2) }],
        };
      }

      case 'toggle': {
        if (!workflow_id) throw new Error('workflow_id is required for toggle action');
        const toggled = await client.workflows.toggle(workflow_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(toggled, null, 2) }],
        };
      }

      case 'trigger': {
        if (!workflow_id) throw new Error('workflow_id is required for trigger action');
        const instance = await client.workflows.trigger(workflow_id, input);
        return {
          content: [{ type: 'text', text: JSON.stringify(instance, null, 2) }],
        };
      }

      case 'list_instances': {
        if (!workflow_id) throw new Error('workflow_id is required for list_instances action');
        const instances = await client.workflows.listInstances(workflow_id, {
          limit,
          offset,
          status,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(instances, null, 2) }],
        };
      }

      case 'get_instance': {
        if (!instance_id) throw new Error('instance_id is required for get_instance action');
        const workflowInstance = await client.workflows.getInstance(instance_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(workflowInstance, null, 2) }],
        };
      }

      case 'cancel_instance': {
        if (!instance_id) throw new Error('instance_id is required for cancel_instance action');
        const cancelledInstance = await client.workflows.cancelInstance(instance_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(cancelledInstance, null, 2) }],
        };
      }

      case 'retry_instance': {
        if (!instance_id) throw new Error('instance_id is required for retry_instance action');
        const retriedInstance = await client.workflows.retryInstance(instance_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(retriedInstance, null, 2) }],
        };
      }

      case 'resume_instance': {
        if (!instance_id) throw new Error('instance_id is required for resume_instance action');
        const resumedInstance = await client.workflows.resumeInstance(instance_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(resumedInstance, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
