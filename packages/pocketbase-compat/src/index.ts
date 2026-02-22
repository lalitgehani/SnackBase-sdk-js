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

// Phase 3 exports — auth store
export { AuthStoreCompat } from './auth-store.js';

// Phase 4 exports — realtime subscriptions
export { RealtimeServiceCompat } from './realtime-service.js';

// Phase 5 exports — file service, health, batch
export { FileServiceCompat } from './file-service.js';
export { HealthServiceCompat } from './health-service.js';
export { BatchServiceCompat, SubBatchServiceCompat } from './batch-service.js';

// Default export — mirrors `import PocketBase from 'pocketbase'`
export { PocketBaseCompat as default } from './client.js';
