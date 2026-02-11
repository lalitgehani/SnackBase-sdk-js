import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const emailTemplatesTool: Tool = {
  name: 'snackbase_email_templates',
  description: 'Manage SnackBase email templates. View, update, render previews, send test emails, and view email send logs.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'get', 'update', 'render', 'send_test', 'list_logs'],
        description: 'The action to perform on email templates.',
      },
      template_id: {
        type: 'string',
        description: 'The unique ID of the template (required for get, update, send_test).',
      },
      // List filters
      filters: {
        type: 'object',
        properties: {
            template_type: { type: 'string' },
            locale: { type: 'string' },
            account_id: { type: 'string' },
            enabled: { type: 'boolean' },
            status: { type: 'string' }, // for logs
            start_date: { type: 'string' }, // for logs
            end_date: { type: 'string' }, // for logs
            page: { type: 'number' },
            limit: { type: 'number' },
        },
        description: 'Filters for list and list_logs actions.',
      },
      // Update fields
      subject: { type: 'string', description: 'Subject line for update action.' },
      html_body: { type: 'string', description: 'HTML body content for update action.' },
      text_body: { type: 'string', description: 'Text body content for update action.' },
      enabled: { type: 'boolean', description: 'Enable/disable status for update action.' },
      // Render fields
      template_type: { type: 'string', description: 'Template type for render action.' },
      locale: { type: 'string', description: 'Locale for render action.' },
      variables: { 
        type: 'object', 
        description: 'Variables for render and send_test actions.' 
      },
      subject_override: { type: 'string', description: 'Subject override for render action.' },
      html_body_override: { type: 'string', description: 'HTML body override for render action.' },
      text_body_override: { type: 'string', description: 'Text body override for render action.' },
      // Send test fields
      recipient_email: { type: 'string', description: 'Recipient email for send_test action.' },
      provider: { type: 'string', description: 'Provider override for send_test action.' },
    },
    required: ['action'],
  },
};

export async function handleEmailTemplatesTool(args: any) {
  const client = createClient();
  const { 
    action, 
    template_id, 
    filters,
    subject, 
    html_body, 
    text_body, 
    enabled,
    template_type,
    locale,
    variables,
    subject_override,
    html_body_override,
    text_body_override,
    recipient_email,
    provider
  } = args;

  try {
    switch (action) {
      case 'list':
        const templates = await client.emailTemplates.list(filters);
        return {
          content: [{ type: 'text', text: JSON.stringify(templates, null, 2) }],
        };

      case 'get':
        if (!template_id) throw new Error('template_id is required for get action');
        const template = await client.emailTemplates.get(template_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(template, null, 2) }],
        };

      case 'update':
        if (!template_id) throw new Error('template_id is required for update action');
        const updatedTemplate = await client.emailTemplates.update(template_id, {
          subject,
          html_body,
          text_body,
          enabled
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedTemplate, null, 2) }],
        };

      case 'render':
        if (!template_type || !locale || !variables) {
            throw new Error('template_type, locale, and variables are required for render action');
        }
        const renderResult = await client.emailTemplates.render({
            template_type,
            locale,
            variables,
            subject_override,
            html_body_override,
            text_body_override
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(renderResult, null, 2) }],
        };

      case 'send_test':
        if (!template_id || !recipient_email) {
            throw new Error('template_id and recipient_email are required for send_test action');
        }
        const sendResult = await client.emailTemplates.sendTest(
            template_id, 
            recipient_email, 
            variables, 
            provider
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(sendResult, null, 2) }],
        };

      case 'list_logs':
        const logs = await client.emailTemplates.listLogs(filters);
        return {
          content: [{ type: 'text', text: JSON.stringify(logs, null, 2) }],
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
