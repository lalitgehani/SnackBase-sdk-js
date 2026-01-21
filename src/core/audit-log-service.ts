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
   * Exports audit logs in the specified format.
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
