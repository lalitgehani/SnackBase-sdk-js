import { useState, useCallback } from 'react';
import { useSnackBase } from '../SnackBaseContext';
import type { InvitationPublicDetails, AuthResponse } from '@snackbase/sdk';

export interface UseInvitationResult {
  /** Fetch public invitation details by token (unauthenticated onboarding page). */
  getPublic: (token: string) => Promise<InvitationPublicDetails>;
  /**
   * Accept invitation with password. SDK returns AuthResponse and updates auth state;
   * useAuth will observe auth:login when the client emits it.
   */
  accept: (token: string, password: string) => Promise<AuthResponse>;
  loading: boolean;
  error: Error | null;
  /** Last successfully fetched public invitation details */
  invitation: InvitationPublicDetails | null;
}

/**
 * Public invitation flow helpers for accept/onboarding pages.
 * Admin create/list/resend/cancel remain available via `useSnackBase().invitations`.
 */
export function useInvitation(): UseInvitationResult {
  const client = useSnackBase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [invitation, setInvitation] = useState<InvitationPublicDetails | null>(null);

  const getPublic = useCallback(
    async (token: string) => {
      setLoading(true);
      setError(null);
      try {
        const details = await client.invitations.getPublic(token);
        setInvitation(details);
        return details;
      } catch (err: any) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const accept = useCallback(
    async (token: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        return await client.invitations.accept(token, password);
      } catch (err: any) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  return { getPublic, accept, loading, error, invitation };
}
