/**
 * Authentication service
 * Handles register, login, token refresh, and user info retrieval
 */

import { snackbase } from '@/lib/snackbase';
import type {
  AuthResponse,
  RegisterResponse,
} from '@/types';

/**
 * Register a new account with first user
 */
export const register = async (
  email: string,
  password: string
): Promise<RegisterResponse> => {
  const response = await snackbase.register({
    email,
    password,
  });
  return response as unknown as RegisterResponse;
};

/**
 * Login with email and password
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await snackbase.login({
    email,
    password,
  });
  return response as unknown as AuthResponse;
};

/**
 * Get current user info
 */
export const getCurrentUser = async (): Promise<{ user_id: string; account_id: string; email: string; role: string }> => {
  const response = await snackbase.getCurrentUser();
  return {
    user_id: response.id,
    account_id: response.account_id,
    email: response.email,
    role: response.role,
  };
};

/**
 * Verify email with token
 */
export const verifyEmail = async (token: string): Promise<{ message: string; user: { id: string; email: string; email_verified: boolean } }> => {
  const response = await snackbase.verifyEmail(token);
  return response as any;
};

/**
 * Resend verification email (public endpoint)
 */
export const resendVerification = async (email: string): Promise<{ message: string; email: string }> => {
  // Use current user's resend if applicable, or keep as semi-mocked if SDK doesn't support public resend yet
  const response = await snackbase.resendVerificationEmail();
  return response as any;
};

/**
 * Logout (client-side only - clears local state)
 */
export const logout = async (): Promise<void> => {
  await snackbase.logout();
};
