export type RealTimeState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type RealTimeEvent = 'connecting' | 'connected' | 'disconnected' | 'error' | 'message';

export type WebSocketAction = 'subscribe' | 'unsubscribe' | 'ping';

export interface WebSocketMessage {
  action: WebSocketAction;
  collection?: string;
  operations?: string[];
}

export interface ServerMessage {
  type: string | 'heartbeat' | 'pong' | 'subscribed' | 'unsubscribed';
  timestamp: string;
  data?: any;
  collection?: string;
}

/**
 * Real-time event object structure
 * @template T - Type of the event data
 */
export interface RealtimeEvent<T = any> {
  /** Event type in format: {collection}.{operation} (e.g., "posts.create") */
  type: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Event data - full record for create/update, ID only for delete */
  data: T;
}

export interface RealTimeConfig {
  maxReconnectionAttempts?: number;
  heartbeatInterval?: number; // in milliseconds
  reconnectionDelay?: (attempt: number) => number;
}

export type RealTimeEventHandler = (data?: any) => void;

/**
 * Real-time event handlers
 * 
 * Event type formats:
 * - Connection events: 'connecting', 'connected', 'disconnected', 'error'
 * - Message event: 'message' - receives full ServerMessage
 * - Specific events: '{collection}.{operation}' (e.g., 'posts.create')
 * - Collection wildcard: '{collection}.*' (e.g., 'posts.*') - all events for a collection
 * - Global wildcard: '*' - all events
 */
export interface RealTimeEvents {
  connecting: () => void;
  connected: () => void;
  disconnected: () => void;
  error: (error: Error) => void;
  auth_error: (error: Error) => void;
  message: (data: ServerMessage) => void;
  [key: string]: RealTimeEventHandler;
}
