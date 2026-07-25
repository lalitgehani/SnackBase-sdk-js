/**
 * Structural inventory / regression gate: @snackbase/react vs @snackbase/sdk
 *
 * This test encodes the post-parity contract:
 * - Closed app gaps (auth, records, realtime, files, invitations)
 * - Intentional non-wrappers for admin domains (use useSnackBase())
 * - Fail when SDK adds a new client `*Service` getter without updating EXPECTED_SERVICE_GETTERS
 *
 * When @snackbase/sdk adds a service getter:
 * 1. Add the getter name to EXPECTED_SERVICE_GETTERS below
 * 2. Decide: dedicated React hook OR intentional non-wrapper (document in INTENTIONAL_NON_WRAPPERS)
 * 3. Update README "SDK change process" if needed
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SnackBaseClient } from '@snackbase/sdk';
import * as reactExports from './index';

const reactSrcDir = dirname(fileURLToPath(import.meta.url));
const sdkCoreDir = join(reactSrcDir, '../../sdk/src/core');

function readSdk(file: string): string {
  return readFileSync(join(sdkCoreDir, file), 'utf8');
}

function readReact(rel: string): string {
  return readFileSync(join(reactSrcDir, rel), 'utf8');
}

/** Public async/sync method names on a service class (handles generic method syntax). */
function serviceMethodNames(source: string): string[] {
  const names: string[] = [];
  const re = /(?:async\s+)?([a-zA-Z][a-zA-Z0-9]*)\s*(?:<[^>]*>)?\s*\(/g;
  for (const line of source.split('\n')) {
    if (!/^\s{2}(async\s+)?[a-zA-Z]/.test(line)) continue;
    if (/^\s{2}(if|for|while|switch|return|throw|const|let|var|this\.|super)/.test(line)) continue;
    re.lastIndex = 0;
    const m = re.exec(line);
    if (!m) continue;
    const name = m[1];
    if (name === 'constructor') continue;
    if (!names.includes(name)) names.push(name);
  }
  return names;
}

function clientServiceGetters(clientSource: string): string[] {
  const names: string[] = [];
  const re = /get\s+([a-zA-Z]+)\(\)\s*:\s*(\w*Service)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clientSource)) !== null) {
    names.push(m[1]);
  }
  return names;
}

/** App-facing domains with dedicated React hooks */
const HOOK_COVERED_SERVICES = [
  'auth',
  'records',
  'realtime',
  'files',
  'invitations',
  'codelists',
] as const;

/**
 * Intentional non-wrappers — access via useSnackBase().
 * Do not add dedicated hooks without a new PRD.
 */
const INTENTIONAL_NON_WRAPPERS = [
  'admin',
  'migrations',
  'jobs',
  'webhooks',
  'hooks',
  'endpoints',
  'workflows',
  'macros',
  'collectionRules',
  'auditLogs',
  'dashboard',
  'emailTemplates',
  'collections',
  'accounts',
  'users',
  'groups',
  'apiKeys',
  'roles',
] as const;

const EXPECTED_SERVICE_GETTERS = [
  'auth',
  'accounts',
  'users',
  'collections',
  'records',
  'groups',
  'invitations',
  'apiKeys',
  'auditLogs',
  'roles',
  'collectionRules',
  'macros',
  'dashboard',
  'admin',
  'emailTemplates',
  'files',
  'realtime',
  'migrations',
  'webhooks',
  'hooks',
  'endpoints',
  'workflows',
  'jobs',
  'codelists',
] as const;

