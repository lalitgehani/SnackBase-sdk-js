export type WorkflowTriggerType = 'event' | 'schedule' | 'manual' | 'webhook';

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  config?: Record<string, unknown>;
  /** Event name when type is event (backend also flattens into trigger_config). */
  event?: string;
  collection?: string | null;
  condition?: string | null;
  cron?: string;
  token?: string | null;
}

/**
 * Optional canvas coordinates for the visual workflow editor (ignored by executor).
 */
export interface WorkflowStepPosition {
  position_x?: number | null;
  position_y?: number | null;
}

/**
 * Workflow step definition. Backend accepts free-form step dicts with typed variants
 * (action, condition, wait_delay, wait_condition, wait_event, loop, parallel).
 * Optional position_x / position_y are UI layout only.
 */
export interface WorkflowStep extends WorkflowStepPosition {
  id?: string;
  name: string;
  type: string;
  config?: Record<string, unknown>;
  action_type?: string;
  next?: string | null;
  expression?: string;
  on_true?: string | null;
  on_false?: string | null;
  duration?: string;
  poll_interval?: string;
  timeout?: string;
  event?: string;
  collection?: string | null;
  condition?: string | null;
  items?: string;
  step?: string;
  branches?: string[][];
  [key: string]: unknown;
}

export interface Workflow {
  id: string;
  account_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  steps: WorkflowStep[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface WorkflowCreate {
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  steps?: WorkflowStep[];
  enabled?: boolean;
}

export interface WorkflowUpdate {
  name?: string;
  description?: string;
  trigger?: WorkflowTrigger;
  steps?: WorkflowStep[];
  enabled?: boolean;
}

export type WorkflowInstanceStatus = 'pending' | 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowInstance {
  id: string;
  workflow_id: string;
  account_id: string;
  status: WorkflowInstanceStatus;
  current_step: string | null;
  context: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  resume_job_id: string | null;
}

export interface WorkflowStepLog {
  id: string;
  instance_id: string;
  workflow_id: string;
  account_id: string;
  step_name: string;
  step_type: string;
  status: string;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface WorkflowInstanceDetail extends WorkflowInstance {
  step_logs: WorkflowStepLog[];
}

export interface WorkflowTriggerResponse {
  message: string;
  instance_id: string;
}

/**
 * List query parameters (backend: limit/offset + trigger_type/enabled).
 */
export interface WorkflowListParams {
  trigger_type?: WorkflowTriggerType | string;
  enabled?: boolean;
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface WorkflowListResponse {
  items: Workflow[];
  total: number;
}

/**
 * Instance list query parameters (backend: limit/offset + status).
 */
export interface WorkflowInstanceListParams {
  status?: WorkflowInstanceStatus;
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface WorkflowInstanceListResponse {
  items: WorkflowInstance[];
  total: number;
}
