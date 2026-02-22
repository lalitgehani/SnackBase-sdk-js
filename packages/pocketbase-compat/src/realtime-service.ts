/**
 * RealtimeServiceCompat — PocketBase-compatible real-time subscription bridge.
 *
 * Bridges `snackbase.realtime` to the PocketBase `pb.realtime` and
 * `pb.collection('x').subscribe()` API surface.
 *
 * Phase 4 deliverable.
 */

import type { SnackBaseClient } from '@snackbase/sdk';
import type { RecordModel, RecordSubscription } from './types.js';
import { toRecordModel } from './normalizer.js';

type CleanupFn = () => void;

export class RealtimeServiceCompat {
  /**
   * Internal state: Map<'collection/topic', Set<CleanupFn>>
   * Each CleanupFn removes the specific realtime.on listeners for one subscriber.
   */
  private readonly _subscriptions = new Map<string, Set<CleanupFn>>();

  constructor(private readonly snackbase: SnackBaseClient) {}

  /**
   * Subscribe to real-time events for a specific collection/topic.
   *
   * @param collection - Collection name (e.g. 'posts')
   * @param topic - '*' for all records, or a specific record ID
   * @param callback - Called with `{ action, record }` on each event
   * @returns Unsubscribe function
   */
  async subscribeToCollection<T extends RecordModel = RecordModel>(
    collection: string,
    topic: string,
    callback: (data: RecordSubscription<T>) => void,
  ): Promise<CleanupFn> {
    await this.snackbase.realtime.connect();
    await this.snackbase.realtime.subscribe(collection, ['create', 'update', 'delete']);

    const key = `${collection}/${topic}`;

    /**
     * Creates a handler for a specific operation.
     * The handler receives rawData (message.data) from the realtime service.
     * For topic-specific subscriptions it filters by record ID.
     */
    const makeHandler =
      (action: 'create' | 'update' | 'delete') =>
      (rawData: any): void => {
        if (topic !== '*' && rawData?.id !== topic) return;
        const record = toRecordModel(rawData ?? {}, collection) as unknown as T;
        callback({ action, record });
      };

    // Register one handler per operation so we know the action without parsing
    const cleanupCreate = this.snackbase.realtime.on(
      `${collection}.create` as any,
      makeHandler('create'),
    );
    const cleanupUpdate = this.snackbase.realtime.on(
      `${collection}.update` as any,
      makeHandler('update'),
    );
    const cleanupDelete = this.snackbase.realtime.on(
      `${collection}.delete` as any,
      makeHandler('delete'),
    );

    // removeListeners: only removes the realtime.on listeners
    const removeListeners: CleanupFn = () => {
      cleanupCreate();
      cleanupUpdate();
      cleanupDelete();
    };

    if (!this._subscriptions.has(key)) {
      this._subscriptions.set(key, new Set());
    }
    this._subscriptions.get(key)!.add(removeListeners);

    /**
     * Returned cleanup: removes listeners AND updates subscription tracking.
     * If this was the last subscriber for 'collection/topic' and no other topics
     * exist for the same collection, unsubscribes at the realtime layer too.
     */
    const cleanup: CleanupFn = () => {
      removeListeners();

      const subs = this._subscriptions.get(key);
      if (subs) {
        subs.delete(removeListeners);
        if (subs.size === 0) {
          this._subscriptions.delete(key);

          const hasOtherTopics = [...this._subscriptions.keys()].some((k) =>
            k.startsWith(`${collection}/`),
          );
          if (!hasOtherTopics) {
            this.snackbase.realtime.unsubscribe(collection).catch(() => {});
          }
        }
      }
    };

    return cleanup;
  }

  /**
   * Unsubscribe all listeners for a given collection / optional topic.
   *
   * @param collection - Collection name
   * @param topic - Optional topic ('*' or record ID). If omitted, clears all topics.
   */
  async unsubscribeFromCollection(collection: string, topic?: string): Promise<void> {
    if (topic !== undefined) {
      const key = `${collection}/${topic}`;
      const subs = this._subscriptions.get(key);
      if (subs) {
        subs.forEach((fn) => fn());
        this._subscriptions.delete(key);
      }

      // Unsubscribe collection if no remaining topics
      const hasOtherTopics = [...this._subscriptions.keys()].some((k) =>
        k.startsWith(`${collection}/`),
      );
      if (!hasOtherTopics) {
        await this.snackbase.realtime.unsubscribe(collection);
      }
    } else {
      // Remove all topics for this collection
      const keysToRemove = [...this._subscriptions.keys()].filter((k) =>
        k.startsWith(`${collection}/`),
      );
      keysToRemove.forEach((k) => {
        this._subscriptions.get(k)?.forEach((fn) => fn());
        this._subscriptions.delete(k);
      });
      await this.snackbase.realtime.unsubscribe(collection);
    }
  }

  /**
   * Direct `pb.realtime.subscribe(topic, callback)` call.
   * Topic format: `'collectionName/recordId'`, `'collectionName/*'`, or just `'collectionName'`.
   */
  async subscribe<T extends RecordModel = RecordModel>(
    topic: string,
    callback: (data: RecordSubscription<T>) => void,
    _opts?: any,
  ): Promise<CleanupFn> {
    const slashIdx = topic.lastIndexOf('/');
    let collection: string;
    let recordTopic: string;

    if (slashIdx !== -1) {
      collection = topic.substring(0, slashIdx);
      recordTopic = topic.substring(slashIdx + 1);
    } else {
      collection = topic;
      recordTopic = '*';
    }

    return this.subscribeToCollection(collection, recordTopic, callback);
  }

  /**
   * Direct `pb.realtime.unsubscribe(topic?)` call.
   * With no argument: disconnects everything.
   * With a topic string: parses collection and delegates to `unsubscribeFromCollection`.
   */
  async unsubscribe(topic?: string): Promise<void> {
    if (!topic) {
      // Clear all subscriptions and disconnect
      this._subscriptions.forEach((subs) => subs.forEach((fn) => fn()));
      this._subscriptions.clear();
      this.snackbase.realtime.disconnect();
      return;
    }

    const slashIdx = topic.lastIndexOf('/');
    if (slashIdx !== -1) {
      const collection = topic.substring(0, slashIdx);
      const recordTopic = topic.substring(slashIdx + 1);
      await this.unsubscribeFromCollection(collection, recordTopic);
    } else {
      await this.unsubscribeFromCollection(topic);
    }
  }

  /**
   * Unsubscribes all topics whose key starts with `prefix/`.
   * Used internally and exposed for advanced cleanup.
   */
  async unsubscribeByPrefix(prefix: string): Promise<void> {
    const keysToRemove = [...this._subscriptions.keys()].filter((k) =>
      k.startsWith(`${prefix}/`),
    );

    keysToRemove.forEach((k) => {
      this._subscriptions.get(k)?.forEach((fn) => fn());
      this._subscriptions.delete(k);
    });

    if (keysToRemove.length > 0) {
      await this.snackbase.realtime.unsubscribe(prefix);
    }
  }
}
