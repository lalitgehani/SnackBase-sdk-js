// Phase 1 exports — types, errors, and utilities
export type {
  RecordModel,
  ListResult,
  RecordAuthResponse,
  AuthMethodsList,
  RecordSubscription,
  HealthCheckResponse,
  FileOptions,
  BatchRequestResult,
} from './types.js';

export { ClientResponseError, NotSupportedError, wrapThrow } from './errors.js';

export {
  toRecordModel,
  fromRecordModel,
  toListResult,
  toSnackListParams,
} from './normalizer.js';

export { rewriteFilterFields, rewriteSortField, pbFilter } from './filter-rewriter.js';
