import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const invitationsTool: Tool = {
  name: 'snackbase_invitations',
  description: 'Manage SnackBase user invitations. Create, list, resend, and cancel invitations for onboarding users to accounts.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'create', 'resend', 'cancel'],
        description: 'The action to perform on invitations.',
      },
      invitation_id: {
        type: 'string',
        description: 'The unique ID of the invitation (required for resend, cancel).',
      },
      email: {
        type: 'string',
        description: 'Email address of the invitee (required for create).',
      },
      role_id: {
        type: 'string',
        description: 'Role ID to assign to the invited user (optional for create).',
      },
      status: {
        type: 'string',
        enum: ['pending', 'accepted', 'expired', 'cancelled'],
        description: 'Filter by invitation status (optional for list).',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination (optional for list).',
      },
      page_size: {
        type: 'number',
        description: 'Number of items per page (optional for list).',
      },
    },
    required: ['action'],
  },
};

export async function handleInvitationsTool(args: any) {
  const client = createClient();
  const {
    action,
    invitation_id,
    email,
    role_id,
    status,
    page,
    page_size,
  } = args;

  try {
    switch (action) {
      case 'list':
        const invitations = await client.invitations.list({
          status: status as any,
          page,
          page_size,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(invitations, null, 2) }],
        };

      case 'create':
        if (!email) throw new Error('email is required for create action');
        const newInvitation = await client.invitations.create({
          email,
          role_id,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(newInvitation, null, 2) }],
        };

      case 'resend':
        if (!invitation_id) throw new Error('invitation_id is required for resend action');
        const resendResult = await client.invitations.resend(invitation_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(resendResult, null, 2) }],
        };

      case 'cancel':
        if (!invitation_id) throw new Error('invitation_id is required for cancel action');
        const cancelResult = await client.invitations.cancel(invitation_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(cancelResult, null, 2) }],
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
