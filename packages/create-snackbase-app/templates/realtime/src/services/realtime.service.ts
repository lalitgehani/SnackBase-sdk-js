import type { ServerMessage } from '@snackbase/sdk';
import sb from '../lib/snackbase';
import type { RealtimeEvent } from '../types';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export class RealtimeService {
  private stateChangeCallbacks: ((state: ConnectionState) => void)[] = [];
  private messageCallbacks: ((event: RealtimeEvent) => void)[] = [];
  private unsubscribers: (() => void)[] = [];

  constructor(_baseUrl: string, _token: string) {
    // Note: sb is already initialized with baseUrl and token (if available)
    this.setupListeners();
  }

  private setupListeners() {
    this.unsubscribers.push(
      sb.realtime.on('connecting', () => this.updateState('connecting')),
      sb.realtime.on('connected', () => this.updateState('connected')),
      sb.realtime.on('disconnected', () => this.updateState('disconnected')),
      sb.realtime.on('error', () => this.updateState('error')),
      sb.realtime.on('message', (msg: ServerMessage) => {

        const event: RealtimeEvent = {
          type: msg.type,
          timestamp: msg.timestamp,
          data: msg.data,
          collection: msg.collection,
        };
        this.messageCallbacks.forEach((cb) => cb(event));
      })
    );
  }

  async connect() {
    await sb.realtime.connect();
  }

  async subscribe(collection: string, operations: string[]) {
    await sb.realtime.subscribe(collection, operations);
  }

  async unsubscribe(collection: string) {
    await sb.realtime.unsubscribe(collection);
  }

  onStateChange(callback: (state: ConnectionState) => void) {
    this.stateChangeCallbacks.push(callback);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  onMessage(callback: (event: RealtimeEvent) => void) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter((cb) => cb !== callback);
    };
  }

  private updateState(state: ConnectionState) {
    this.stateChangeCallbacks.forEach((cb) => cb(state));
  }

  disconnect() {
    sb.realtime.disconnect();
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}

