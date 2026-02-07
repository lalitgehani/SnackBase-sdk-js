export interface User {
  id: string;
  email: string;
  role: string;
  groups: string[];
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface UserCreate {
  email: string;
  password?: string;
  account_id: string;
  role?: string;
}

export interface UserUpdate {
  email?: string;
  role?: string;
  is_active?: boolean;
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  account_id?: string;
  role_id?: string;
  is_active?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  [key: string]: string | number | boolean | undefined;
}

export interface UserListResponse {
  items: User[];
  total: number;
}
