export type WorkflowTriggerType = 'event' | 'schedule' | 'manual' | 'webhook';

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  config?: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  config?: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowCreate {
  name: string;
  trigger: WorkflowTrigger;
  steps?: WorkflowStep[];
  enabled?: boolean;
}

export interface WorkflowUpdate {
  name?: string;
  trigger?: WorkflowTrigger;
  steps?: WorkflowStep[];
  enabled?: boolean;
}

export type WorkflowInstanceStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowInstance {
  id: string;
  workflow_id: string;
  status: WorkflowInstanceStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface WorkflowStepLog {
  step_id: string;
  step_name: string;
  status: WorkflowInstanceStatus;
  output?: Record<string, unknown>;
  error?: string;
  started_at: string;
  completed_at?: string;
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