describe('SDK ↔ React parity inventory (regression gate)', () => {
  const clientSource = readSdk('client.ts');
  const authSource = readSdk('auth-service.ts');
  const recordSource = readSdk('record-service.ts');
  const realtimeSource = readSdk('realtime-service.ts');
  const useAuthSource = readReact('hooks/useAuth.ts');
  const useQuerySource = readReact('hooks/useQuery.ts');
  const useRecordSource = readReact('hooks/useRecord.ts');
  const useMutationSource = readReact('hooks/useMutation.ts');
  const useSubscriptionSource = readReact('hooks/useSubscription.ts');
  const useRealtimeSource = readReact('hooks/useRealtime.ts');
  const useFilesSource = readReact('hooks/useFiles.ts');
  const useInvitationSource = readReact('hooks/useInvitation.ts');
  const indexSource = readReact('index.ts');
  const providerSource = readReact('SnackBaseContext.tsx');

  it('SDK client service getters match allowlist (update allowlist when SDK adds services)', () => {
    const getters = clientServiceGetters(clientSource);
    expect(getters.sort()).toEqual([...EXPECTED_SERVICE_GETTERS].sort());

    const client = new SnackBaseClient({ baseUrl: 'http://localhost:8090' });
    for (const name of EXPECTED_SERVICE_GETTERS) {
      expect(client[name as keyof SnackBaseClient], `missing client.${name}`).toBeDefined();
    }

    // Every getter is either hook-covered or intentional non-wrapper
    for (const g of getters) {
      const covered =
        (HOOK_COVERED_SERVICES as readonly string[]).includes(g) ||
        (INTENTIONAL_NON_WRAPPERS as readonly string[]).includes(g);
      expect(covered, `${g} must be in HOOK_COVERED_SERVICES or INTENTIONAL_NON_WRAPPERS`).toBe(
        true
      );
    }
  });

  it('React package exports provider, domain hooks, helpers, and curated types', () => {
    const required = [
      'SnackBaseProvider',
      'useSnackBase',
      'useAuth',
      'useMutation',
      'useQuery',
      'useRecord',
      'useSubscription',
      'useRealtime',
      'useFiles',
      'useInvitation',
      'useClientAction',
      'useCodelistValues',
      'useCodelists',
      'useCodelistOverride',
      'TokenType',
    ];
    for (const name of required) {
      expect(reactExports, `missing export ${name}`).toHaveProperty(name);
    }

    expect(indexSource).toContain('./hooks/useAuth');
    expect(indexSource).toContain('./hooks/useRealtime');
    expect(indexSource).toContain('./hooks/useFiles');
    expect(indexSource).toContain('./hooks/useInvitation');
    expect(indexSource).toContain('./hooks/useClientAction');
    expect(indexSource).toContain('./hooks/useCodelistValues');
    expect(indexSource).toContain('./hooks/useCodelists');
    expect(indexSource).toContain('./hooks/useCodelistOverride');
    expect(indexSource).toContain('./types');
  });

  it('SnackBaseProvider supports client prop and config/baseUrl form', () => {
    expect(providerSource).toMatch(/client:\s*SnackBase/);
    expect(providerSource).toMatch(/baseUrl/);
    expect(providerSource).toContain('new SnackBaseClient');
    expect(providerSource).toMatch(/JSDoc|construct|pre-built|Pre-constructed/i);
  });

  it('useAuth wraps full app AuthService surface and syncs expiresAt / auth:error', () => {
    const authMethods = serviceMethodNames(authSource);
    const expectedAuth = [
      'login',
      'register',
      'refreshToken',
      'logout',
      'getCurrentUser',
      'forgotPassword',
      'resetPassword',
      'verifyEmail',
      'resendVerificationEmail',
      'sendVerification',
      'verifyResetToken',
      'getOAuthUrl',
      'handleOAuthCallback',
      'getSAMLUrl',
      'handleSAMLCallback',
      'getSAMLMetadata',
    ];
    for (const m of expectedAuth) {
      expect(authMethods, `AuthService missing ${m}`).toContain(m);
    }

    for (const m of ['login', 'logout', 'register', 'forgotPassword', 'resetPassword', 'getCurrentUser', 'verifyEmail']) {
      expect(useAuthSource).toMatch(new RegExp(`client\\.(auth\\.)?${m}`));
    }
    // Action named refreshAccessToken to avoid clashing with AuthState.refreshToken string field
    expect(useAuthSource).toContain('refreshAccessToken');
    expect(useAuthSource).toContain('client.refreshToken()');
    expect(useAuthSource).toMatch(/client\.auth\.(getOAuthUrl|handleOAuthCallback|sendVerification|verifyResetToken)/);
    expect(useAuthSource).toContain('auth:login');
    expect(useAuthSource).toContain('auth:logout');
    expect(useAuthSource).toContain('auth:refresh');
    expect(useAuthSource).toContain('auth:error');
    // No hard-coded expiresAt: null on login/refresh sync path
    expect(useAuthSource).toContain('readAuthState');
    expect(useAuthSource).not.toMatch(/expiresAt:\s*null,\s*\n\s*tokenType:\s*client\.tokenType/);
  });

  it('useQuery/useRecord/useMutation cover RecordService app methods', () => {
    const recordMethods = serviceMethodNames(recordSource);
    for (const m of [
      'list',
      'query',
      'get',
      'create',
      'update',
      'patch',
      'delete',
      'batchCreate',
      'batchUpdate',
      'batchDelete',
      'aggregate',
    ]) {
      expect(recordMethods, `RecordService missing ${m}`).toContain(m);
    }

    expect(useQuerySource).toContain('client.records.list');
    expect(useQuerySource).toMatch(/records\.query/);
    expect(useQuerySource).toContain('enabled');

    expect(useRecordSource).toContain('client.records.get');

    expect(useMutationSource).toContain('client.records.create');
    expect(useMutationSource).toContain('client.records.update');
    expect(useMutationSource).toContain('client.records.delete');
    expect(useMutationSource).toContain('records.patch');
    expect(useMutationSource).toContain('batchCreate');
    expect(useMutationSource).toContain('aggregate');
  });

  it('useSubscription + useRealtime cover RealTimeService connection lifecycle', () => {
    const rtMethods = serviceMethodNames(realtimeSource);
    for (const m of [
      'connect',
      'disconnect',
      'getState',
      'on',
      'off',
      'subscribe',
      'unsubscribe',
      'getSubscriptions',
    ]) {
      expect(rtMethods, `RealTimeService missing ${m}`).toContain(m);
    }

    expect(useSubscriptionSource).toContain('client.realtime.subscribe');
    expect(useSubscriptionSource).toContain('client.realtime.on');
    expect(useSubscriptionSource).toContain('client.realtime.unsubscribe');
    expect(useSubscriptionSource).toContain('realtime.connect');
    expect(useSubscriptionSource).toContain('getState');
    expect(useSubscriptionSource).toContain('acquireSubscription');

    expect(useRealtimeSource).toContain('realtime.connect');
    expect(useRealtimeSource).toContain('disconnect');
    expect(useRealtimeSource).toContain('getState');
  });

  it('files and invitations have dedicated hooks', () => {
    expect(useFilesSource).toContain('client.files.upload');
    expect(useFilesSource).toContain('getDownloadUrl');
    expect(useFilesSource).toContain('client.files.delete');
    expect(useInvitationSource).toContain('getPublic');
    expect(useInvitationSource).toContain('accept');
  });

  it('admin/automation domains remain intentional non-wrappers', () => {
    const hookDir = join(reactSrcDir, 'hooks');
    const hookFiles = readdirSync(hookDir).filter((f) => f.endsWith('.ts') && !f.includes('.test.'));
    const hookNames = hookFiles.map((f) => f.replace(/\.ts$/, ''));

    const forbidden = [
      'useWebhook',
      'useWorkflow',
      'useJob',
      'useAdmin',
      'useMigration',
      'useCollection',
      'useEndpoint',
      'useMacro',
      'useAudit',
      'useDashboard',
      'useEmailTemplate',
    ];
    for (const frag of forbidden) {
      expect(
        hookNames.some((h) => h.toLowerCase() === frag.toLowerCase()),
        `unexpected admin hook ${frag}`
      ).toBe(false);
    }

    expect(typeof reactExports.useSnackBase).toBe('function');
    expect(typeof reactExports.useClientAction).toBe('function');
  });

  it('every public hook has a dedicated unit test file', () => {
    const hookDir = join(reactSrcDir, 'hooks');
    const hookFiles = readdirSync(hookDir)
      .filter((f) => f.endsWith('.ts') && !f.includes('.test.'))
      .map((f) => f.replace(/\.ts$/, ''));
    const tests = readdirSync(hookDir).filter((f) => f.includes('.test.'));

    for (const hook of hookFiles) {
      expect(
        tests.some((t) => t.startsWith(hook + '.test.')),
        `missing test for ${hook}`
      ).toBe(true);
    }
  });

  it('no token/credential console logging in React package source', () => {
    const sources = [
      useAuthSource,
      useQuerySource,
      useMutationSource,
      useSubscriptionSource,
      useRealtimeSource,
      useFilesSource,
      useInvitationSource,
      providerSource,
      indexSource,
    ];
    for (const src of sources) {
      expect(src).not.toMatch(/console\.(log|debug|info)\([^)]*token/i);
      expect(src).not.toMatch(/console\.(log|debug|info)\([^)]*password/i);
    }
  });
});
