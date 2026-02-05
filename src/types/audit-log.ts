export interface AuditLog {
  id: string;
  account_id: string;
  table_name: string;
  record_id: string;
  user_id: string;
  operation: 'create' | 'update' | 'delete' | 'login' | 'logout' | string;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  created_at: string;
}

export interface AuditLogFilters {
  account_id?: string;
  table_name?: string;
  record_id?: string;
  user_id?: string;
  operation?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  skip?: number;
  limit?: number;
  sort?: string;
}

export type AuditLogExportFormat = 'csv' | 'json' | 'pdf';

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
  audit_logging_enabled: boolean;
}
