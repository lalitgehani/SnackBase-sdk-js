import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './server';
import { createClient } from './client';

/**
 * @snackbase/mcp
 * SnackBase MCP Server entry point.
 */

async function main() {
  console.error('SnackBase MCP Server starting...');

  try {
    // Validate and initialize SDK client early
    createClient();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Startup error: ${error.message}`);
    } else {
      console.error('An unknown error occurred during client initialization');
    }
    process.exit(1);
  }

  // Connect to transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('SnackBase MCP Server running on stdio');
}

// Handle graceful shutdown
const shutdown = async () => {
  console.error('SnackBase MCP Server shutting down...');
  await server.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((error) => {
  console.error('Fatal error during startup:', error);
  process.exit(1);
});
