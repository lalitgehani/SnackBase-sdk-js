import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useQuery } from './useQuery';
import { SnackBaseProvider } from '../SnackBaseContext';

describe('useQuery', () => {
    let client: any;

    beforeEach(() => {
        client = {
            records: {
                list: vi.fn(),
            },
        };
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SnackBaseProvider client={client}>{children}</SnackBaseProvider>
    );

    it('should fetch data on mount', async () => {
        const mockData = { items: [], total: 0, skip: 0, limit: 10 };
        client.records.list.mockResolvedValue(mockData);

        const { result } = renderHook(() => useQuery('posts'), { wrapper });

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual(mockData);
        expect(client.records.list).toHaveBeenCalledWith('posts', undefined);
    });

    it('should handle errors', async () => {
        const error = new Error('Fetch failed');
        client.records.list.mockRejectedValue(error);

        const { result } = renderHook(() => useQuery('posts'), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toEqual(error);
    });

    it('should refetch when params change', async () => {
        const mockData = { items: [], total: 0, skip: 0, limit: 10 };
        client.records.list.mockResolvedValue(mockData);

        const { result, rerender } = renderHook(
            (props) => useQuery('posts', props),
            { wrapper, initialProps: { limit: 10 } }
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        expect(client.records.list).toHaveBeenCalledWith('posts', { limit: 10 });

        // Change params
        rerender({ limit: 20 });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(client.records.list).toHaveBeenCalledWith('posts', { limit: 20 });
    });
});
