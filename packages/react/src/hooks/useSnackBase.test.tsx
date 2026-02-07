import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useSnackBase, SnackBaseProvider } from '../SnackBaseContext';
import { SnackBaseClient } from '@snackbase/sdk';

// Mock SnackBaseClient
vi.mock('@snackbase/sdk', async () => {
    const actual = await vi.importActual('@snackbase/sdk');
    return {
        ...actual,
        SnackBaseClient: vi.fn(),
    };
});

describe('useSnackBase', () => {
    it('should throw error if used outside provider', () => {
        // Suppress console.error for this test
        const originalError = console.error;
        console.error = vi.fn();

        expect(() => {
            renderHook(() => useSnackBase());
        }).toThrow('useSnackBase must be used within a SnackBaseProvider');

        console.error = originalError;
    });

    it('should return client if used within provider', () => {
        const client = new SnackBaseClient({ baseUrl: 'http://localhost:3000' });
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <SnackBaseProvider client={client}>{children}</SnackBaseProvider>
        );

        const { result } = renderHook(() => useSnackBase(), { wrapper });
        expect(result.current).toBe(client);
    });
});
