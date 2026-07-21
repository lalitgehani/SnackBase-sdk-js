/**
 * Curated app-facing type re-exports from `@snackbase/sdk`.
 * Prefer importing these from `@snackbase/react` for typical React app usage.
 * Admin-only types remain on `@snackbase/sdk`.
 */

export type {
  // Auth
  AuthState,
  AuthEvent,
  AuthEvents,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  PasswordResetRequest,
  PasswordResetConfirm,
  VerifyResetTokenResponse,
  OAuthProvider,
  OAuthUrlResponse,
  OAuthCallbackParams,
  OAuthResponse,
  SAMLProvider,
  SAMLUrlResponse,
  SAMLCallbackParams,
  SAMLResponse,
  User,
  Account,
  // Records / query
  BaseRecord,
  RecordListParams,
  RecordListResponse,
  BatchUpdateItem,
  BatchCreateResponse,
  BatchUpdateResponse,
  BatchDeleteResponse,
  AggregationParams,
  AggregationResponse,
  // Files
  FileMetadata,
  FileUploadOptions,
  // Invitations
  InvitationPublicDetails,
  // Realtime
  RealTimeState,
  RealtimeEvent,
  // Config / client
  SnackBaseConfig,
  SnackBase,
} from '@snackbase/sdk';

export { TokenType } from '@snackbase/sdk';
