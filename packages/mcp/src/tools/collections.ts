import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

/**
 * Field types must match SDK FieldType in packages/sdk/src/types/collection.ts.
 * Collection response may include a derived public-access flag; CollectionCreate
 * and CollectionUpdate do not accept that field, so create/update omit it.
 */
export const collectionsTool: Tool = {
  name: 'snackbase_collections',
  description:
    'Manage SnackBase collections (schemas). Create, update, delete, list, export, and import collection definitions. Field types: text|number|boolean|date|datetime|email|url|json|reference|file|computed. Public access is controlled via empty-string list/view rules (CollectionCreate has no public-access flag).',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'list_names', 'get', 'create', 'update', 'delete', 'export', 'import'],
        description: 'The action to perform on collections.',
      },
      collection_id: {
        type: 'string',
        description: 'The unique ID of the collection (required for get, update, delete).',
      },
      name: {
        type: 'string',
        description: 'The name of the collection (required for create).',
      },
      fields: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: {
              type: 'string',
              enum: [
                'text',
                'number',
                'boolean',
                'date',
                'datetime',
                'email',
                'url',
                'json',
                'reference',
                'file',
                'computed',
              ],
              description: 'SDK FieldType (must match backend collection_validator.FieldType).',
            },
            required: { type: 'boolean' },
            default: { description: 'The default value for the field.' },
            unique: { type: 'boolean' },
            options: {
              description: 'Additional field options (array or object).',
            },
            collection: {
              type: 'string',
              description: 'Target collection name (required for reference type).',
            },
            on_delete: {
              type: 'string',
              enum: ['cascade', 'set_null', 'restrict'],
              description: 'On-delete action for reference fields.',
            },
            pii: { type: 'boolean', description: 'Whether this field contains PII.' },
            mask_type: {
              type: 'string',
              enum: ['email', 'ssn', 'phone', 'name', 'full', 'custom'],
              description: 'Mask type when pii=true.',
            },
            expression: {
              type: 'string',
              description: 'SQL expression for computed (virtual) fields.',
            },
            return_type: {
              type: 'string',
              enum: ['text', 'number', 'boolean', 'datetime'],
              description: 'Return type for computed field expressions.',
            },
          },
          required: ['name', 'type'],
        },
        description: 'Field definitions for the collection (required for create).',
      },
      list_rule: { type: ['string', 'null'] },
      view_rule: { type: ['string', 'null'] },
      create_rule: { type: ['string', 'null'] },
      update_rule: { type: ['string', 'null'] },
      delete_rule: { type: ['string', 'null'] },
      collection_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of collection IDs to export.',
      },
      data: {
        type: 'object',
        description: 'The collection export data to import.',
      },
      strategy: {
        type: 'string',
        enum: ['error', 'skip', 'update'],
        default: 'error',
        description: 'Conflict resolution strategy for import.',
      },
    },
    required: ['action'],
  },
};

export async function handleCollectionsTool(args: any) {
  const client = createClient();
  const {
    action,
    collection_id,
    name,
    fields,
    list_rule,
    view_rule,
    create_rule,
    update_rule,
    delete_rule,
    collection_ids,
    data,
    strategy,
  } = args;

  try {
    switch (action) {
      case 'list': {
        const collections = await client.collections.list();
        return {
          content: [{ type: 'text', text: JSON.stringify(collections, null, 2) }],
        };
      }

      case 'list_names': {
        const names = await client.collections.listNames();
        return {
          content: [{ type: 'text', text: JSON.stringify(names, null, 2) }],
        };
      }

      case 'get': {
        if (!collection_id) throw new Error('collection_id is required for get action');
        const collection = await client.collections.get(collection_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(collection, null, 2) }],
        };
      }

      case 'create': {
        if (!name || !fields) throw new Error('name and fields are required for create action');
        const newCollection = await client.collections.create({
          name,
          fields,
          list_rule,
          view_rule,
          create_rule,
          update_rule,
          delete_rule,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(newCollection, null, 2) }],
        };
      }

      case 'update': {
        if (!collection_id) throw new Error('collection_id is required for update action');
        const updatedCollection = await client.collections.update(collection_id, {
          name,
          fields,
          list_rule,
          view_rule,
          create_rule,
          update_rule,
          delete_rule,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedCollection, null, 2) }],
        };
      }

      case 'delete': {
        if (!collection_id) throw new Error('collection_id is required for delete action');
        const deleteResult = await client.collections.delete(collection_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(deleteResult, null, 2) }],
        };
      }

      case 'export': {
        const exportData = await client.collections.export({ collection_ids });
        return {
          content: [{ type: 'text', text: JSON.stringify(exportData, null, 2) }],
        };
      }

      case 'import': {
        if (!data) throw new Error('data is required for import action');
        const importResult = await client.collections.import({ data, strategy });
        return {
          content: [{ type: 'text', text: JSON.stringify(importResult, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
