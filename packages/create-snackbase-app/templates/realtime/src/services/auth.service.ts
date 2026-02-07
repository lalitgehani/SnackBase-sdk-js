import sb from '../lib/snackbase';
import type { LoginCredentials, AuthResponse } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await sb.login(credentials);
    return response as unknown as AuthResponse;
  },

  async logout() {
    await sb.logout();
  }
};

