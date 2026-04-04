export interface AuditLog {
  id: number;
  account_id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | string;
  table_name: string;
  record_id: string;
  column_name: string;
  old_value: string | null;
  new_value: string | null;
  user_id: string;
  user_email: string;
  user_name: string;
  es_username: string | null;
  es_reason: string | null;
  es_timestamp: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  occurred_at: string;
  checksum: string | null;
  previous_hash: string | null;
  extra_metadata: Record<string, unknown> | null;
}

export interface AuditLogFilters {
  account_id?: string;
  table_name?: string;
  record_id?: string;
  user_id?: string;
  operation?: string;
  from_date?: string;
  to_date?: string;
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export type AuditLogExportFormat = 'csv' | 'json' | 'pdf';

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  skip: number;
  limit: number;
  audit_logging_enabled: boolean;
}
