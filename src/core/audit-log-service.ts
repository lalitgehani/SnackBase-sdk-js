import { HttpClient } from './http-client';
import { 
  AuditLog, 
  AuditLogFilters, 
  AuditLogExportFormat, 
  AuditLogListResponse 
} from '../types/audit-log';

export class AuditLogService {
  constructor(private httpClient: HttpClient) {}

  /**
   * Lists audit logs with optional filtering, pagination, and sorting.
   */
  async list(params?: AuditLogFilters): Promise<AuditLogListResponse> {
    const response = await this.httpClient.get<AuditLogListResponse>('/api/v1/audit-logs', { params: params as any });
    return response.data;
  }

  /**
   * Retrieves a single audit log entry by ID.
   */
  async get(logId: string): Promise<AuditLog> {
    const response = await this.httpClient.get<AuditLog>(`/api/v1/audit-logs/${logId}`);
    return response.data;
  }

  /**
   * Exports audit logs in the specified format (JSON, CSV, or PDF).
   *
   * @param params Optional filters (account_id, table_name, operation, date range, etc.)
   * @param format Export format: 'json', 'csv', or 'pdf' (default: 'json')
   * @returns Exported data as string (base64-encoded for PDF format)
   * @throws {AuthorizationError} If user is not a superadmin
   *
   * @example
   * // Export as JSON
   * const jsonData = await client.auditLogs.export({ table_name: 'users' }, 'json');
   *
   * @example
   * // Export as CSV
   * const csvData = await client.auditLogs.export({ table_name: 'users' }, 'csv');
   *
   * @example
   * // Export as PDF
   * const pdfBase64 = await client.auditLogs.export({ table_name: 'users' }, 'pdf');
   * // pdfBase64 is a base64-encoded PDF string
   */
  async export(params?: AuditLogFilters, format: AuditLogExportFormat = 'json'): Promise<string> {
    const response = await this.httpClient.get<string>('/api/v1/audit-logs/export', {
      params: {
        ...params,
        format,
      } as any,
    });
    return response.data;
  }
}
