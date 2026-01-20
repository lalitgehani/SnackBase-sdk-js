export interface User {
  id: string;
  email: string;
  role: string;
  groups: string[];
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface Account {
  id: string;
  slug: string;
  name: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  account: Account | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  expiresAt: string | null; // ISO 8601
}

export type AuthEvent = 'auth:login' | 'auth:logout' | 'auth:refresh' | 'auth:error';

export interface AuthEvents {
  'auth:login': (state: AuthState) => void;
  'auth:logout': () => void;
  'auth:refresh': (state: AuthState) => void;
  'auth:error': (error: Error) => void;
}

export interface LoginCredentials {
  account: string;
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  accountName: string;
  accountSlug?: string;
}

export interface AuthResponse {
  user: User;
  account: Account;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface PasswordResetRequest {
  account: string;
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}
