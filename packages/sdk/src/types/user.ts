import { TokenType } from './auth';

export interface User {
  id: string;
  email: string;
  role: string;
  account_id: string;
  groups: string[];
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  token_type: TokenType; // Required: Backend always provides this
}

export interface UserCreate {
  email: string;
  password?: string;
  account_id: string;
  role_id: number;
}

export interface UserUpdate {
  email?: string;
  role?: string;
  role_id?: number;
  is_active?: boolean;
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  skip?: number;
  limit?: number;
  account_id?: string;
  role_id?: string | number;
  is_active?: boolean;
  search?: string;
  sort?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  [key: string]: string | number | boolean | undefined;
}

export interface UserListResponse {
  items: User[];
  total: number;
}
