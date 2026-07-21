/**
 * Structural coverage analysis: MCP tool surface vs SDK client services.
 *
 * Reads the real shipped source (SDK client getters + service methods, MCP
 * server registration + tool modules) and asserts the gap inventory stays
 * accurate. Fails when registration/wiring drifts without an intentional update.
 *
 * Allowlist updates: when product intentionally skips a method, add it to
 * INTENTIONAL_NON_EXPOSURE with a rationale comment and keep CI green.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MCP_SRC = resolve(HERE, '../src');
const SDK_CORE = resolve(HERE, '../../sdk/src/core');

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

/** Public async/sync methods on a service class body (2-space indent). */
function publicMethods(serviceSource: string): string[] {
  const names: string[] = [];
  const re = /^  (?:async )?([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:<[^>]*>)?\s*\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(serviceSource)) !== null) {
    const name = m[1];
    if (name === 'constructor') continue;
    names.push(name);
  }
  return [...new Set(names)];
}

/** Map of client getter name -> service file under packages/sdk/src/core */
const SDK_SERVICES: Record<string, string> = {
  auth: 'auth-service.ts',
  accounts: 'account-service.ts',
  users: 'user-service.ts',
  collections: 'collection-service.ts',
  records: 'record-service.ts',
  groups: 'group-service.ts',
  invitations: 'invitation-service.ts',
  apiKeys: 'api-key-service.ts',
  auditLogs: 'audit-log-service.ts',
  roles: 'role-service.ts',
  collectionRules: 'collection-rule-service.ts',
  macros: 'macro-service.ts',
  dashboard: 'dashboard-service.ts',
  admin: 'admin-service.ts',
  emailTemplates: 'email-template-service.ts',
  files: 'file-service.ts',
  realtime: 'realtime-service.ts',
  migrations: 'migration-service.ts',
  webhooks: 'webhook-service.ts',
  hooks: 'hook-service.ts',
  endpoints: 'endpoint-service.ts',
  workflows: 'workflow-service.ts',
  jobs: 'job-service.ts',
};

/** MCP tool module stem -> SDK client getter it wraps */
const MCP_TOOL_TO_SERVICE: Record<string, string> = {
  accounts: 'accounts',
  admin: 'admin',
  'api-keys': 'apiKeys',
  'audit-logs': 'auditLogs',
  'collection-rules': 'collectionRules',
  collections: 'collections',
  dashboard: 'dashboard',
  'email-templates': 'emailTemplates',
  endpoints: 'endpoints',
  files: 'files',
  groups: 'groups',
  hooks: 'hooks',
  invitations: 'invitations',
  jobs: 'jobs',
  macros: 'macros',
  migrations: 'migrations',
  records: 'records',
  roles: 'roles',
  users: 'users',
  webhooks: 'webhooks',
  workflows: 'workflows',
};

/**
 * Intentional non-exposure of SDK methods (rationale per entry).
 * Adding a new public SDK method without an MCP action or entry here fails tests.
 */
const INTENTIONAL_NON_EXPOSURE: Record<string, string[]> = {
  // Interactive auth (password/OAuth/SAML/register/reset) — MCP is API-key only
  auth: [
    'login',
    'register',
    'logout',
    'refresh',
    'getCurrentUser',
    'forgotPassword',
    'resetPassword',
    'verifyEmail',
    'resendVerification',
    'getOAuthUrl',
    'handleOAuthCallback',
    'getSAMLUrl',
    'handleSAMLCallback',
    // catch-all: entire auth service is non-exposed; residual methods listed via runtime filter
  ],
  // Realtime is WebSocket/SSE streaming — not request/response MCP tools
  realtime: [
    'connect',
    'disconnect',
    'getState',
    'on',
    'off',
    'subscribe',
    'unsubscribe',
    'getSubscriptions',
  ],
  // Fluent QueryBuilder factory — not a single RPC
  records: ['query'],
  // End-user browser invitation flows
  invitations: ['getPublic', 'accept'],
  // Multipart binary upload not safe over MCP without encoding design
  files: ['upload'],
};

