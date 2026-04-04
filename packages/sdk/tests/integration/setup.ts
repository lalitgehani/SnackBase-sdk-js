/**
 * Integration test setup and utilities
 */

import { SnackBaseClient } from '../../src/core/client';

// Test configuration
export const TEST_CONFIG = {
  baseUrl: process.env.SNACKBASE_URL || 'http://localhost:8090',
  apiKey: process.env.SNACKBASE_API_KEY,
  testEmail: process.env.SNACKBASE_TEST_EMAIL || `test-${Date.now()}@example.com`,
  testPassword: process.env.SNACKBASE_TEST_PASSWORD || 'TestPass123!',
  timeout: 30000,
};

// Track resources for cleanup
const testResources = {
  users: new Set<string>(),
  collections: new Set<string>(),
  records: new Map<string, Set<string>>(), // collection -> record ids
  accounts: new Set<string>(),
};

/**
 * Create a test client instance
 */
export function createTestClient() {
  return new SnackBaseClient({
    baseUrl: TEST_CONFIG.baseUrl,
    apiKey: TEST_CONFIG.apiKey,
    enableLogging: false,
  });
}

/**
 * Create a unique test email
 */
export function createTestEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Create a unique test account name
 */
export function createTestAccountName() {
  return `Account ${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Create a unique test collection name
 */
export function createTestCollectionName() {
  return `test_collection_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Register a test user for cleanup
 */
export function trackUser(userId: string) {
  testResources.users.add(userId);
}

/**
 * Register a test account for cleanup
 */
export function trackAccount(accountId: string) {
  testResources.accounts.add(accountId);
}

/**
 * Register a test collection for cleanup
 */
export function trackCollection(collectionId: string) {
  testResources.collections.add(collectionId);
}

/**
 * Manually verify a user's email (requires API key)
 */
export async function verifyUser(userId: string) {
  if (TEST_CONFIG.apiKey) {
    const adminClient = new SnackBaseClient({
      baseUrl: TEST_CONFIG.baseUrl,
      apiKey: TEST_CONFIG.apiKey,
    });
    await adminClient.users.verifyEmail(userId);
  }
}

/**
 * Register a test record for cleanup
 */
export function trackRecord(collectionId: string, recordId: string) {
  if (!testResources.records.has(collectionId)) {
    testResources.records.set(collectionId, new Set());
  }
  testResources.records.get(collectionId)!.add(recordId);
}

/**
 * Clean up all tracked resources (parallelized within each resource type)
 */
export async function cleanupTestResources(client: SnackBaseClient) {
  const errors: Error[] = [];

  const safeDelete = async (fn: () => Promise<any>) => {
    try {
      await fn();
    } catch (error) {
      errors.push(error as Error);
    }
  };

  // Clean up records (parallel within type)
  const recordDeletes: Promise<void>[] = [];
  for (const [collectionId, recordIds] of testResources.records.entries()) {
    for (const recordId of recordIds) {
      recordDeletes.push(safeDelete(() => client.records.delete(collectionId, recordId)));
    }
  }
  await Promise.all(recordDeletes);
  testResources.records.clear();

  // Clean up collections (parallel)
  await Promise.all(
    [...testResources.collections].map((id) => safeDelete(() => client.collections.delete(id)))
  );
  testResources.collections.clear();

  // Clean up users (parallel)
  await Promise.all(
    [...testResources.users].map((id) => safeDelete(() => client.users.delete(id)))
  );
  testResources.users.clear();

  // Clean up accounts (after users, since users belong to accounts)
  await Promise.all(
    [...testResources.accounts].map((id) => safeDelete(() => client.accounts.delete(id)))
  );
  testResources.accounts.clear();

  if (errors.length > 0) {
    console.warn(`${errors.length} errors occurred during cleanup:`);
    errors.forEach((error) => console.warn(error.message));
  }
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = TEST_CONFIG.timeout,
  interval = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Skip tests if running in CI without credentials
 */
export function skipIfNoCredentials() {
  if (!TEST_CONFIG.apiKey && process.env.CI) {
    return true;
  }
  return false;
}
