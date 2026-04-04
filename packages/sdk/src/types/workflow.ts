export type WorkflowTriggerType = 'event' | 'schedule' | 'manual' | 'webhook';

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  config?: Record<string, unknown>;
}

export interface WorkflowStep {
  id?: string;
  name: string;
  type: string;
  config?: Record<string, unknown>;
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

export interface WorkflowListParams {
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface WorkflowListResponse {
  items: Workflow[];
  total: number;
}

export interface WorkflowInstanceListParams {
  page?: number;
  page_size?: number;
  status?: WorkflowInstanceStatus;
  [key: string]: string | number | boolean | undefined;
}

export interface WorkflowInstanceListResponse {
  items: WorkflowInstance[];
  total: number;
}
