import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useFiles } from './useFiles';
import { SnackBaseProvider } from '../SnackBaseContext';

describe('useFiles', () => {
  let client: any;

  beforeEach(() => {
    client = {
      files: {
        upload: vi.fn(),
        getDownloadUrl: vi.fn((path: string) => `https://cdn.example/${path}`),
        delete: vi.fn(),
      },
    };
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SnackBaseProvider client={client}>{children}</SnackBaseProvider>
  );

  it('upload success returns FileMetadata', async () => {
    const meta = { path: 'a.png', size: 10 };
    client.files.upload.mockResolvedValue(meta);
    const blob = new Blob(['x'], { type: 'text/plain' });

    const { result } = renderHook(() => useFiles(), { wrapper });
    let out: any;
    await act(async () => {
      out = await result.current.upload(blob);
    });
    expect(out).toEqual(meta);
    expect(client.files.upload).toHaveBeenCalledWith(blob, undefined);
  });

  it('getDownloadUrl is synchronous from SDK', () => {
    const { result } = renderHook(() => useFiles(), { wrapper });
    expect(result.current.getDownloadUrl('files/x')).toBe('https://cdn.example/files/x');
  });

  it('delete and upload failure set error and rethrow', async () => {
    client.files.delete.mockRejectedValue(new Error('nope'));
    const { result } = renderHook(() => useFiles(), { wrapper });

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.remove('x');
      } catch (e) {
        thrown = e;
      }
    });
    expect((thrown as Error).message).toBe('nope');
    expect(result.current.error?.message).toBe('nope');
  });
});