/** Map MCP action snake_case names to SDK method names where they differ */
const ACTION_TO_SDK_METHOD: Record<string, Record<string, string>> = {
  accounts: { get_users: 'getUsers' },
  admin: {
    get_stats: 'getConfigurationStats',
    get_recent: 'getRecentConfigurations',
    list_system: 'listSystemConfigurations',
    list_account: 'listAccountConfigurations',
    get_values: 'getConfigurationValues',
    update_values: 'updateConfigurationValues',
    update_status: 'updateConfigurationStatus',
    create: 'createConfiguration',
    delete: 'deleteConfiguration',
    list_providers: 'listProviders',
    get_provider_schema: 'getProviderSchema',
    test_connection: 'testConnection',
    set_default: 'setConfigurationDefault',
    unset_default: 'unsetConfigurationDefault',
  },
  'api-keys': {},
  'audit-logs': {},
  'collection-rules': {
    validate: 'validateRule',
    test: 'testRule',
  },
  collections: { list_names: 'listNames' },
  dashboard: { get_stats: 'getStats' },
  'email-templates': {
    send_test: 'sendTest',
    list_logs: 'listLogs',
    get_log: 'getLog',
  },
  endpoints: { list_executions: 'listExecutions' },
  files: { get_download_url: 'getDownloadUrl' },
  groups: { add_member: 'addMember', remove_member: 'removeMember' },
  hooks: { list_executions: 'listExecutions' },
  invitations: {},
  jobs: {},
  macros: {},
  migrations: { get_current: 'getCurrent', get_history: 'getHistory' },
  records: {},
  roles: {},
  users: {
    set_password: 'setPassword',
    verify_email: 'verifyEmail',
    resend_verification: 'resendVerification',
  },
  webhooks: { list_deliveries: 'listDeliveries' },
  workflows: {
    list_instances: 'listInstances',
    get_instance: 'getInstance',
    cancel_instance: 'cancelInstance',
    retry_instance: 'retryInstance',
    resume_instance: 'resumeInstance',
  },
};

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function resolveSdkMethod(toolStem: string, action: string): string {
  const map = ACTION_TO_SDK_METHOD[toolStem] ?? {};
  if (map[action]) return map[action];
  return snakeToCamel(action);
}

function extractActions(toolSource: string): string[] {
  const m = toolSource.match(/enum:\s*\[([^\]]+)\]/);
  if (!m) return [];
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

function extractSdkCalls(toolSource: string): Array<{ service: string; method: string }> {
  const calls: Array<{ service: string; method: string }> = [];
  const re = /client\.(\w+)\.(\w+)\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(toolSource)) !== null) {
    calls.push({ service: m[1], method: m[2] });
  }
  return calls;
}

/** Pagination / param convention matrix consumed by structural tests */
const PAGINATION_STYLE: Record<string, 'limit_offset' | 'page_page_size' | 'none' | 'skip_limit'> = {
  accounts: 'page_page_size',
  users: 'page_page_size',
  groups: 'page_page_size',
  invitations: 'page_page_size',
  jobs: 'limit_offset',
  endpoints: 'limit_offset',
  hooks: 'limit_offset',
  workflows: 'limit_offset',
  webhooks: 'none', // list(); deliveries use limit_offset
  apiKeys: 'limit_offset',
  records: 'skip_limit',
  collections: 'page_page_size',
};

