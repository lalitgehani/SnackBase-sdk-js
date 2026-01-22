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

export interface RealTimeConfig {
  maxReconnectionAttempts?: number;
  heartbeatInterval?: number; // in milliseconds
  reconnectionDelay?: (attempt: number) => number;
}

export type RealTimeEventHandler = (data?: any) => void;

export interface RealTimeEvents {
  connecting: () => void;
  connected: () => void;
  disconnected: () => void;
  error: (error: Error) => void;
  message: (data: ServerMessage) => void;
  [key: string]: RealTimeEventHandler;
}
