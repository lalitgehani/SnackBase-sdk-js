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
        operation: 'create',
        page: 1,
        limit: 10,
        skip: 0,
      };
      const mockResponse: AuditLogListResponse = {
        items: [],
        total: 0,
        page: 1,
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
          page: 1, 
          limit: 10, 
          audit_logging_enabled: true 
        } 
      });

      await service.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/audit-logs', { params: undefined });
    });
  });

  describe('get', () => {
    it('should call GET /api/v1/audit-logs/:id', async () => {
      const logId = 'log-123';
      const mockLog: Partial<AuditLog> = { id: logId };
      mockHttpClient.get.mockResolvedValue({ data: mockLog });

      const result = await service.get(logId);

      expect(mockHttpClient.get).toHaveBeenCalledWith(`/api/v1/audit-logs/${logId}`);
      expect(result).toEqual(mockLog);
    });
  });

  describe('export', () => {
    it('should call GET /api/v1/audit-logs/export with correct parameters and default format', async () => {
      const filters: AuditLogFilters = { table_name: 'users' };
      mockHttpClient.get.mockResolvedValue({ data: 'csv-data' });

      const result = await service.export(filters);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/export', {
        params: {
          ...filters,
          format: 'json',
        },
      });
      expect(result).toEqual('csv-data');
    });

    it('should call GET /api/v1/audit-logs/export with specified format', async () => {
      const filters: AuditLogFilters = { table_name: 'users' };
      mockHttpClient.get.mockResolvedValue({ data: 'csv-data' });

      await service.export(filters, 'csv');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/export', {
        params: {
          ...filters,
          format: 'csv',
        },
      });
    });
  });
});
