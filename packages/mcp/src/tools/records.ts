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
        enum: ['list', 'get', 'create', 'update', 'patch', 'delete', 'batchCreate', 'batchUpdate', 'batchDelete', 'aggregate'],
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
        type: 'string',
        description: 'Filter expression for listing or aggregating records.',
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
      cursor: {
        type: 'string',
        description: 'Cursor for forward pagination (from a previous list response).',
      },
      cursor_before: {
        type: 'string',
        description: 'Cursor for backward pagination.',
      },
      records: {
        type: 'array',
        description: 'Array of record data objects (required for batchCreate).',
      },
      items: {
        type: 'array',
        description: 'Array of { id, data } update objects (required for batchUpdate).',
      },
      ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of record IDs to delete (required for batchDelete).',
      },
      functions: {
        type: 'string',
        description: 'Aggregation functions to apply, e.g. "COUNT(*), SUM(price)" (required for aggregate).',
      },
      group_by: {
        type: 'string',
        description: 'Field to group by for aggregate action.',
      },
      having: {
        type: 'string',
        description: 'HAVING clause filter for aggregate action.',
      },
    },
    required: ['action', 'collection'],
  },
};

export async function handleRecordsTool(args: any) {
  const client = createClient();
  const { action, collection, record_id, data, filter, sort, limit, skip, fields, expand, cursor, cursor_before, records, items, ids, functions, group_by, having } = args;

  try {
    switch (action) {
      case 'list':
        const listResult = await client.records.list(collection, {
          filter,
          sort,
          limit,
          skip,
          fields,
          expand,
          cursor,
          cursor_before,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(listResult, null, 2) }],
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

      case 'batchCreate':
        if (!records) throw new Error('records is required for batchCreate action');
        const batchCreateResult = await client.records.batchCreate(collection, records);
        return {
          content: [{ type: 'text', text: JSON.stringify(batchCreateResult, null, 2) }],
        };

      case 'batchUpdate':
        if (!items) throw new Error('items is required for batchUpdate action');
        const batchUpdateResult = await client.records.batchUpdate(collection, items);
        return {
          content: [{ type: 'text', text: JSON.stringify(batchUpdateResult, null, 2) }],
        };

      case 'batchDelete':
        if (!ids) throw new Error('ids is required for batchDelete action');
        const batchDeleteResult = await client.records.batchDelete(collection, ids);
        return {
          content: [{ type: 'text', text: JSON.stringify(batchDeleteResult, null, 2) }],
        };

      case 'aggregate':
        if (!functions) throw new Error('functions is required for aggregate action');
        const aggregateResult = await client.records.aggregate(collection, { functions, group_by, filter, having });
        return {
          content: [{ type: 'text', text: JSON.stringify(aggregateResult, null, 2) }],
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
