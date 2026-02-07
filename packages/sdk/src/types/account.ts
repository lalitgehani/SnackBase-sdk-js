export interface Account {
  id: string;
  slug: string;
  name: string;
  created_at: string;
}

export interface AccountCreate {
  name: string;
  slug?: string;
}

export interface AccountUpdate {
  name: string;
}

export interface AccountListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  [key: string]: string | number | boolean | undefined;
}

export interface AccountListResponse {
  items: Account[];
  total: number;
}

export interface AccountUserListParams {
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | undefined;
}
