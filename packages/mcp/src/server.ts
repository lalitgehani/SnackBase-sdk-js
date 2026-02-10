import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as tools from './tools/index.js';

export const server = new Server(
  {
    name: 'snackbase-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Register Tool Handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [tools.collectionsTool, tools.recordsTool],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'snackbase_collections':
      return await tools.handleCollectionsTool(args);
    case 'snackbase_records':
      return await tools.handleRecordsTool(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});
