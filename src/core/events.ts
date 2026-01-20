import { AuthEvents } from '../types/auth';

export class AuthEventEmitter {
  private listeners: Record<string, Set<Function>> = {};

  on<K extends keyof AuthEvents>(event: K, listener: AuthEvents[K]): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event].add(listener);

    return () => this.off(event, listener);
  }

  off<K extends keyof AuthEvents>(event: K, listener: AuthEvents[K]): void {
    this.listeners[event]?.delete(listener);
  }

  emit<K extends keyof AuthEvents>(event: K, ...args: Parameters<AuthEvents[K]>): void {
    this.listeners[event]?.forEach((listener) => {
      // @ts-ignore - difficult to type spread with generic event
      listener(...args);
    });
  }
}
