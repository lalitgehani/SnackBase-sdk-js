import { Server } from '@modelcontextprotocol/sdk/server/index.js';

export const server = new Server(
  {
    name: 'snackbase-mcp',
    version: '0.1.0', // This shouldIdeally be imported from package.json
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);
