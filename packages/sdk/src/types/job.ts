export interface Job {
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

export interface JobStats {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  retrying: number;
  dead: number;
  avg_duration_seconds: number | null;
  failure_rate: number | null;
}

export interface JobListParams {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'retrying' | 'dead';
  queue?: string;
  handler?: string;
  limit?: number;
  offset?: number;
}

export interface JobListResponse {
  items: Job[];
  total: number;
}
