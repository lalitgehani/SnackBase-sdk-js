/**
 * Integration test setup and utilities
 */

import { beforeAll, afterAll } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';

// Test configuration
export const TEST_CONFIG = {
  baseUrl: process.env.SNACKBASE_URL || 'http://localhost:8090',
  apiKey: process.env.SNACKBASE_API_KEY,
  testEmail: process.env.SNACKBASE_TEST_EMAIL || `test-${Date.now()}@example.com`,
  testPassword: process.env.SNACKBASE_TEST_PASSWORD || 'testpassword123',
  timeout: 30000,
};

// Track resources for cleanup
const testResources = {
  users: new Set<string>(),
  collections: new Set<string>(),
  records: new Map<string, Set<string>>(), // collection -> record ids
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
 * Register a test collection for cleanup
 */
export function trackCollection(collectionId: string) {
  testResources.collections.add(collectionId);
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
 * Clean up all tracked resources
 */
export async function cleanupTestResources(client: SnackBaseClient) {
  const errors: Error[] = [];

  // Clean up records
  for (const [collectionId, recordIds] of testResources.records.entries()) {
    for (const recordId of recordIds) {
      try {
        await client.records.delete(collectionId, recordId);
      } catch (error) {
        errors.push(error as Error);
      }
    }
  }
  testResources.records.clear();

  // Clean up collections
  for (const collectionId of testResources.collections) {
    try {
      await client.collections.delete(collectionId);
    } catch (error) {
      errors.push(error as Error);
    }
  }
  testResources.collections.clear();

  // Clean up users
  for (const userId of testResources.users) {
    try {
      await client.users.delete(userId);
    } catch (error) {
      errors.push(error as Error);
    }
  }
  testResources.users.clear();

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
 * Setup integration tests
 */
export function setupIntegrationTests() {
  let client: SnackBaseClient;

  beforeAll(() => {
    client = createTestClient();
  });

  afterAll(async () => {
    await cleanupTestResources(client);
  });

  return { client, TEST_CONFIG };
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
