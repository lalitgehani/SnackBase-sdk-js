import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useAuth } from './useAuth';
import { SnackBaseProvider } from '../SnackBaseContext';
import { SnackBaseClient } from '@snackbase/sdk';

// Mock everything needed
vi.mock('@snackbase/sdk', async () => {
    const actual = await vi.importActual('@snackbase/sdk');
    return {
        ...actual,
        SnackBaseClient: vi.fn(),
    };
});

describe('useAuth', () => {
    let client: any;
    let mockUnsubscribe: any;

    beforeEach(() => {
        mockUnsubscribe = vi.fn();
        client = {
            user: null,
            account: null,
            auth: {
                // AuthService methods
            },
            internalAuthManager: {
                token: null,
                refreshToken: null,
            },
            isAuthenticated: false,
            tokenType: 'jwt',
            on: vi.fn().mockReturnValue(mockUnsubscribe),
            login: vi.fn(),
            logout: vi.fn(),
            register: vi.fn(),
            forgotPassword: vi.fn(),
            resetPassword: vi.fn(),
        };

        // Mock getters
        Object.defineProperty(client, 'isSuperadmin', {
            get: vi.fn().mockReturnValue(false),
            configurable: true
        });
        Object.defineProperty(client, 'isApiKeySession', {
            get: vi.fn().mockReturnValue(false),
            configurable: true
        });
        Object.defineProperty(client, 'isPersonalTokenSession', {
            get: vi.fn().mockReturnValue(false),
            configurable: true
        });
        Object.defineProperty(client, 'isOAuthSession', {
            get: vi.fn().mockReturnValue(false),
            configurable: true
        });
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SnackBaseProvider client={client}>{children}</SnackBaseProvider>
    );

    it('should return initial state', () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isSuperadmin).toBe(false);
        expect(result.current.isApiKeySession).toBe(false);
        expect(result.current.tokenType).toBe('jwt');
    });

    it('should subscribe to auth events', () => {
        renderHook(() => useAuth(), { wrapper });

        expect(client.on).toHaveBeenCalledWith('auth:login', expect.any(Function));
        expect(client.on).toHaveBeenCalledWith('auth:refresh', expect.any(Function));
        expect(client.on).toHaveBeenCalledWith('auth:logout', expect.any(Function));
    });

    it('should update state on login event', () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        // Simulate login event
        const loginHandler = client.on.mock.calls.find((call: any) => call[0] === 'auth:login')[1];

        const newState = {
            user: { id: '123', email: 'test@example.com' },
            isAuthenticated: true,
            token: 'jwt-token',
            tokenType: 'jwt'
        };

        act(() => {
            loginHandler(newState);
        });

        expect(result.current.user).toEqual(newState.user);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.tokenType).toBe('jwt');
    });

    it('should reflect superadmin status from client', () => {
        const spy = Object.getOwnPropertyDescriptor(client, 'isSuperadmin')?.get as any;
        spy.mockReturnValue(true);
        const { result } = renderHook(() => useAuth(), { wrapper });
        expect(result.current.isSuperadmin).toBe(true);
    });

    it('should reflect api key session status from client', () => {
        const spy = Object.getOwnPropertyDescriptor(client, 'isApiKeySession')?.get as any;
        spy.mockReturnValue(true);
        const { result } = renderHook(() => useAuth(), { wrapper });
        expect(result.current.isApiKeySession).toBe(true);
    });

    it('should call client.login when login is called', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        const credentials = { email: 'test@example.com', password: 'password' };

        await act(async () => {
            await result.current.login(credentials);
        });

        expect(client.login).toHaveBeenCalledWith(credentials);
    });
});
