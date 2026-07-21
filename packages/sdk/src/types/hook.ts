export type HookTriggerConfig =
  | { type: 'schedule'; cron: string }
  | { type: 'event'; event: string; collection?: string }
  | { type: 'manual' };

export interface Hook {
  id: string;
  account_id: string;
  name: string;
  description?: string | null;
  trigger: HookTriggerConfig;
  condition?: string | null;
  actions: Record<string, any>[];
  enabled: boolean;
  last_run_at?: string | null;
  next_run_at?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  /** Cron expression (schedule triggers only; convenience field from backend). */
  cron?: string | null;
  /** Human-readable cron schedule (schedule triggers only). */
  cron_description?: string | null;
}

export interface HookCreate {
  name: string;
  description?: string;
  trigger: HookTriggerConfig;
  condition?: string;
  actions?: Record<string, any>[];
  enabled?: boolean;
}

export type HookUpdate = Partial<HookCreate>;

export interface HookListParams {
  trigger_type?: 'schedule' | 'event' | 'manual';
  enabled?: boolean;
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface HookListResponse {
  items: Hook[];
  total: number;
}

export interface HookExecution {
  id: string;
  hook_id: string;
  trigger_type: string;
  status: 'success' | 'failed' | 'partial' | string;
  actions_executed: number;
  error_message?: string | null;
  duration_ms?: number | null;
  execution_context?: Record<string, any> | null;
  executed_at: string;
}

export interface HookExecutionListParams {
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface HookExecutionListResponse {
  items: HookExecution[];
  total: number;
}
