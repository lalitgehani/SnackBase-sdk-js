import { 
  RealTimeState, 
  RealTimeEvents, 
  ServerMessage, 
  WebSocketMessage,
  RealTimeEventHandler
} from '../types/realtime';
import { AuthManager } from './auth';

export interface RealTimeOptions {
  baseUrl: string;
  getToken: () => string | null;
  authManager?: AuthManager;
  maxRetries?: number;
  reconnectionDelay?: number;
}

export class RealTimeService {
  private state: RealTimeState = 'disconnected';
  private socket: WebSocket | null = null;
  private sse: EventSource | null = null;
  private listeners: Record<string, Set<Function>> = {};
  private retryCount = 0;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private subscriptions: Set<string> = new Set();
  private subscriptionRequests: Map<string, string[]> = new Map();
  private pendingSubscriptions: Map<string, { resolve: () => void; reject: (error: Error) => void }> = new Map();
  private authUnsubscribe?: () => void;
  private isReconnectingForAuth = false;

  constructor(private options: RealTimeOptions) {
    // Listen for auth state changes (token refresh)
    if (this.options.authManager) {
      this.authUnsubscribe = this.options.authManager.on('auth:login', () => {
        this.handleTokenRefresh();
      });
    }
  }

  async connect(): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') {
      return;
    }

    this.setState('connecting');
    this.retryCount = 0;
    return this.doConnect();
  }

  disconnect(): void {
    this.clearTimers();
    this.closeConnections();
    this.setState('disconnected');
    this.subscriptions.clear();
    
    // Clean up auth listener
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = undefined;
    }
  }

  getState(): RealTimeState {
    return this.state;
  }

  on<K extends keyof RealTimeEvents>(event: K, handler: RealTimeEvents[K]): () => void {
    const eventName = event as string;
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = new Set();
    }
    this.listeners[eventName].add(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof RealTimeEvents>(event: K, handler: RealTimeEvents[K]): void {
    this.listeners[event as string]?.delete(handler);
  }

  async subscribe(collection: string, operations: string[] = ['create', 'update', 'delete']): Promise<void> {
    if (this.subscriptions.size >= 100) {
      throw new Error('Maximum 100 subscriptions per connection');
    }

    this.subscriptions.add(collection);
    this.subscriptionRequests.set(collection, operations);

    if (this.state === 'connected' && this.socket) {
      return new Promise<void>((resolve, reject) => {
        this.pendingSubscriptions.set(`subscribe:${collection}`, { resolve, reject });
        this.send({ action: 'subscribe', collection, operations });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (this.pendingSubscriptions.has(`subscribe:${collection}`)) {
            this.pendingSubscriptions.delete(`subscribe:${collection}`);
            reject(new Error(`Subscription to ${collection} timed out`));
          }
        }, 5000);
      });
    }
    
    // If not connected, subscription will be sent on connect
    return Promise.resolve();
  }

  async unsubscribe(collection: string): Promise<void> {
    this.subscriptions.delete(collection);
    this.subscriptionRequests.delete(collection);

    if (this.state === 'connected' && this.socket) {
      return new Promise<void>((resolve, reject) => {
        this.pendingSubscriptions.set(`unsubscribe:${collection}`, { resolve, reject });
        this.send({ action: 'unsubscribe', collection });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (this.pendingSubscriptions.has(`unsubscribe:${collection}`)) {
            this.pendingSubscriptions.delete(`unsubscribe:${collection}`);
            reject(new Error(`Unsubscription from ${collection} timed out`));
          }
        }, 5000);
      });
    }
    
    return Promise.resolve();
  }

  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  private async doConnect(): Promise<void> {
    // Don't attempt to connect if already in error state
    if (this.state === 'error' && !this.isReconnectingForAuth) {
      return;
    }

    const token = this.options.getToken();
    if (!token) {
      this.setState('error');
      const error = new Error('Authentication token is required for real-time connection');
      this.emit('error', error);
      this.emit('auth_error', error);
      return;
    }

    // Check if token is expired
    if (this.options.authManager) {
      const authState = this.options.authManager.getState();
      if (authState.expiresAt) {
        const expiry = new Date(authState.expiresAt).getTime();
        const now = Date.now();
        if (expiry <= now) {
          this.setState('error');
          const error = new Error('Authentication token has expired');
          this.emit('error', error);
          this.emit('auth_error', error);
          return;
        }
      }
    }

    let webSocketAttempted = false;

    try {
      if (typeof WebSocket !== 'undefined') {
        webSocketAttempted = true;
        await this.connectWebSocket(token);
      } else {
        await this.connectSSE(token);
      }
    } catch (err) {
      if (webSocketAttempted && !this.sse) {
        // Fallback to SSE if WebSocket failed and we haven't tried SSE yet
        try {
          await this.connectSSE(token);
        } catch (sseErr) {
          this.handleError(sseErr as Error);
        }
      } else {
        this.handleError(err as Error);
      }
    }
  }

  private connectWebSocket(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.options.baseUrl);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.pathname = '/api/v1/realtime/ws';
      url.searchParams.set('token', token);

      this.socket = new WebSocket(url.toString());
      let connectionResolved = false;

      this.socket.onopen = () => {
        this.setState('connected');
        this.retryCount = 0;
        this.startHeartbeat();
        this.resubscribe();
        connectionResolved = true;
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          // Ignore non-json or invalid messages
        }
      };

      this.socket.onclose = () => {
        this.socket = null;
        if (!connectionResolved) {
          reject(new Error('WebSocket closed during connection'));
        } else if (this.state !== 'disconnected') {
          this.handleReconnect();
        }
      };

      this.socket.onerror = (e) => {
        if (!connectionResolved) {
          reject(e);
        } else {
          this.emit('error', new Error('WebSocket error'));
        }
      };
    });
  }

  private connectSSE(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.options.baseUrl);
      url.pathname = '/api/v1/realtime/subscribe';
      url.searchParams.set('token', token);
      
      // SSE subscriptions are specified at connection time
      // Format: collections=posts:create,update&collections=users:delete
      this.subscriptionRequests.forEach((operations, collection) => {
        const value = operations.length > 0 ? `${collection}:${operations.join(',')}` : collection;
        url.searchParams.append('collections', value);
      });
      
      this.sse = new EventSource(url.toString());

      this.sse.onopen = () => {
        this.setState('connected');
        this.retryCount = 0;
        resolve();
      };

      this.sse.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          // Ignore
        }
      };

      this.sse.onerror = (e) => {
        if (this.state === 'connecting') {
          reject(e);
        } else {
          this.handleReconnect();
        }
      };
    });
  }

  private handleMessage(message: ServerMessage): void {
    // Filter heartbeat and pong messages - don't emit as events
    if (message.type === 'heartbeat' || message.type === 'pong') {
      return;
    }

    // Handle subscription confirmations
    if (message.type === 'subscribed' && message.collection) {
      const key = `subscribe:${message.collection}`;
      const pending = this.pendingSubscriptions.get(key);
      if (pending) {
        pending.resolve();
        this.pendingSubscriptions.delete(key);
      }
      return;
    }

    if (message.type === 'unsubscribed' && message.collection) {
      const key = `unsubscribe:${message.collection}`;
      const pending = this.pendingSubscriptions.get(key);
      if (pending) {
        pending.resolve();
        this.pendingSubscriptions.delete(key);
      }
      return;
    }

    // Emit the full message event
    this.emit('message', message);
    
    // Emit specific event type and wildcards
    if (message.type) {
      // Emit specific event (e.g., "posts.create")
      this.emit(message.type, message.data);
      
      // Parse collection and operation for wildcard support
      const parts = message.type.split('.');
      if (parts.length === 2) {
        const [collection, operation] = parts;
        
        // Emit collection wildcard (e.g., "posts.*")
        this.emit(`${collection}.*`, message.data);
      }
      
      // Emit global wildcard
      this.emit('*', message.data);
    }
  }

  private handleReconnect(): void {
    if (this.state === 'disconnected') return;

    // Don't reconnect if token is missing or expired (unless we're reconnecting for auth refresh)
    if (!this.isReconnectingForAuth) {
      const token = this.options.getToken();
      if (!token) {
        this.setState('error');
        const error = new Error('Cannot reconnect: no authentication token available');
        this.emit('error', error);
        this.emit('auth_error', error);
        return;
      }

      if (this.options.authManager) {
        const authState = this.options.authManager.getState();
        if (authState.expiresAt) {
          const expiry = new Date(authState.expiresAt).getTime();
          const now = Date.now();
          if (expiry <= now) {
            this.setState('error');
            const error = new Error('Cannot reconnect: authentication token has expired');
            this.emit('error', error);
            this.emit('auth_error', error);
            return;
          }
        }
      }
    }

    this.setState('connecting');
    const maxRetries = this.options.maxRetries ?? 10;
    
    if (this.retryCount >= maxRetries) {
      this.setState('error');
      this.emit('error', new Error('Maximum reconnection attempts reached'));
      return;
    }

    const delay = Math.min(30000, (this.options.reconnectionDelay ?? 1000) * Math.pow(2, this.retryCount));
    this.retryCount++;

    this.reconnectTimer = setTimeout(() => {
      this.doConnect();
    }, delay);
  }

  private handleError(error: Error): void {
    this.emit('error', error);
    this.handleReconnect();
  }

  private setState(state: RealTimeState): void {
    this.state = state;
    this.emit(state as any);
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners[event]?.forEach(handler => handler(...args));
  }

  private send(message: WebSocketMessage): void {
    // Use 1 directly instead of WebSocket.OPEN constant
    // to ensure compatibility in all environments
    if (this.socket && this.socket.readyState === 1) {
      this.socket.send(JSON.stringify(message));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ action: 'ping' });
    }, 30000); // 30 seconds
  }

  private resubscribe(): void {
    this.subscriptionRequests.forEach((operations, collection) => {
      this.send({ action: 'subscribe', collection, operations });
    });
  }

  private clearTimers(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
  }

  private closeConnections(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.sse) {
      this.sse.close();
      this.sse = null;
    }
  }

  /**
   * Handle token refresh by reconnecting with new token
   */
  private handleTokenRefresh(): void {
    // Only reconnect if currently connected
    if (this.state === 'connected') {
      this.isReconnectingForAuth = true;
      this.clearTimers();
      this.closeConnections();
      this.setState('connecting');
      this.retryCount = 0; // Reset retry count for auth refresh
      
      // Reconnect with new token
      this.doConnect().finally(() => {
        this.isReconnectingForAuth = false;
      });
    }
  }
}
