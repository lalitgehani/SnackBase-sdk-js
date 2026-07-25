import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useCodelists } from './useCodelists';
import { SnackBaseProvider } from '../SnackBaseContext';

describe('useCodelists', () => {
  let client: any;

  beforeEach(() => {
    client = {
      codelists: {
        list: vi.fn(),
      },
    };
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SnackBaseProvider client={client}>{children}</SnackBaseProvider>
  );

  it('lists codelists on mount', async () => {
    const mock = [{ code: 'regions', name: 'Cloud Regions', is_system: true }];
    client.codelists.list.mockResolvedValue(mock);

    const { result } = renderHook(() => useCodelists(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mock);
    expect(client.codelists.list).toHaveBeenCalled();
  });

  it('passes scope filter', async () => {
    client.codelists.list.mockResolvedValue([]);

    const { result } = renderHook(
      () => useCodelists({ scope: 'system' }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(client.codelists.list).toHaveBeenCalledWith({ scope: 'system' });
  });

  it('enabled: false skips fetch', async () => {
    const { result } = renderHook(() => useCodelists({ enabled: false }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(client.codelists.list).not.toHaveBeenCalled();
  });
});
