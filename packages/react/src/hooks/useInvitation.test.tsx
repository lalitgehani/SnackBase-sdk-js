import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useInvitation } from './useInvitation';
import { SnackBaseProvider } from '../SnackBaseContext';

describe('useInvitation', () => {
  let client: any;

  beforeEach(() => {
    client = {
      invitations: {
        getPublic: vi.fn(),
        accept: vi.fn(),
      },
    };
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SnackBaseProvider client={client}>{children}</SnackBaseProvider>
  );

  it('getPublic fetches and stores invitation', async () => {
    const details = { email: 'a@b.com', account_name: 'Acme' };
    client.invitations.getPublic.mockResolvedValue(details);

    const { result } = renderHook(() => useInvitation(), { wrapper });
    await act(async () => {
      await result.current.getPublic('token-1');
    });

    expect(client.invitations.getPublic).toHaveBeenCalledWith('token-1');
    expect(result.current.invitation).toEqual(details);
  });

  it('accept delegates to SDK', async () => {
    const auth = { token: 'jwt', user: { id: '1' } };
    client.invitations.accept.mockResolvedValue(auth);

    const { result } = renderHook(() => useInvitation(), { wrapper });
    let out: any;
    await act(async () => {
      out = await result.current.accept('token-1', 'secret');
    });

    expect(client.invitations.accept).toHaveBeenCalledWith('token-1', 'secret');
    expect(out).toEqual(auth);
  });
});
