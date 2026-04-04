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
  status_filter?: 'pending' | 'accepted' | 'expired' | 'cancelled';
  account_id?: string;
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface InvitationListResponse {
  invitations: Invitation[];
  total: number;
}

export interface InvitationPublicDetails {
  email: string;
  account_name: string;
  invited_by_name: string;
  expires_at: string;
  is_valid: boolean;
}
