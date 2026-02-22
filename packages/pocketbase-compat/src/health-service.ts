/**
 * HealthServiceCompat — `pb.health.*` bridge for @snackbase/pocketbase-compat.
 *
 * SnackBase has no `/health` endpoint exposed in the SDK yet, so `check()`
 * returns a synthetic response that satisfies the PocketBase contract.
 *
 * Phase 5.
 */

import type { HealthCheckResponse } from './types.js';

export class HealthServiceCompat {
  /**
   * Check API health.
   *
   * Returns a synthetic `{ code: 200, message: 'API is healthy.', data: {} }`.
   * When SnackBase adds a real health endpoint to its SDK this can be updated
   * to make an actual HTTP call.
   */
  async check(_opts?: Record<string, any>): Promise<HealthCheckResponse> {
    return {
      code: 200,
      message: 'API is healthy.',
      data: {},
    };
  }
}