describe('SDK vs MCP coverage inventory (structural)', () => {
  const clientSource = read(join(SDK_CORE, 'client.ts'));
  const serverSource = read(join(MCP_SRC, 'server.ts'));
  const toolsIndex = read(join(MCP_SRC, 'tools', 'index.ts'));

  const clientGetters = [
    ...clientSource.matchAll(/get (\w+)\(\):\s*(\w+Service|\w+)/g),
  ]
    .map((m) => m[1])
    .filter((g) => g in SDK_SERVICES);

  const registeredToolNames = [
    ...serverSource.matchAll(/case '(snackbase_[^']+)':/g),
  ].map((m) => m[1]);

  const listToolsBlock = serverSource.match(
    /ListToolsRequestSchema[\s\S]*?tools:\s*\[([\s\S]*?)\]/,
  )?.[1] ?? '';
  const listedToolExports = [...listToolsBlock.matchAll(/tools\.(\w+)/g)].map(
    (m) => m[1],
  );

  const exportedModules = [
    ...toolsIndex.matchAll(/export \* from '\.\/([^']+)\.js'/g),
  ].map((m) => m[1]);

  const toolModules = readdirSync(join(MCP_SRC, 'tools'))
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && !f.endsWith('.test.ts'))
    .map((f) => f.replace(/\.ts$/, ''));

  it('SDK client exposes all 23 expected domain services', () => {
    expect(clientGetters.sort()).toEqual(Object.keys(SDK_SERVICES).sort());
    for (const getter of Object.keys(SDK_SERVICES)) {
      expect(clientSource).toMatch(new RegExp(`get ${getter}\\(\\)`));
    }
  });

  it('MCP tools/index exports every tool module on disk', () => {
    expect(exportedModules.sort()).toEqual(toolModules.sort());
  });

  it('server.ts registers all 21 domain tools (15 original + 5 automation + files)', () => {
    expect(registeredToolNames).toHaveLength(21);
    expect(listedToolExports).toHaveLength(21);

    const expectedRegistered = [
      'collections',
      'records',
      'collection-rules',
      'users',
      'groups',
      'roles',
      'accounts',
      'invitations',
      'api-keys',
      'admin',
      'dashboard',
      'audit-logs',
      'email-templates',
      'macros',
      'migrations',
      'webhooks',
      'hooks',
      'endpoints',
      'workflows',
      'jobs',
      'files',
    ].sort();

    const actualRegistered = registeredToolNames
      .map((n) => n.replace(/^snackbase_/, '').replace(/_/g, '-'))
      .sort();

    expect(actualRegistered).toEqual(expectedRegistered);

    // ListTools export names match CallTool cases
    expect(listedToolExports.length).toBe(registeredToolNames.length);
  });

  it('implemented_but_unregistered count is 0', () => {
    const registeredStems = new Set(
      registeredToolNames.map((n) => n.replace(/^snackbase_/, '').replace(/_/g, '-')),
    );
    const unregistered = exportedModules.filter((stem) => !registeredStems.has(stem));
    expect(unregistered).toEqual([]);
  });

  it('auth and realtime have no MCP tool modules (intentional)', () => {
    for (const missing of ['auth', 'realtime']) {
      expect(toolModules).not.toContain(missing);
      expect(exportedModules).not.toContain(missing);
      expect(serverSource).not.toMatch(new RegExp(`snackbase_${missing}`));
    }
    // files IS registered
    expect(toolModules).toContain('files');
    expect(serverSource).toContain('snackbase_files');
  });

  it('classifies every SDK service coverage status against registered MCP tools', () => {
    const registeredStems = new Set(
      registeredToolNames.map((n) => n.replace(/^snackbase_/, '').replace(/_/g, '-')),
    );

    const coverage: Record<
      string,
      { status: string; sdkMethods: string[]; mcpActions: string[]; missing: string[] }
    > = {};

    for (const [getter, file] of Object.entries(SDK_SERVICES)) {
      let methods = publicMethods(read(join(SDK_CORE, file)));

      // Apply intentional non-exposure filters
      const intentional = new Set(INTENTIONAL_NON_EXPOSURE[getter] ?? []);
      if (getter === 'auth') {
        // Entire auth service is intentional non-exposure
        coverage[getter] = {
          status: 'intentional_non_exposure',
          sdkMethods: methods,
          mcpActions: [],
          missing: [],
        };
        continue;
      }
      if (getter === 'realtime') {
        coverage[getter] = {
          status: 'intentional_non_exposure',
          sdkMethods: methods.filter((m) =>
            [
              'connect',
              'disconnect',
              'getState',
              'on',
              'off',
              'subscribe',
              'unsubscribe',
              'getSubscriptions',
            ].includes(m),
          ),
          mcpActions: [],
          missing: [],
        };
        continue;
      }

      methods = methods.filter((m) => !intentional.has(m));

      const toolStem = Object.entries(MCP_TOOL_TO_SERVICE).find(
        ([, svc]) => svc === getter,
      )?.[0];

      if (!toolStem) {
        coverage[getter] = {
          status: 'not_covered',
          sdkMethods: methods,
          mcpActions: [],
          missing: methods,
        };
        continue;
      }

      const toolPath = join(MCP_SRC, 'tools', `${toolStem}.ts`);
      const toolSrc = read(toolPath);
      const actions = extractActions(toolSrc);
      const mapped = actions.map((a) => resolveSdkMethod(toolStem, a));

      if (!registeredStems.has(toolStem)) {
        coverage[getter] = {
          status: 'implemented_but_unregistered',
          sdkMethods: methods,
          mcpActions: actions,
          missing: methods.filter((m) => !mapped.includes(m)),
        };
        continue;
      }

      const missing = methods.filter((m) => !mapped.includes(m));
      coverage[getter] = {
        status: missing.length === 0 ? 'fully_covered' : 'partially_covered',
        sdkMethods: methods,
        mcpActions: actions,
        missing,
      };
    }

    // Intentional full non-exposure
    expect(coverage.auth.status).toBe('intentional_non_exposure');
    expect(coverage.realtime.status).toBe('intentional_non_exposure');

    // Zero unregistered implementations
    for (const [svc, info] of Object.entries(coverage)) {
      expect(info.status, `${svc} should not be implemented_but_unregistered`).not.toBe(
        'implemented_but_unregistered',
      );
    }

    // Fully covered automation + core services
    for (const full of [
      'accounts',
      'collections',
      'groups',
      'roles',
      'collectionRules',
      'macros',
      'migrations',
      'auditLogs',
      'dashboard',
      'records',
      'webhooks',
      'hooks',
      'endpoints',
      'workflows',
      'jobs',
      'admin',
      'users',
      'apiKeys',
      'emailTemplates',
      'files',
    ] as const) {
      expect(coverage[full].status, `${full}: missing ${coverage[full].missing.join(',')}`).toBe(
        'fully_covered',
      );
    }

    // Invitations: admin methods only; getPublic/accept intentional
    expect(coverage.invitations.status).toBe('fully_covered');
    expect(coverage.invitations.missing).toEqual([]);
    expect(INTENTIONAL_NON_EXPOSURE.invitations).toEqual(
      expect.arrayContaining(['getPublic', 'accept']),
    );

    // Files upload intentional
    expect(INTENTIONAL_NON_EXPOSURE.files).toContain('upload');
    expect(coverage.files.mcpActions).toEqual(
      expect.arrayContaining(['get_download_url', 'delete']),
    );

    // records.query intentional
    expect(INTENTIONAL_NON_EXPOSURE.records).toContain('query');
  });

  it('enforces corrected signature/param contracts (no known bad patterns)', () => {
    const wfService = read(join(SDK_CORE, 'workflow-service.ts'));
    expect(wfService).toMatch(/async getInstance\(instanceId: string\)/);
    expect(wfService).toMatch(/async cancelInstance\(instanceId: string\)/);
    expect(wfService).toMatch(/async retryInstance\(instanceId: string\)/);
    expect(wfService).toMatch(/async resumeInstance\(instanceId: string\)/);
    expect(wfService).toMatch(/async toggle\(id: string\)/);

    const wfTool = read(join(MCP_SRC, 'tools', 'workflows.ts'));
    // Single-arg instance ops — no two-arg calls
    expect(wfTool).not.toMatch(/workflows\.getInstance\([^)]+,\s*[^)]+\)/);
    expect(wfTool).not.toMatch(/workflows\.cancelInstance\([^)]+,\s*[^)]+\)/);
    expect(wfTool).not.toMatch(/workflows\.retryInstance\([^)]+,\s*[^)]+\)/);
    expect(wfTool).toMatch(/workflows\.getInstance\(instance_id\)/);
    expect(wfTool).toMatch(/workflows\.cancelInstance\(instance_id\)/);
    expect(wfTool).toMatch(/workflows\.retryInstance\(instance_id\)/);
    expect(wfTool).toMatch(/workflows\.resumeInstance\(instance_id\)/);
    expect(wfTool).toMatch(/workflows\.toggle\(workflow_id\)/);
    expect(extractActions(wfTool)).toEqual(
      expect.arrayContaining(['toggle', 'resume_instance']),
    );
    // list uses offset not skip
    expect(wfTool).toMatch(/workflows\.list\(\{[\s\S]*?offset/);
    expect(wfTool).not.toMatch(/workflows\.list\(\{\s*limit,\s*skip\s*\}\)/);

    // webhooks create: collection required, no name
    const whServiceTypes = read(resolve(SDK_CORE, '../types/webhook.ts'));
    expect(whServiceTypes).toMatch(/interface WebhookCreate[\s\S]*?collection: string/);
    const whTool = read(join(MCP_SRC, 'tools', 'webhooks.ts'));
    expect(whTool).toMatch(/url,\s*collection,\s*and events are required/);
    expect(whTool).toMatch(/webhooks\.create\(\{[\s\S]*?collection/);
    expect(whTool).not.toMatch(/create\(\{\s*name,\s*url,\s*events/);
    expect(whTool).toMatch(/webhooks\.list\(\)/);
    expect(whTool).not.toMatch(/webhooks\.list\(\{\s*page/);
    expect(whTool).toMatch(/listDeliveries\(webhook_id,\s*\{\s*limit,\s*offset\s*\}\)/);

    // jobs: limit/offset, correct status enum — no page/per_page
    const jobsTool = read(join(MCP_SRC, 'tools', 'jobs.ts'));
    expect(jobsTool).not.toMatch(/per_page/);
    expect(jobsTool).not.toMatch(/page:/);
    expect(jobsTool).toMatch(/limit,\s*offset/);
    expect(jobsTool).toMatch(/'retrying'/);
    expect(jobsTool).toMatch(/'dead'/);

    // endpoints: limit/offset
    const epTool = read(join(MCP_SRC, 'tools', 'endpoints.ts'));
    expect(epTool).not.toMatch(/page_size/);
    expect(epTool).toMatch(/limit,\s*offset/);
    expect(epTool).toMatch(/auth_required/);
    expect(epTool).toMatch(/response_template/);

    // admin create: display_name + config
    const adminTool = read(join(MCP_SRC, 'tools', 'admin.ts'));
    expect(adminTool).toMatch(/display_name/);
    expect(adminTool).toMatch(/createConfiguration\(\{[\s\S]*?display_name/);
    expect(adminTool).not.toMatch(/createConfiguration\(\{[\s\S]*?\bname,/);
    expect(adminTool).toMatch(/deleteConfiguration/);
    expect(adminTool).toMatch(/getProviderSchema/);

    // invitations status_filter
    const invTool = read(join(MCP_SRC, 'tools', 'invitations.ts'));
    expect(invTool).toMatch(/status_filter/);
    expect(invTool).not.toMatch(/status:\s*status as any/);

    // users create role_id (not string role)
    const usersTool = read(join(MCP_SRC, 'tools', 'users.ts'));
    expect(usersTool).toMatch(/role_id:\s*Number\(role_id\)/);
    expect(usersTool).toMatch(/resendVerification/);
    const createBlock = usersTool.match(
      /case 'create':[\s\S]*?users\.create\((\{[\s\S]*?\})\)/,
    )?.[1];
    expect(createBlock).toBeTruthy();
    expect(createBlock).toMatch(/role_id/);
    expect(createBlock).not.toMatch(/(?<![a-z_])role(?!_id)/);

    // macros test params array
    const macrosTool = read(join(MCP_SRC, 'tools', 'macros.ts'));
    expect(macrosTool).toMatch(/params:\s*\{\s*type:\s*'array'/);

    // dashboard range
    const dashTool = read(join(MCP_SRC, 'tools', 'dashboard.ts'));
    expect(dashTool).toMatch(/range/);
    expect(dashTool).toMatch(/getStats\(range \? \{ range \}/);

    // records include_count
    const recTool = read(join(MCP_SRC, 'tools', 'records.ts'));
    expect(recTool).toMatch(/include_count/);

    // pagination convention table present
    expect(PAGINATION_STYLE.jobs).toBe('limit_offset');
    expect(PAGINATION_STYLE.invitations).toBe('page_page_size');
  });

  it('every registered tool handler invokes the matching SDK service methods', () => {
    for (const stem of exportedModules) {
      if (!(stem in MCP_TOOL_TO_SERVICE)) continue;
      const toolSrc = read(join(MCP_SRC, 'tools', `${stem}.ts`));
      const expectedService = MCP_TOOL_TO_SERVICE[stem];
      const calls = extractSdkCalls(toolSrc);
      expect(calls.length, stem).toBeGreaterThan(0);
      for (const c of calls) {
        expect(c.service, `${stem} call ${c.method}`).toBe(expectedService);
      }
      const actions = extractActions(toolSrc);
      for (const action of actions) {
        expect(toolSrc).toContain(`case '${action}':`);
      }
    }
  });

  it('documents intentional non-exposure candidates with rationale', () => {
    const rt = read(join(SDK_CORE, 'realtime-service.ts'));
    expect(rt).toMatch(/WebSocket|EventSource|subscribe/);

    const auth = read(join(SDK_CORE, 'auth-service.ts'));
    expect(auth).toMatch(/getOAuthUrl|handleOAuthCallback|getSAMLUrl/);

    const clientFactory = read(join(MCP_SRC, 'client.ts'));
    expect(clientFactory).toMatch(/SNACKBASE_API_KEY/);
    expect(clientFactory).not.toMatch(/login|password/);

    const inv = read(join(SDK_CORE, 'invitation-service.ts'));
    expect(inv).toMatch(/getPublic|accept/);

    const rec = read(join(SDK_CORE, 'record-service.ts'));
    expect(rec).toMatch(/query<.*>\(collection: string\):\s*QueryBuilder/);

    const filesTool = read(join(MCP_SRC, 'tools', 'files.ts'));
    expect(filesTool).toMatch(/intentional non-exposure|Upload is not exposed/i);
    expect(filesTool).not.toMatch(/client\.files\.upload/);

    // Allowlist has rationale keys
    expect(Object.keys(INTENTIONAL_NON_EXPOSURE).sort()).toEqual(
      expect.arrayContaining(['auth', 'realtime', 'records', 'invitations', 'files']),
    );
  });

  it('collections FieldType enum and create body match SDK CollectionCreate (no invented fields)', () => {
    const colTypes = read(resolve(SDK_CORE, '../types/collection.ts'));
    const fieldTypeBlock = colTypes.match(/export type FieldType\s*=\s*([\s\S]*?);/)?.[1] ?? '';
    const sdkFieldTypes = [...fieldTypeBlock.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
    expect(sdkFieldTypes).toEqual(
      [
        'text',
        'number',
        'boolean',
        'datetime',
        'email',
        'url',
        'json',
        'reference',
        'file',
        'date',
        'computed',
      ].sort(),
    );

    // CollectionCreate / CollectionUpdate must not include has_public_access
    expect(colTypes).toMatch(/interface CollectionCreate[\s\S]*?delete_rule\?:/);
    const createIface = colTypes.match(/export interface CollectionCreate \{([\s\S]*?)\}/)?.[1] ?? '';
    const updateIface = colTypes.match(/export interface CollectionUpdate \{([\s\S]*?)\}/)?.[1] ?? '';
    expect(createIface).not.toMatch(/has_public_access/);
    expect(updateIface).not.toMatch(/has_public_access/);

    const colTool = read(join(MCP_SRC, 'tools', 'collections.ts'));
    // Schema enum must include every SDK FieldType and exclude obsolete types
    for (const t of sdkFieldTypes) {
      expect(colTool, `MCP schema missing FieldType ${t}`).toContain(`'${t}'`);
    }
    for (const obsolete of ['phone', 'select', 'multi_select', 'relation']) {
      expect(colTool, `MCP schema still lists obsolete type ${obsolete}`).not.toMatch(
        new RegExp(`enum:\\s*\\[[^\\]]*\\b'${obsolete}'`),
      );
      // also ensure not listed as a field type string in the enum array
      expect(colTool).not.toMatch(
        new RegExp(`'(?:text'[^\\]]*?)?'${obsolete}'`),
      );
    }
    // Stronger obsolete check on the type enum block only
    const typeEnum = colTool.match(/type:\s*\{\s*type:\s*'string',\s*enum:\s*\[([^\]]+)\]/)?.[1] ?? '';
    expect(typeEnum).toBeTruthy();
    for (const t of sdkFieldTypes) {
      expect(typeEnum).toContain(`'${t}'`);
    }
    for (const obsolete of ['phone', 'select', 'multi_select', 'relation']) {
      expect(typeEnum).not.toContain(`'${obsolete}'`);
    }

    // Schema must not accept has_public_access as an input property
    expect(colTool).not.toMatch(/has_public_access:\s*\{/);
    // Handler must not forward has_public_access or use as any casts
    expect(colTool).not.toMatch(/collections\.(create|update)\([\s\S]*has_public_access/);
    expect(colTool).not.toMatch(/as any/);
    const createCall = colTool.match(/collections\.create\((\{[\s\S]*?\})\);/)?.[1] ?? '';
    const updateCall = colTool.match(/collections\.update\(collection_id,\s*(\{[\s\S]*?\})\);/)?.[1] ?? '';
    expect(createCall).toMatch(/name,/);
    expect(createCall).toMatch(/fields,/);
    expect(createCall).not.toMatch(/has_public_access/);
    expect(updateCall).not.toMatch(/has_public_access/);
  });

  it('fails classification if a new public service method has no MCP action or allowlist', () => {
    // Mutation-style check: for each covered service, every public method is either mapped or allowlisted
    for (const [getter, file] of Object.entries(SDK_SERVICES)) {
      if (getter === 'auth' || getter === 'realtime') continue;
      const methods = publicMethods(read(join(SDK_CORE, file)));
      const intentional = new Set(INTENTIONAL_NON_EXPOSURE[getter] ?? []);
      const toolStem = Object.entries(MCP_TOOL_TO_SERVICE).find(([, svc]) => svc === getter)?.[0];
      if (!toolStem) {
        // Must be allowlisted entirely or this fails
        expect(methods.every((m) => intentional.has(m)), `${getter} has unallowlisted methods`).toBe(
          true,
        );
        continue;
      }
      const actions = extractActions(read(join(MCP_SRC, 'tools', `${toolStem}.ts`)));
      const mapped = new Set(actions.map((a) => resolveSdkMethod(toolStem, a)));
      for (const method of methods) {
        if (intentional.has(method)) continue;
        expect(mapped.has(method), `${getter}.${method} missing from MCP and allowlist`).toBe(true);
      }
    }
  });
});
