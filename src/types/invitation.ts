export interface Invitation {
  id: string;
  email: string;
  account_id: string;
  role_id?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface InvitationCreate {
  email: string;
  role_id?: string;
}

export interface InvitationListParams {
  status?: 'pending' | 'accepted' | 'expired' | 'cancelled';
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | undefined;
}
