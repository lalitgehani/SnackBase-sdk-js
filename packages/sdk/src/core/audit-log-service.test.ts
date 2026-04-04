import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditLogService } from './audit-log-service';
import { HttpClient } from './http-client';
import { AuditLogFilters, AuditLogListResponse, AuditLog } from '../types/audit-log';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
    };
    service = new AuditLogService(mockHttpClient as unknown as HttpClient);
  });

  describe('list', () => {
    it('should call GET /api/v1/audit-logs with correct parameters', async () => {
      const filters: AuditLogFilters = {
        table_name: 'users',
        operation: 'CREATE',
        skip: 0,
        limit: 10,
        sort_by: 'occurred_at',
        sort_order: 'desc',
      };
      const mockResponse: AuditLogListResponse = {
        items: [],
        total: 0,
        skip: 0,
        limit: 10,
        audit_logging_enabled: true,
      };
      mockHttpClient.get.mockResolvedValue({ data: mockResponse });

      const result = await service.list(filters);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/audit-logs', { params: filters });
      expect(result).toEqual(mockResponse);
    });

    it('should call GET /api/v1/audit-logs without parameters', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: {
          items: [],
          total: 0,
          skip: 0,
          limit: 50,
          audit_logging_enabled: true,
        },
      });

      await service.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/audit-logs', { params: undefined });
    });
  });

  describe('get', () => {
    it('should call GET /api/v1/audit-logs/:id with a numeric id', async () => {
      const logId = 123;
      const mockLog: Partial<AuditLog> = { id: logId };
      mockHttpClient.get.mockResolvedValue({ data: mockLog });

      const result = await service.get(logId);

      expect(mockHttpClient.get).toHaveBeenCalledWith(`/api/v1/audit-logs/${logId}`);
      expect(result).toEqual(mockLog);
    });

    it('should return the full audit entry shape', async () => {
      const logId = 456;
      const mockLog: AuditLog = {
        id: logId,
        account_id: 'AB1234',
        operation: 'CREATE',
        table_name: 'users',
        record_id: 'user-uuid',
        column_name: 'email',
        old_value: null,
        new_value: 'test@example.com',
        user_id: 'admin-uuid',
        user_email: 'admin@example.com',
        user_name: 'Admin',
        es_username: null,
        es_reason: null,
        es_timestamp: null,
        ip_address: '127.0.0.1',
        user_agent: null,
        request_id: null,
        occurred_at: '2026-01-01T00:00:00Z',
        checksum: 'abc123',
        previous_hash: null,
        extra_metadata: null,
      };
      mockHttpClient.get.mockResolvedValue({ data: mockLog });

      const result = await service.get(logId);

      expect(result.id).toBe(logId);
      expect(result.operation).toBe('CREATE');
      expect(result.table_name).toBe('users');
      expect(result.column_name).toBe('email');
      expect(result.occurred_at).toBeDefined();
    });
  });

  describe('export', () => {
    it('should call GET /api/v1/audit-logs/export with default json format', async () => {
      const filters: AuditLogFilters = { table_name: 'users' };
      mockHttpClient.get.mockResolvedValue({ data: '[]' });

      const result = await service.export(filters);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/export', {
        params: {
          ...filters,
          format: 'json',
        },
      });
      expect(result).toEqual('[]');
    });

    it('should call GET /api/v1/audit-logs/export with csv format', async () => {
      const filters: AuditLogFilters = { table_name: 'users' };
      mockHttpClient.get.mockResolvedValue({ data: 'id,operation\n1,CREATE\n' });

      await service.export(filters, 'csv');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/export', {
        params: {
          ...filters,
          format: 'csv',
        },
      });
    });

    it('should call GET /api/v1/audit-logs/export with date range filters', async () => {
      const filters: AuditLogFilters = {
        from_date: '2026-01-01T00:00:00Z',
        to_date: '2026-12-31T23:59:59Z',
      };
      mockHttpClient.get.mockResolvedValue({ data: '[]' });

      await service.export(filters, 'json');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/export', {
        params: {
          from_date: '2026-01-01T00:00:00Z',
          to_date: '2026-12-31T23:59:59Z',
          format: 'json',
        },
      });
    });
  });
});
