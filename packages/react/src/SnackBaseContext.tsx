import React, { createContext, useContext, useMemo, useRef } from 'react';
import { SnackBaseClient } from '@snackbase/sdk';
import type { SnackBase, SnackBaseConfig } from '@snackbase/sdk';

const SnackBaseContext = createContext<SnackBase | null>(null);

/** Provider with a pre-built client (recommended for full control). */
export interface SnackBaseProviderWithClient {
  /**
   * Pre-constructed SnackBase client.
   * Construct once (e.g. module scope or useMemo) and pass it in:
   * `const client = new SnackBaseClient({ baseUrl: '...' })`
   */
  client: SnackBase;
  children: React.ReactNode;
}

/**
 * Provider that constructs a SnackBaseClient from config.
 * Client identity is stable when config fields are unchanged.
 */
export type SnackBaseProviderWithConfig = SnackBaseConfig & {
  children: React.ReactNode;
};

export type SnackBaseProviderProps =
  | SnackBaseProviderWithClient
  | SnackBaseProviderWithConfig;

function hasClient(props: SnackBaseProviderProps): props is SnackBaseProviderWithClient {
  return 'client' in props && (props as SnackBaseProviderWithClient).client != null;
}

function configFromProps(props: SnackBaseProviderWithConfig): SnackBaseConfig {
  const { children: _children, ...rest } = props;
  // If someone passes both client and baseUrl, prefer client path via hasClient
  const { client: _client, ...config } = rest as SnackBaseConfig & { client?: SnackBase };
  return config as SnackBaseConfig;
}

/**
 * Provides a SnackBase client to the React tree.
 *
 * **Client form (recommended):** construct `SnackBaseClient` yourself and pass `{ client }`.
 * **Config form:** pass `{ baseUrl, ... }` and the provider creates a stable client instance.
 *
 * @example
 * ```tsx
 * const client = new SnackBaseClient({ baseUrl: 'http://localhost:8000' });
 * <SnackBaseProvider client={client}><App /></SnackBaseProvider>
 *
 * // or
 * <SnackBaseProvider baseUrl="http://localhost:8000"><App /></SnackBaseProvider>
 * ```
 */
export const SnackBaseProvider: React.FC<SnackBaseProviderProps> = (props) => {
  const { children } = props;

  const configKeyRef = useRef<string>('');
  const configClientRef = useRef<SnackBase | null>(null);

  // Stable serialization of config for memo deps when not using client prop
  const configKey = hasClient(props)
    ? null
    : JSON.stringify(configFromProps(props as SnackBaseProviderWithConfig));

  const client = useMemo(() => {
    if (hasClient(props)) {
      return props.client;
    }

    const config = configFromProps(props as SnackBaseProviderWithConfig);
    const key = configKey ?? JSON.stringify(config);
    if (configClientRef.current && configKeyRef.current === key) {
      return configClientRef.current;
    }
    configKeyRef.current = key;
    configClientRef.current = new SnackBaseClient(config);
    return configClientRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- configKey tracks config identity
  }, [hasClient(props) ? (props as SnackBaseProviderWithClient).client : null, configKey]);

  return (
    <SnackBaseContext.Provider value={client}>
      {children}
    </SnackBaseContext.Provider>
  );
};

/**
 * Access the SnackBase client from context.
 * Use for admin/superadmin domains that have no dedicated hook:
 * `const client = useSnackBase(); await client.workflows.list();`
 */
export const useSnackBase = (): SnackBase => {
  const context = useContext(SnackBaseContext);
  if (!context) {
    throw new Error('useSnackBase must be used within a SnackBaseProvider');
  }
  return context;
};
