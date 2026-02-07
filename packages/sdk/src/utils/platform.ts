import { StorageBackend } from '../types/config';

/**
 * Detects the platform and returns the recommended storage backend.
 * - Web: localStorage
 * - React Native: asyncStorage
 */
export function getAutoDetectedStorage(): StorageBackend {
  // Check for React Native's global object
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return 'asyncStorage';
  }

  // Check for Web Browser environments
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return 'localStorage';
  }

  // Fallback to memory for Node.js or other environments without persistent storage
  return 'memory';
}
