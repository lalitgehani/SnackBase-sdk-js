export interface AuthStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

export class MemoryStorage implements AuthStorage {
  private storage: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }
}

export class LocalStorageBackend implements AuthStorage {
  getItem(key: string): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  }
}

export class SessionStorageBackend implements AuthStorage {
  getItem(key: string): string | null {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.removeItem(key);
  }
}

import { StorageBackend } from '../types/config';

export function createStorageBackend(type: StorageBackend): AuthStorage {
  switch (type) {
    case 'localStorage':
      return new LocalStorageBackend();
    case 'sessionStorage':
      return new SessionStorageBackend();
    case 'memory':
      return new MemoryStorage();
    case 'asyncStorage':
      // React Native AsyncStorage would go here, 
      // but typical web SDKs might need it injected or handled specially
      // For now, fallback to memory if not in RN
      return new MemoryStorage();
    default:
      return new LocalStorageBackend();
  }
}
