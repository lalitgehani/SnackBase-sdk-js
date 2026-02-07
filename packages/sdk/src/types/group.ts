export interface Group {
  id: string;
  account_id: string;
  name: string;
  description?: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupCreate {
  name: string;
  description?: string;
}

export interface GroupUpdate {
  name?: string;
  description?: string;
}

export interface GroupListParams {
  page?: number;
  page_size?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface GroupListResponse {
  items: Group[];
  total: number;
  page: number;
  page_size: number;
}
