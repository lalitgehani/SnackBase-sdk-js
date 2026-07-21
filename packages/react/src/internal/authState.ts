import type { AuthState, SnackBase } from '@snackbase/sdk';
import { TokenType } from '@snackbase/sdk';

/**
 * Read the full AuthState from the client.
 * Prefer AuthManager.getState() so expiresAt and session flags stay in sync.
 * Centralizes access to @internal `client.internalAuthManager`.
 */
export function readAuthState(client: SnackBase): AuthState {
  const manager = client.internalAuthManager;
  if (manager && typeof manager.getState === 'function') {
    return manager.getState();
  }

  // Fallback if getState is unavailable (defensive for partial mocks)
  return {
    user: client.user,
    account: client.account,
    token: manager?.token ?? null,
    refreshToken: manager?.refreshToken ?? null,
    isAuthenticated: client.isAuthenticated,
    expiresAt: null,
    tokenType: client.tokenType ?? TokenType.JWT,
  };
}

/** Cleared auth state after logout. */
export function clearedAuthState(tokenType: AuthState['tokenType'] = TokenType.JWT): AuthState {
  return {
    user: null,
    account: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    expiresAt: null,
    tokenType,
  };
}
