Superadmin dashboard metrics and growth series.

Aligned with `DashboardService` and `types/dashboard.ts` in `@snackbase/sdk` ≥ 0.6.0.
Accessor: `client.dashboard`

## getStats

```typescript
type DashboardRange = '7d' | '30d' | '90d';

const stats = await client.dashboard.getStats({ range: '30d' });
// default range is 7d when omitted
const weekly = await client.dashboard.getStats();
```

GET `/api/v1/dashboard/stats?range=30d`

## Nested metrics

```typescript
console.log(stats.total_accounts, stats.total_users, stats.total_collections, stats.total_records);
console.log(stats.range); // effective range
console.log(stats.new_accounts_7d, stats.new_users_7d); // values reflect selected range (legacy field names)

// Previous period comparison
console.log(stats.previous_period.new_accounts, stats.previous_period.new_users);

// Time series
console.log(stats.time_series.accounts_created);
console.log(stats.time_series.users_created);
console.log(stats.time_series.audit_by_operation);

// Records by collection
stats.records_by_collection.forEach((c) => console.log(c.name, c.count));

// Feature counts
console.log(stats.feature_counts.hooks, stats.feature_counts.workflows, stats.feature_counts.endpoints);

// Jobs by status
console.log(stats.jobs_by_status.pending, stats.jobs_by_status.dead);

// Hook / webhook summaries
console.log(stats.hook_executions_summary.success, stats.hook_executions_summary.failed);
console.log(stats.webhook_deliveries_summary.delivered);

// System health (HEAD shape — not status/uptime/version primary)
console.log(stats.system_health.database_status);
console.log(stats.system_health.storage_usage_mb);

// Recent registrations (not full User)
stats.recent_registrations.forEach((r) => {
  console.log(r.email, r.account_code, r.created_at);
});

console.log(stats.active_sessions, stats.public_collections_count);
console.log(stats.recent_audit_logs);
```

## SystemHealth

```typescript
interface SystemHealth {
  database_status: string;
  storage_usage_mb: number;
  [key: string]: any;
}
```

## RecentRegistration

```typescript
interface RecentRegistration {
  id: string;
  email: string;
  account_id: string;
  account_code: string;
  account_name: string;
  created_at: string;
}
```

Requires superadmin authentication.
