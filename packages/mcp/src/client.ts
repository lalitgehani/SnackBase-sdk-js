import { SnackBaseClient } from '@snackbase/sdk';

let clientInstance: SnackBaseClient | null = null;

/**
 * Factory function to create or return the singleton SnackBaseClient instance.
 * Reads configuration from environment variables.
 */
export function createClient(): SnackBaseClient {
  if (clientInstance) {
    return clientInstance;
  }

  const baseUrl = process.env.SNACKBASE_URL;
  const apiKey = process.env.SNACKBASE_API_KEY;

  if (!baseUrl) {
    throw new Error('SNACKBASE_URL environment variable is required');
  }

  if (!apiKey) {
    throw new Error('SNACKBASE_API_KEY environment variable is required');
  }

  clientInstance = new SnackBaseClient({
    baseUrl,
    apiKey,
  });

  return clientInstance;
}
