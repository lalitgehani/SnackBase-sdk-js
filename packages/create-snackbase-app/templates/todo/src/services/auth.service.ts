/**
 * Authentication service
 * Handles register, login, token refresh, and user info retrieval
 */

import { snackbase } from '@/lib/snackbase';

/**
 * Register a new account with first user
 */
export const register = async (
  accountName: string,
  accountSlug: string | undefined,
  email: string,
  password: string
) => {
  return await snackbase.register({
    account_name: accountName,
    account_slug: accountSlug,
    email,
    password,
  });
};

/**
 * Login with email and password
 */
export const login = async (account: string, email: string, password: string) => {
  return await snackbase.login({
    account,
    email,
    password,
  });
};

/**
 * Get current user info
 */
export const getCurrentUser = async () => {
  return await snackbase.getCurrentUser();
};

/**
 * Verify email with token
 */
export const verifyEmail = async (token: string) => {
  return await snackbase.verifyEmail(token);
};

/**
 * Resend verification email (public endpoint)
 */
export const resendVerification = async (email: string, account: string) => {
  // Note: SDK might not have a direct resendVerification for a specific email/account combo
  // if it's not the current user, but let's check sdk/src/core/auth-service.ts
  return await snackbase.resendVerificationEmail();
};

/**
 * Logout (client-side only - clears local state)
 */
export const logout = async (): Promise<void> => {
  await snackbase.logout();
};
