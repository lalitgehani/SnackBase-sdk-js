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

// Phase 2 exports — client shell, record CRUD, collection service
export { PocketBaseCompat, PocketBaseCompat as PocketBase } from './client.js';
export { RecordServiceCompat } from './record-service.js';
export { CollectionServiceCompat } from './collection-service.js';
export type { SendOptions, FullListOptions } from './record-service.js';

// Default export — mirrors `import PocketBase from 'pocketbase'`
export { PocketBaseCompat as default } from './client.js';
