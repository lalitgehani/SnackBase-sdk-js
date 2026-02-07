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
}

export const useAuth = (): UseAuthResult => {
  const client = useSnackBase();
  const [state, setState] = useState<AuthState>({
    user: client.user,
    account: client.account,
    token: client.internalAuthManager.token,
    refreshToken: client.internalAuthManager.refreshToken,
    isAuthenticated: client.isAuthenticated,
    expiresAt: null
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
      expiresAt: null
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
        expiresAt: null
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
    isLoading
  };
};
