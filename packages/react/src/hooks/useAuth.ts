import { useState, useEffect, useCallback } from 'react';
import { useSnackBase } from '../SnackBaseContext';
import { readAuthState, clearedAuthState } from '../internal/authState';
import type {
  AuthState,
  LoginCredentials,
  RegisterData,
  PasswordResetRequest,
  PasswordResetConfirm,
  OAuthProvider,
  OAuthCallbackParams,
  SAMLProvider,
  SAMLCallbackParams,
} from '@snackbase/sdk';

/**
 * Concurrent auth actions share a single `isLoading` flag (last write wins).
 * Prefer sequential auth UX for predictable loading indicators.
 */
/**
 * Auth state + actions. Note: AuthState already has field `refreshToken` (string | null),
 * so the refresh action is named `refreshAccessToken` to avoid a type/runtime clash.
 */
export interface UseAuthResult extends AuthState {
  login: (credentials: LoginCredentials) => Promise<any>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<any>;
  forgotPassword: (data: PasswordResetRequest) => Promise<any>;
  resetPassword: (data: PasswordResetConfirm) => Promise<any>;
  /** Calls `client.refreshToken()` — named to avoid clashing with AuthState.refreshToken string field */
  refreshAccessToken: () => Promise<any>;
  getCurrentUser: () => Promise<any>;
  verifyEmail: (token: string) => Promise<any>;
  resendVerificationEmail: () => Promise<any>;
  sendVerification: (email: string) => Promise<any>;
  verifyResetToken: (token: string) => Promise<any>;
  getOAuthUrl: (provider: OAuthProvider, redirectUri: string, state?: string) => Promise<any>;
  handleOAuthCallback: (params: OAuthCallbackParams) => Promise<any>;
  getSAMLUrl: (provider: SAMLProvider, account: string, relayState?: string) => Promise<any>;
  handleSAMLCallback: (params: SAMLCallbackParams) => Promise<any>;
  getSAMLMetadata: (provider: SAMLProvider, account: string) => Promise<any>;
  isLoading: boolean;
  /** Last error from auth:error events or failed actions; cleared on successful auth events */
  error: Error | null;
  isSuperadmin: boolean;
  isApiKeySession: boolean;
  isPersonalTokenSession: boolean;
  isOAuthSession: boolean;
}

export const useAuth = (): UseAuthResult => {
  const client = useSnackBase();
  const [state, setState] = useState<AuthState>(() => readAuthState(client));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Session flags derived from client on each render so they stay fresh
  const [sessionTick, setSessionTick] = useState(0);

  useEffect(() => {
    setState(readAuthState(client));
    setSessionTick((t) => t + 1);

    const onAuthSuccess = (newState: AuthState) => {
      setState(newState);
      setError(null);
      setSessionTick((t) => t + 1);
    };

    const onLogout = () => {
      setState(clearedAuthState(client.tokenType));
      setError(null);
      setSessionTick((t) => t + 1);
    };

    const onError = (err: Error) => {
      setError(err);
      setSessionTick((t) => t + 1);
    };

    const unsubscribeLogin = client.on('auth:login', onAuthSuccess);
    const unsubscribeRefresh = client.on('auth:refresh', onAuthSuccess);
    const unsubscribeLogout = client.on('auth:logout', onLogout);
    const unsubscribeError = client.on('auth:error', onError);

    return () => {
      unsubscribeLogin();
      unsubscribeRefresh();
      unsubscribeLogout();
      unsubscribeError();
    };
  }, [client]);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      setError(null);
      try {
        return await fn();
      } catch (err: any) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const login = useCallback(
    (credentials: LoginCredentials) => withLoading(() => client.login(credentials)),
    [client, withLoading]
  );

  const logout = useCallback(
    () => withLoading(async () => { await client.logout(); }),
    [client, withLoading]
  );

  const register = useCallback(
    (data: RegisterData) => withLoading(() => client.register(data)),
    [client, withLoading]
  );

  const forgotPassword = useCallback(
    (data: PasswordResetRequest) => withLoading(() => client.forgotPassword(data)),
    [client, withLoading]
  );

  const resetPassword = useCallback(
    (data: PasswordResetConfirm) => withLoading(() => client.resetPassword(data)),
    [client, withLoading]
  );

  const refreshAccessToken = useCallback(
    () => withLoading(() => client.refreshToken()),
    [client, withLoading]
  );

  const getCurrentUser = useCallback(
    () => withLoading(() => client.getCurrentUser()),
    [client, withLoading]
  );

  const verifyEmail = useCallback(
    (token: string) => withLoading(() => client.verifyEmail(token)),
    [client, withLoading]
  );

  const resendVerificationEmail = useCallback(
    () => withLoading(() => client.resendVerificationEmail()),
    [client, withLoading]
  );

  const sendVerification = useCallback(
    (email: string) => withLoading(() => client.auth.sendVerification(email)),
    [client, withLoading]
  );

  const verifyResetToken = useCallback(
    (token: string) => withLoading(() => client.auth.verifyResetToken(token)),
    [client, withLoading]
  );

  const getOAuthUrl = useCallback(
    (provider: OAuthProvider, redirectUri: string, state?: string) =>
      withLoading(() => client.auth.getOAuthUrl(provider, redirectUri, state)),
    [client, withLoading]
  );

  const handleOAuthCallback = useCallback(
    (params: OAuthCallbackParams) =>
      withLoading(() => client.auth.handleOAuthCallback(params)),
    [client, withLoading]
  );

  const getSAMLUrl = useCallback(
    (provider: SAMLProvider, account: string, relayState?: string) =>
      withLoading(() => client.getSAMLUrl(provider, account, relayState)),
    [client, withLoading]
  );

  const handleSAMLCallback = useCallback(
    (params: SAMLCallbackParams) =>
      withLoading(() => client.handleSAMLCallback(params)),
    [client, withLoading]
  );

  const getSAMLMetadata = useCallback(
    (provider: SAMLProvider, account: string) =>
      withLoading(() => client.getSAMLMetadata(provider, account)),
    [client, withLoading]
  );

  // Force re-read of session flags after auth events (sessionTick)
  void sessionTick;

  return {
    ...state,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    refreshAccessToken,
    getCurrentUser,
    verifyEmail,
    resendVerificationEmail,
    sendVerification,
    verifyResetToken,
    getOAuthUrl,
    handleOAuthCallback,
    getSAMLUrl,
    handleSAMLCallback,
    getSAMLMetadata,
    isLoading,
    error,
    isSuperadmin: client.isSuperadmin,
    isApiKeySession: client.isApiKeySession,
    isPersonalTokenSession: client.isPersonalTokenSession,
    isOAuthSession: client.isOAuthSession,
  };
};
