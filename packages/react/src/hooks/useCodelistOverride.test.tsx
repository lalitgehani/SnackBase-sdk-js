import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useCodelistOverride } from './useCodelistOverride';
import { SnackBaseProvider } from '../SnackBaseContext';

describe('useCodelistOverride', () => {
  let client: any;

  beforeEach(() => {
    client = {
      codelists: {
        setOverride: vi.fn(),
        clearOverride: vi.fn(),
      },
    };
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SnackBaseProvider client={client}>{children}</SnackBaseProvider>
  );

  it('setOverride calls SDK and returns data', async () => {
    const ov = {
      id: '1',
      visibility: 'hidden',
      is_default: false,
      account_id: 'a',
      codelist_id: 'c',
      value_id: 'v',
    };
    client.codelists.setOverride.mockResolvedValue(ov);

    const { result } = renderHook(() => useCodelistOverride(), { wrapper });

    let out: unknown;
    await act(async () => {
      out = await result.current.setOverride(
        'regions',
        'eu-01',
        { visibility: 'hidden' },
        'acct-a',
      );
    });

    expect(out).toEqual(ov);
    expect(client.codelists.setOverride).toHaveBeenCalledWith(
      'regions',
      'eu-01',
      { visibility: 'hidden' },
      'acct-a',
    );
    expect(result.current.loading).toBe(false);
  });

  it('clearOverride propagates errors and sets error state', async () => {
    client.codelists.clearOverride.mockRejectedValue(new Error('nope'));

    const { result } = renderHook(() => useCodelistOverride(), { wrapper });

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.clearOverride('regions', 'eu-01');
      } catch (e) {
        thrown = e;
      }
    });

    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe('nope');
    expect(result.current.error?.message).toBe('nope');
    expect(result.current.loading).toBe(false);
  });
});
