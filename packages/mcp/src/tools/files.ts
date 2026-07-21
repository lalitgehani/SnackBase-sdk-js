import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '../client.js';
import { handleToolError } from '../utils/errors.js';

/**
 * Files MCP tool — get_download_url + delete only.
 * Upload is intentional non-exposure: multipart/binary over MCP is not safe without a
 * documented base64/path encoding design; use the SDK or Admin UI for uploads.
 */
export const filesTool: Tool = {
  name: 'snackbase_files',
  description:
    'Manage SnackBase tenant files: build authenticated download URLs and delete by path. Upload is not exposed via MCP (use the JS SDK or Admin UI). Auth uses the API key client. Path format is the server file path (e.g. /account/uuid/filename.ext).',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_download_url', 'delete'],
        description: 'The action to perform on files.',
      },
      path: {
        type: 'string',
        description: 'Server file path (required). Leading slash optional; e.g. /acc/uuid/file.png',
      },
    },
    required: ['action', 'path'],
  },
};

export async function handleFilesTool(args: any) {
  const client = createClient();
  const { action, path } = args;

  try {
    switch (action) {
      case 'get_download_url': {
        if (!path) throw new Error('path is required for get_download_url action');
        const url = client.files.getDownloadUrl(path);
        return {
          content: [{ type: 'text', text: JSON.stringify({ url }, null, 2) }],
        };
      }

      case 'delete': {
        if (!path) throw new Error('path is required for delete action');
        const result = await client.files.delete(path);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleToolError(error);
  }
}
