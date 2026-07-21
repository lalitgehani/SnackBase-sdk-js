import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useSnackBase, SnackBaseProvider } from './SnackBaseContext';
import { SnackBaseClient } from '@snackbase/sdk';

vi.mock('@snackbase/sdk', async () => {
  const actual = await vi.importActual<typeof import('@snackbase/sdk')>('@snackbase/sdk');
  return {
    ...actual,
    SnackBaseClient: vi.fn().mockImplementation((config: any) => ({
      getConfig: () => ({ ...config }),
      __config: config,
    })),
  };
});

describe('SnackBaseProvider', () => {
  beforeEach(() => {
    vi.mocked(SnackBaseClient).mockClear();
  });

  it('throws outside provider', () => {
    const originalError = console.error;
    console.error = vi.fn();
    expect(() => {
      renderHook(() => useSnackBase());
    }).toThrow('useSnackBase must be used within a SnackBaseProvider');
    console.error = originalError;
  });

  it('supports pre-built client prop', () => {
    const client = { id: 'mock-client' } as any;
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SnackBaseProvider client={client}>{children}</SnackBaseProvider>
    );
    const { result } = renderHook(() => useSnackBase(), { wrapper });
    expect(result.current).toBe(client);
  });

  it('supports baseUrl config form and stable client identity', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SnackBaseProvider baseUrl="http://localhost:8000">{children}</SnackBaseProvider>
    );

    const { result, rerender } = renderHook(() => useSnackBase(), { wrapper });
    const first = result.current;
    expect(SnackBaseClient).toHaveBeenCalled();
    expect((first as any).getConfig().baseUrl).toBe('http://localhost:8000');

    rerender();
    expect(result.current).toBe(first);
    // Only one construction for stable config
    expect(SnackBaseClient).toHaveBeenCalledTimes(1);
  });
});
