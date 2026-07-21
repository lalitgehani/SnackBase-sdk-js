import { AuditLog } from './audit-log';

/** Time range for growth metrics and time series. */
export type DashboardRange = '7d' | '30d' | '90d';

export interface DashboardStatsParams {
  /** Time range for growth metrics and time series (default 7d). */
  range?: DashboardRange;
}

/**
 * System health information (backend SystemHealthStats).
 */
export interface SystemHealth {
  database_status: string;
  storage_usage_mb: number;
  /** Allow additional server fields without breaking clients. */
  [key: string]: any;
}

/**
 * Recent user registration row (backend RecentRegistration — not a full User).
 */
export interface RecentRegistration {
  id: string;
  email: string;
  account_id: string;
  account_code: string;
  account_name: string;
  created_at: string;
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface AuditOperationPoint {
  date: string;
  create: number;
  update: number;
  delete: number;
}

export interface TimeSeriesStats {
  accounts_created: TimeSeriesPoint[];
  users_created: TimeSeriesPoint[];
  audit_by_operation: AuditOperationPoint[];
}

export interface PreviousPeriodStats {
  new_accounts: number;
  new_users: number;
}

export interface CollectionRecordCount {
  name: string;
  count: number;
}

export interface FeatureCounts {
  hooks: number;
  hooks_enabled: number;
  webhooks: number;
  webhooks_enabled: number;
  workflows: number;
  endpoints: number;
  macros: number;
  api_keys_active: number;
  invitations_pending: number;
}

export interface JobsByStatus {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  retrying: number;
  dead: number;
}

export interface HookExecutionsSummary {
  success: number;
  failed: number;
  partial: number;
}

export interface WebhookDeliveriesSummary {
  delivered: number;
  failed: number;
  pending: number;
  retrying: number;
}

/**
 * Dashboard statistics and metrics for superadmins (HEAD backend shape).
 */
export interface DashboardStats {
  total_accounts: number;
  total_users: number;
  total_collections: number;
  total_records: number;
  /**
   * New accounts in the selected range.
   * Field name kept for backward compatibility; value reflects effective `range`.
   */
  new_accounts_7d: number;
  /**
   * New users in the selected range.
   * Field name kept for backward compatibility; value reflects effective `range`.
   */
  new_users_7d: number;
  /** Effective time range used for growth metrics and time series. */
  range: DashboardRange;
  previous_period: PreviousPeriodStats;
  time_series: TimeSeriesStats;
  recent_registrations: RecentRegistration[];
  system_health: SystemHealth;
  active_sessions: number;
  public_collections_count: number;
  records_by_collection: CollectionRecordCount[];
  feature_counts: FeatureCounts;
  jobs_by_status: JobsByStatus;
  hook_executions_summary: HookExecutionsSummary;
  webhook_deliveries_summary: WebhookDeliveriesSummary;
  recent_audit_logs: AuditLog[];
}
