import { User } from './user';
import { AuditLog } from './audit-log';

/**
 * Dashboard statistics and metrics for superadmins.
 */
export interface DashboardStats {
  /** Total number of accounts in the system */
  total_accounts: number;
  /** Total number of users across all accounts */
  total_users: number;
  /** Total number of collections defined */
  total_collections: number;
  /** Total number of records across all collections */
  total_records: number;
  /** Number of new accounts created in the last 7 days */
  new_accounts_7d: number;
  /** Number of new users registered in the last 7 days */
  new_users_7d: number;
  /** List of the most recent user registrations */
  recent_registrations: User[];
  /** Overview of current system health and status */
  system_health: SystemHealth;
  /** Number of currently active user sessions */
  active_sessions: number;
  /** List of the most recent audit log entries */
  recent_audit_logs: AuditLog[];
}

/**
 * System health information.
 */
export interface SystemHealth {
  /** overall status of the system */
  status: 'healthy' | 'degraded' | 'unhealthy' | string;
  /** System uptime (e.g., "7 days, 4 hours") */
  uptime?: string;
  /** Current version of the SnackBase server */
  version?: string;
  /** Additional health metrics */
  [key: string]: any;
}
