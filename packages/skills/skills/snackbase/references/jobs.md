Background job queue management for **superadmins**.

Aligned with `JobService` and `types/job.ts` in `@snackbase/sdk` ≥ 0.6.0.
Accessor: `client.jobs`  
Base path: `/api/v1/admin/jobs`

## Methods

| Method | Description |
| ------ | ----------- |
| `list(params?)` | Filter by `status`, `queue`, `handler`, `limit`, `offset` |
| `stats()` | Counts by status + averages |
| `retry(id)` | Retry jobs in **dead**, **failed**, or **retrying** status |
| `cancel(id)` | **DELETE** pending job only (400 for other statuses) |

## Statuses

`pending` | `running` | `completed` | `failed` | `retrying` | `dead`

## Examples

```typescript
// Superadmin session required
const { items, total } = await client.jobs.list({
  status: 'failed',
  limit: 50,
  offset: 0,
});

const stats = await client.jobs.stats();
console.log(stats.pending, stats.running, stats.failed, stats.dead, stats.retrying);

// Retry dead / failed / retrying
const retried = await client.jobs.retry(jobId);

// Cancel only when status is pending
await client.jobs.cancel(pendingJobId);
```

## Job shape

```typescript
interface Job {
  id: string;
  queue: string;
  handler: string;
  payload: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying' | 'dead';
  priority: number;
  run_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  attempt_number: number;
  max_retries: number;
  retry_delay_seconds: number;
  created_at: string;
  created_by: string | null;
  account_id: string | null;
}

interface JobStats {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  retrying: number;
  dead: number;
  avg_duration_seconds: number | null;
  failure_rate: number | null;
}
```
