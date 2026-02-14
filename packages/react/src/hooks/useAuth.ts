import { useState, useEffect, useCallback } from 'react';
import { useSnackBase } from '../SnackBaseContext';
import { AuthState, LoginCredentials, RegisterData, PasswordResetRequest, PasswordResetConfirm } from '@snackbase/sdk';

export interface UseAuthResult extends AuthState {
  login: (credentials: LoginCredentials) => Promise<any>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<any>;
  forgotPassword: (data: PasswordResetRequest) => Promise<any>;
  resetPassword: (data: PasswordResetConfirm) => Promise<any>;
  isLoading: boolean;
  isSuperadmin: boolean;
  isApiKeySession: boolean;
  isPersonalTokenSession: boolean;
  isOAuthSession: boolean;
}

export const useAuth = (): UseAuthResult => {
  const client = useSnackBase();
  const [state, setState] = useState<AuthState>({
    user: client.user,
    account: client.account,
    token: client.internalAuthManager.token,
    refreshToken: client.internalAuthManager.refreshToken,
    isAuthenticated: client.isAuthenticated,
    expiresAt: null,
    tokenType: client.tokenType
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initial state sync
    setState({
      user: client.user,
      account: client.account,
      token: client.internalAuthManager.token,
      refreshToken: client.internalAuthManager.refreshToken,
      isAuthenticated: client.isAuthenticated,
      expiresAt: null,
      tokenType: client.tokenType
    });

    const updateState = (newState: AuthState) => {
      setState(newState);
    };

    const clearState = () => {
      setState({
        user: null,
        account: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        expiresAt: null,
        tokenType: client.tokenType // Still keep the type or default to JWT? PRD says default to JWT. client.tokenType is safer.
      });
    };

    const unsubscribeLogin = client.on('auth:login', updateState);
    const unsubscribeRefresh = client.on('auth:refresh', updateState);
    const unsubscribeLogout = client.on('auth:logout', clearState);

    return () => {
      unsubscribeLogin();
      unsubscribeRefresh();
      unsubscribeLogout();
    };
  }, [client]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      return await client.login(credentials);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await client.logout();
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      return await client.register(data);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const forgotPassword = useCallback(async (data: PasswordResetRequest) => {
    setIsLoading(true);
    try {
      return await client.forgotPassword(data);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const resetPassword = useCallback(async (data: PasswordResetConfirm) => {
    setIsLoading(true);
    try {
      return await client.resetPassword(data);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  return {
    ...state,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    isLoading,
    isSuperadmin: client.isSuperadmin,
    isApiKeySession: client.isApiKeySession,
    isPersonalTokenSession: client.isPersonalTokenSession,
    isOAuthSession: client.isOAuthSession
  };
};
