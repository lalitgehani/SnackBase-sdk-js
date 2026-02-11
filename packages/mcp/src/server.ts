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
  tools: [
    tools.collectionsTool,
    tools.recordsTool,
    tools.collectionRulesTool,
    tools.usersTool,
    tools.groupsTool,
    tools.rolesTool,
    tools.accountsTool,
    tools.invitationsTool,
    tools.apiKeysTool,
    tools.adminTool,
    tools.dashboardTool,
    tools.auditLogsTool,
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'snackbase_collections':
      return await tools.handleCollectionsTool(args);
    case 'snackbase_records':
      return await tools.handleRecordsTool(args);
    case 'snackbase_collection_rules':
      return await tools.handleCollectionRulesTool(args);
    case 'snackbase_users':
      return await tools.handleUsersTool(args);
    case 'snackbase_groups':
      return await tools.handleGroupsTool(args);
    case 'snackbase_roles':
      return await tools.handleRolesTool(args);
    case 'snackbase_accounts':
      return await tools.handleAccountsTool(args);
    case 'snackbase_invitations':
      return await tools.handleInvitationsTool(args);
    case 'snackbase_api_keys':
      return await tools.handleApiKeysTool(args);
    case 'snackbase_admin':
      return await tools.handleAdminTool(args);
    case 'snackbase_dashboard':
      return await tools.handleDashboardTool(args);
    case 'snackbase_audit_logs':
      return await tools.handleAuditLogsTool(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});
