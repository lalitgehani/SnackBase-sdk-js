import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClientAction } from './useClientAction';

describe('useClientAction', () => {
  it('tracks success loading data', async () => {
    const action = vi.fn().mockResolvedValue(42);
    const { result } = renderHook(() => useClientAction(action));

    await act(async () => {
      await result.current.run();
    });

    expect(result.current.data).toBe(42);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('tracks error and rethrows', async () => {
    const action = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useClientAction(action));

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.run();
      } catch (e) {
        thrown = e;
      }
    });

    expect((thrown as Error).message).toBe('boom');
    expect(result.current.error?.message).toBe('boom');
  });

  it('reset clears state', async () => {
    const action = vi.fn().mockResolvedValue('x');
    const { result } = renderHook(() => useClientAction(action));
    await act(async () => {
      await result.current.run();
    });
    act(() => result.current.reset());
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
