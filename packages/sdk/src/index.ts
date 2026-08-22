export * from './core/client';
export * from './core/errors';
export * from './types/config';
export * from './types/auth';
export * from './types/user';
export * from './types/invitation';
export * from './types/api-key';
export * from './types/audit-log';
export * from './types/role';
export * from './types/collection';
export * from './types/record';
export * from './types/group';
export * from './types/dashboard';
export * from './types/admin';
export * from './types/email-template';
export * from './types/file';
export * from './types/realtime';
export * from './types/utils';
export * from './types/query';
export * from './types/migration';
export * from './types/webhook';
export * from './types/hook';
export * from './types/endpoint';
export * from './types/workflow';
export * from './types/job';
export * from './types/codelist';
export * from './core/query-builder';
export { CodelistService } from './core/codelist-service';
export { FunctionsService } from './core/functions-service';
export type {
  FunctionInvokeOptions,
  FunctionInvokeResult,
  FunctionItem,
  FunctionListResponse,
  FunctionVersion,
  FunctionBody,
  FunctionExecution,
  FunctionSecret,
  FunctionStats,
  CreateFunctionPayload,
  UpdateFunctionPayload,
  DeployPayload,
  TestPayload,
} from './core/functions-service';
export * from './utils/platform';

// Type alias for convenience
export type { SnackBaseClient as SnackBase } from './core/client';

// AuthManager is used by pocketbase-compat and other consumers that bridge auth state
export type { AuthManager } from './core/auth';
