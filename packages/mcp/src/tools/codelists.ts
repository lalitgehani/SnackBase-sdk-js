import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const codelistsTool: Tool = {
  name: 'snackbase_codelists',
  description:
    'Manage SnackBase first-class codelists (shared reference dictionaries). ' +
    'Effective values power pickers for operator-created catalogs. ' +
    'Superadmin set_override/clear_override require tenant account_id (not the system account).',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: [
          'list',
          'get',
          'get_values',
          'create',
          'update',
          'delete',
          'create_value',
          'set_override',
          'clear_override',
        ],
        description: 'The action to perform on codelists.',
      },
      code: {
        type: 'string',
        description: 'Codelist code (e.g. regions). Required for get, get_values, mutations.',
      },
      scope: {
        type: 'string',
        enum: ['system', 'account'],
        description: 'Filter for list action.',
      },
      active: {
        type: 'boolean',
        description: 'Filter active-only for list or get_values.',
      },
      lang: {
        type: 'string',
        description: 'BCP-47 language for get_values labels (default en).',
      },
      account_id: {
        type: 'string',
        description:
          'Tenant account UUID. Required for superadmin override actions; optional for get_values preview.',
      },
      name: {
        type: 'string',
        description: 'Display name (create/update).',
      },
      description: {
        type: 'string',
        description: 'Description (create/update).',
      },
      is_extensible: {
        type: 'boolean',
        description: 'Whether accounts may add extension values (create/update).',
      },
      is_active: {
        type: 'boolean',
        description: 'Active flag (create/update).',
      },
      hard: {
        type: 'boolean',
        description: 'Hard-delete when allowed (delete action).',
      },
      value_code: {
        type: 'string',
        description: 'Stable submission code for create_value / override actions.',
      },
      sort_order: {
        type: 'number',
        description: 'Sort order for create_value or override.',
      },
      definition: {
        type: 'string',
        description: 'Value definition (create_value).',
      },
      metadata: {
        type: 'object',
        description: 'JSON metadata for create / create_value.',
      },
      labels: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            language: { type: 'string' },
            label: { type: 'string' },
            description: { type: 'string' },
            is_preferred: { type: 'boolean' },
          },
        },
        description: 'Labels for create_value.',
      },
      visibility: {
        type: 'string',
        enum: ['visible', 'hidden'],
        description: 'Override visibility (set_override).',
      },
      is_default: {
        type: 'boolean',
        description: 'Override default flag (set_override).',
      },
      metadata_override: {
        type: 'object',
        description: 'Override metadata merge (set_override).',
      },
    },
    required: ['action'],
  },
};

export async function handleCodelistsTool(args: any) {
  const client = createClient();
  const {
    action,
    code,
    scope,
    active,
    lang,
    account_id,
    name,
    description,
    is_extensible,
    is_active,
    hard,
    value_code,
    sort_order,
    definition,
    metadata,
    labels,
    visibility,
    is_default,
    metadata_override,
  } = args;

  try {
    switch (action) {
      case 'list': {
        const params: { scope?: string; active?: boolean } = {};
        if (scope !== undefined) params.scope = scope;
        if (active !== undefined) params.active = active;
        const list = await client.codelists.list(
          Object.keys(params).length ? params : undefined,
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(list, null, 2) }],
        };
      }

      case 'get': {
        if (!code) throw new Error('code is required for get action');
        const item = await client.codelists.get(code);
        return {
          content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
        };
      }

      case 'get_values': {
        if (!code) throw new Error('code is required for get_values action');
        const params: {
          lang?: string;
          active?: boolean;
          account_id?: string;
        } = {};
        if (lang !== undefined) params.lang = lang;
        if (active !== undefined) params.active = active;
        if (account_id !== undefined) params.account_id = account_id;
        const values = await client.codelists.getValues(
          code,
          Object.keys(params).length ? params : undefined,
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(values, null, 2) }],
        };
      }

      case 'create': {
        if (!code || !name) {
          throw new Error('code and name are required for create action');
        }
        const created = await client.codelists.create({
          code,
          name,
          description,
          scope: scope || 'account',
          is_extensible,
          is_active,
          metadata,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(created, null, 2) }],
        };
      }

      case 'update': {
        if (!code) throw new Error('code is required for update action');
        const updated = await client.codelists.update(code, {
          name,
          description,
          is_extensible,
          is_active,
          metadata,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }],
        };
      }

      case 'delete': {
        if (!code) throw new Error('code is required for delete action');
        const deleted = await client.codelists.delete(code, Boolean(hard));
        return {
          content: [{ type: 'text', text: JSON.stringify(deleted, null, 2) }],
        };
      }

      case 'create_value': {
        if (!code || !value_code) {
          throw new Error('code and value_code are required for create_value action');
        }
        const value = await client.codelists.createValue(code, {
          code: value_code,
          definition,
          sort_order,
          is_active,
          metadata,
          labels,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
        };
      }

      case 'set_override': {
        if (!code || !value_code) {
          throw new Error('code and value_code are required for set_override action');
        }
        const ov = await client.codelists.setOverride(
          code,
          value_code,
          {
            visibility: visibility || 'visible',
            is_default: Boolean(is_default),
            sort_order,
            metadata_override,
          },
          account_id,
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(ov, null, 2) }],
        };
      }

      case 'clear_override': {
        if (!code || !value_code) {
          throw new Error('code and value_code are required for clear_override action');
        }
        await client.codelists.clearOverride(code, value_code, account_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, code, value_code }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
