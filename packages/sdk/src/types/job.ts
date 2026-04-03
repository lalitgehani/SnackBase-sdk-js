export interface Job {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  payload: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface JobStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export interface JobListParams {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  type?: string;
  page?: number;
  per_page?: number;
}

export interface JobListResponse {
  items: Job[];
  total: number;
  page: number;
  per_page: number;
}
