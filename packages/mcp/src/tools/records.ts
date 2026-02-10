import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

export const recordsTool: Tool = {
  name: 'snackbase_records',
  description: 'CRUD operations on SnackBase collection records. List, get, create, update (full/partial), and delete records in any collection.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'get', 'create', 'update', 'patch', 'delete'],
        description: 'The action to perform on records.',
      },
      collection: {
        type: 'string',
        description: 'The name of the collection.',
      },
      record_id: {
        type: 'string',
        description: 'The ID of the record (required for get, update, patch, delete).',
      },
      data: {
        type: 'object',
        description: 'The record data (required for create, update, patch).',
      },
      filter: {
        type: ['object', 'string'],
        description: 'Filter expression or object for listing records.',
      },
      sort: {
        type: 'string',
        description: 'Sort expression (e.g., "-created_at").',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of records to return (default 30, max 100).',
      },
      skip: {
        type: 'number',
        description: 'Number of records to skip.',
      },
      fields: {
        type: ['string', 'array'],
        items: { type: 'string' },
        description: 'Fields to include in the response.',
      },
      expand: {
        type: ['string', 'array'],
        items: { type: 'string' },
        description: 'Related collections to expand.',
      },
    },
    required: ['action', 'collection'],
  },
};

export async function handleRecordsTool(args: any) {
  const client = createClient();
  const { action, collection, record_id, data, filter, sort, limit, skip, fields, expand } = args;

  try {
    switch (action) {
      case 'list':
        const records = await client.records.list(collection, {
          filter,
          sort,
          limit,
          skip,
          fields,
          expand,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(records, null, 2) }],
        };

      case 'get':
        if (!record_id) throw new Error('record_id is required for get action');
        const record = await client.records.get(collection, record_id, {
          fields,
          expand,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(record, null, 2) }],
        };

      case 'create':
        if (!data) throw new Error('data is required for create action');
        const newRecord = await client.records.create(collection, data);
        return {
          content: [{ type: 'text', text: JSON.stringify(newRecord, null, 2) }],
        };

      case 'update':
        if (!record_id || !data) throw new Error('record_id and data are required for update action');
        const updatedRecord = await client.records.update(collection, record_id, data);
        return {
          content: [{ type: 'text', text: JSON.stringify(updatedRecord, null, 2) }],
        };

      case 'patch':
        if (!record_id || !data) throw new Error('record_id and data are required for patch action');
        const patchedRecord = await client.records.patch(collection, record_id, data);
        return {
          content: [{ type: 'text', text: JSON.stringify(patchedRecord, null, 2) }],
        };

      case 'delete':
        if (!record_id) throw new Error('record_id is required for delete action');
        const deleteResult = await client.records.delete(collection, record_id);
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
