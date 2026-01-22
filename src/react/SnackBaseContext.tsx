import React, { createContext, useContext, useMemo } from 'react';
import type { SnackBase } from '../index';

const SnackBaseContext = createContext<SnackBase | null>(null);

export interface SnackBaseProviderProps {
    client: SnackBase;
    children: React.ReactNode;
}

export const SnackBaseProvider: React.FC<SnackBaseProviderProps> = ({
    client,
    children,
}) => {
    return (
        <SnackBaseContext.Provider value={client}>
            {children}
        </SnackBaseContext.Provider>
    );
};

export const useSnackBase = (): SnackBase => {
    const context = useContext(SnackBaseContext);
    if (!context) {
        throw new Error('useSnackBase must be used within a SnackBaseProvider');
    }
    return context;
};
