import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useCodelistValues } from './useCodelistValues';
import { SnackBaseProvider } from '../SnackBaseContext';

describe('useCodelistValues', () => {
  let client: any;

  beforeEach(() => {
    client = {
      codelists: {
        getValues: vi.fn(),
      },
    };
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SnackBaseProvider client={client}>{children}</SnackBaseProvider>
  );

  it('loads effective values on mount', async () => {
    const mock = [
      {
        code: 'eu-01',
        label: 'EU Central (Germany)',
        is_default: false,
        sort_order: 1,
        scope: 'system',
        is_active: true,
      },
    ];
    client.codelists.getValues.mockResolvedValue(mock);

    const { result } = renderHook(
      () => useCodelistValues('regions', { lang: 'en' }),
      { wrapper },
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mock);
    expect(client.codelists.getValues).toHaveBeenCalledWith('regions', {
      lang: 'en',
    });
  });

  it('enabled: false skips network call', async () => {
    const { result } = renderHook(
      () => useCodelistValues('regions', { enabled: false }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(client.codelists.getValues).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it('handles errors', async () => {
    const error = new Error('Fetch failed');
    client.codelists.getValues.mockRejectedValue(error);

    const { result } = renderHook(() => useCodelistValues('regions'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeNull();
  });

  it('refetches when lang changes', async () => {
    client.codelists.getValues.mockResolvedValue([]);

    const { result, rerender } = renderHook(
      (props: { lang: string }) =>
        useCodelistValues('regions', { lang: props.lang }),
      { wrapper, initialProps: { lang: 'en' } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(client.codelists.getValues).toHaveBeenCalledWith('regions', {
      lang: 'en',
    });

    rerender({ lang: 'ja' });

    await waitFor(() => {
      expect(client.codelists.getValues).toHaveBeenCalledWith('regions', {
        lang: 'ja',
      });
    });
  });
});
