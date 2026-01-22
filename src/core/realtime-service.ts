import { 
  RealTimeState, 
  RealTimeEvents, 
  ServerMessage, 
  WebSocketMessage,
  RealTimeEventHandler
} from '../types/realtime';

export interface RealTimeOptions {
  baseUrl: string;
  getToken: () => string | null;
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

  constructor(private options: RealTimeOptions) {}

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

    if (this.state === 'connected' && this.socket) {
      this.send({ action: 'subscribe', collection, operations });
    } else {
      // Store for when we connect
      this.subscriptionRequests.set(collection, operations);
    }
    
    this.subscriptions.add(collection);
  }

  async unsubscribe(collection: string): Promise<void> {
    if (this.state === 'connected' && this.socket) {
      this.send({ action: 'unsubscribe', collection });
    }
    this.subscriptions.delete(collection);
    this.subscriptionRequests.delete(collection);
  }

  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  private async doConnect(): Promise<void> {
    // Don't attempt to connect if already in error state
    if (this.state === 'error') {
      return;
    }

    const token = this.options.getToken();
    if (!token) {
      this.setState('error');
      this.emit('error', new Error('Authentication token is required for real-time connection'));
      return;
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
      
      // SSE subscriptions usually passed in connection if needed by backend, 
      // but requirements say "SSE subscriptions are specified at connection time"
      // yet doesn't specify HOW. Assuming they might be query params or just all events.
      // For now, following the PRD literally.
      
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
    if (message.type === 'heartbeat' || message.type === 'pong') {
      return;
    }

    this.emit('message', message);
    if (message.type) {
      this.emit(message.type, message.data);
    }
  }

  private handleReconnect(): void {
    if (this.state === 'disconnected') return;

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
}
