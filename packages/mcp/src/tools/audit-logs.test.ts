import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAuditLogsTool } from './audit-logs.js';
import { createClient } from '../client.js';

// Mock the client factory
vi.mock('../client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_audit_logs tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      auditLogs: {
        list: vi.fn(),
        get: vi.fn(),
        export: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles list action', async () => {
    const mockLogs = {
      items: [{ id: '1', table_name: 'users', operation: 'create' }],
      total: 1,
      page: 1,
      limit: 30,
      audit_logging_enabled: true,
    };
    mockClient.auditLogs.list.mockResolvedValue(mockLogs);

    const result = await handleAuditLogsTool({ 
      action: 'list', 
      table_name: 'users',
      limit: 10
    }) as any;

    expect(mockClient.auditLogs.list).toHaveBeenCalledWith({
      table_name: 'users',
      limit: 10
    });
    expect(result.content[0].text).toBe(JSON.stringify(mockLogs, null, 2));
  });

  it('handles get action', async () => {
    const mockLog = { id: 'log-123', table_name: 'users', operation: 'update' };
    mockClient.auditLogs.get.mockResolvedValue(mockLog);

    const result = await handleAuditLogsTool({ 
      action: 'get', 
      log_id: 'log-123' 
    }) as any;

    expect(mockClient.auditLogs.get).toHaveBeenCalledWith('log-123');
    expect(result.content[0].text).toBe(JSON.stringify(mockLog, null, 2));
  });

  it('throws error when log_id is missing for get action', async () => {
    const result = await handleAuditLogsTool({ action: 'get' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('log_id is required');
  });

  it('handles export action', async () => {
    const mockExportData = 'id,table_name,operation\n1,users,create';
    mockClient.auditLogs.export.mockResolvedValue(mockExportData);

    const result = await handleAuditLogsTool({ 
      action: 'export', 
      table_name: 'users',
      format: 'csv' 
    }) as any;

    expect(mockClient.auditLogs.export).toHaveBeenCalledWith({ table_name: 'users' }, 'csv');
    expect(result.content[0].text).toBe(mockExportData);
  });

  it('maps SDK errors correctly', async () => {
    mockClient.auditLogs.list.mockRejectedValue(new Error('SDK Error'));

    const result = await handleAuditLogsTool({ action: 'list' }) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('SDK Error');
  });

  it('handles unknown action', async () => {
    const result = await handleAuditLogsTool({ action: 'invalid' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
