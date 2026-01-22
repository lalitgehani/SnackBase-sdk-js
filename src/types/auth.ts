export type { Account } from './account';
export type { User, UserListResponse } from './user';

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
  account?: string;
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  accountName?: string;
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
  account?: string;
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export type OAuthProvider = 'google' | 'github' | 'microsoft' | 'apple';

export interface OAuthUrlResponse {
  url: string;
  state: string;
}

export interface OAuthCallbackParams {
  provider: OAuthProvider;
  code: string;
  redirectUri: string;
  state: string;
}

export interface OAuthResponse extends AuthResponse {
  isNewUser: boolean;
  isNewAccount: boolean;
}

export type SAMLProvider = 'okta' | 'azure_ad' | 'generic_saml';

export interface SAMLUrlResponse {
  url: string;
}

export interface SAMLCallbackParams {
  SAMLResponse: string;
  relayState?: string;
}

export interface SAMLResponse extends AuthResponse {
  isNewUser: boolean;
  isNewAccount: boolean;
}
