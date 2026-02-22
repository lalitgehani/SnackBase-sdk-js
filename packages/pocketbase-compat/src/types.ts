/**
 * PocketBase-compatible type definitions for @snackbase/pocketbase-compat.
 * These mirror the shapes from the PocketBase JS SDK.
 */

export interface RecordModel {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  expand?: Record<string, any>;
  [key: string]: any;
}

export interface ListResult<T = RecordModel> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

export interface RecordAuthResponse<T = RecordModel> {
  record: T;
  token: string;
  meta?: Record<string, any>;
}

export interface AuthMethodsList {
  mfa: {
    duration: number;
    enabled: boolean;
    rule: string;
  };
  otp: {
    duration: number;
    emailTemplate: Record<string, any>;
    enabled: boolean;
    length: number;
  };
  password: {
    enabled: boolean;
    identityFields: string[];
  };
  oauth2: {
    enabled: boolean;
    providers: Array<{
      authURL: string;
      codeVerifier: string;
      displayName: string;
      name: string;
      pkce: boolean;
      state: string;
    }>;
  };
}

export interface RecordSubscription<T = RecordModel> {
  action: 'create' | 'update' | 'delete';
  record: T;
}

export interface HealthCheckResponse {
  code: number;
  message: string;
  data: Record<string, any>;
}

export interface FileOptions {
  thumb?: string;
  token?: string;
  download?: boolean;
}

export interface BatchRequestResult {
  status: number;
  body: any;
}
