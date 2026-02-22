/**
 * Phase 4 — RealtimeServiceCompat tests
 *
 * All SnackBase realtime service methods are mocked so these tests run
 * entirely in Node without a live server.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealtimeServiceCompat } from '../realtime-service.js';
import type { RecordSubscription } from '../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a minimal mock of snackbase.realtime */
function makeRealtimeMock() {
  /** Map of event name → Set of registered handlers */
  const handlers = new Map<string, Set<Function>>();

  const mockRealtime = {
    connect: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    on: vi.fn().mockImplementation((event: string, handler: Function) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
      // Returns cleanup fn (mirrors real RealTimeService)
      return () => handlers.get(event)?.delete(handler);
    }),
  };

  /** Fire all handlers registered for `event` with `data` */
  const fire = (event: string, data: any) => {
    handlers.get(event)?.forEach((h) => h(data));
  };

  return { mockRealtime, fire, handlers };
}

/** Creates a minimal SnackBaseClient mock with only the realtime property */
function makeSnackbaseMock(realtimeMock: any) {
  return { realtime: realtimeMock } as any;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RealtimeServiceCompat', () => {
  let realtimeMock: ReturnType<typeof makeRealtimeMock>['mockRealtime'];
  let fire: ReturnType<typeof makeRealtimeMock>['fire'];
  let handlers: ReturnType<typeof makeRealtimeMock>['handlers'];
  let bridge: RealtimeServiceCompat;

  beforeEach(() => {
    const m = makeRealtimeMock();
    realtimeMock = m.mockRealtime;
    fire = m.fire;
    handlers = m.handlers;
    bridge = new RealtimeServiceCompat(makeSnackbaseMock(realtimeMock));
  });

  // -------------------------------------------------------------------------
  // subscribeToCollection — basic setup
  // -------------------------------------------------------------------------

  describe('subscribeToCollection — setup', () => {
    it('calls realtime.connect() when subscribing', async () => {
      await bridge.subscribeToCollection('posts', '*', vi.fn());
      expect(realtimeMock.connect).toHaveBeenCalledOnce();
    });

    it('calls realtime.subscribe(collection, [create,update,delete])', async () => {
      await bridge.subscribeToCollection('posts', '*', vi.fn());
      expect(realtimeMock.subscribe).toHaveBeenCalledWith('posts', [
        'create',
        'update',
        'delete',
      ]);
    });

    it('registers three on() handlers — one per operation', async () => {
      await bridge.subscribeToCollection('posts', '*', vi.fn());
      expect(realtimeMock.on).toHaveBeenCalledTimes(3);
      const calls = realtimeMock.on.mock.calls.map((c: any[]) => c[0]);
      expect(calls).toContain('posts.create');
      expect(calls).toContain('posts.update');
      expect(calls).toContain('posts.delete');
    });
  });

  // -------------------------------------------------------------------------
  // subscribeToCollection — event conversion
  // -------------------------------------------------------------------------

  describe('subscribeToCollection — event format conversion', () => {
    it('delivers action:create with normalised record', async () => {
      const cb = vi.fn();
      await bridge.subscribeToCollection('posts', '*', cb);

      fire('posts.create', {
        id: '1',
        title: 'Hello',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      });

      expect(cb).toHaveBeenCalledOnce();
      const event: RecordSubscription = cb.mock.calls[0][0];
      expect(event.action).toBe('create');
      expect(event.record.id).toBe('1');
      expect(event.record.title).toBe('Hello');
      expect(event.record.created).toBe('2024-01-01T00:00:00Z');
      expect(event.record.updated).toBe('2024-01-02T00:00:00Z');
      expect(event.record.collectionId).toBe('posts');
      expect(event.record.collectionName).toBe('posts');
      // Raw SnackBase fields should be removed
      expect(event.record.created_at).toBeUndefined();
      expect(event.record.updated_at).toBeUndefined();
    });

    it('delivers action:update for posts.update events', async () => {
      const cb = vi.fn();
      await bridge.subscribeToCollection('posts', '*', cb);

      fire('posts.update', { id: '2', title: 'Updated', created_at: '', updated_at: '' });

      expect(cb).toHaveBeenCalledOnce();
      expect(cb.mock.calls[0][0].action).toBe('update');
    });

    it('delivers action:delete for posts.delete events', async () => {
      const cb = vi.fn();
      await bridge.subscribeToCollection('posts', '*', cb);

      fire('posts.delete', { id: '3', created_at: '', updated_at: '' });

      expect(cb).toHaveBeenCalledOnce();
      expect(cb.mock.calls[0][0].action).toBe('delete');
    });
  });

  // -------------------------------------------------------------------------
  // Topic filtering (specific record ID)
  // -------------------------------------------------------------------------

  describe('subscribeToCollection — topic filtering', () => {
    it('delivers event when topic matches record id', async () => {
      const cb = vi.fn();
      await bridge.subscribeToCollection('posts', 'abc123', cb);

      fire('posts.create', { id: 'abc123', title: 'Match', created_at: '', updated_at: '' });

      expect(cb).toHaveBeenCalledOnce();
    });

    it('does NOT deliver event when topic does not match record id', async () => {
      const cb = vi.fn();
      await bridge.subscribeToCollection('posts', 'abc123', cb);

      fire('posts.create', { id: 'other-id', title: 'NoMatch', created_at: '', updated_at: '' });

      expect(cb).not.toHaveBeenCalled();
    });

    it("topic '*' delivers events for any record id", async () => {
      const cb = vi.fn();
      await bridge.subscribeToCollection('posts', '*', cb);

      fire('posts.create', { id: 'id-1', created_at: '', updated_at: '' });
      fire('posts.create', { id: 'id-2', created_at: '', updated_at: '' });

      expect(cb).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // Unsubscribe (returned cleanup fn)
  // -------------------------------------------------------------------------

  describe('returned unsubscribe function', () => {
    it('removes listeners so no further callbacks fire', async () => {
      const cb = vi.fn();
      const unsub = await bridge.subscribeToCollection('posts', '*', cb);

      // Fire once before unsubscribing
      fire('posts.create', { id: '1', created_at: '', updated_at: '' });
      expect(cb).toHaveBeenCalledTimes(1);

      unsub();

      // Fire again after unsubscribing — should not reach cb
      fire('posts.create', { id: '2', created_at: '', updated_at: '' });
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('calls realtime.unsubscribe(collection) when last subscriber unsubs', async () => {
      const unsub = await bridge.subscribeToCollection('posts', '*', vi.fn());
      unsub();
      expect(realtimeMock.unsubscribe).toHaveBeenCalledWith('posts');
    });

    it('does NOT call realtime.unsubscribe when other topics remain', async () => {
      const unsub1 = await bridge.subscribeToCollection('posts', '*', vi.fn());
      await bridge.subscribeToCollection('posts', 'rec-1', vi.fn());

      unsub1();
      // 'posts/rec-1' still active — should not unsubscribe collection
      expect(realtimeMock.unsubscribe).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Multiple independent listeners
  // -------------------------------------------------------------------------

  describe('multiple independent subscribers', () => {
    it('two subscribers on * both receive the same event', async () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      await bridge.subscribeToCollection('posts', '*', cb1);
      await bridge.subscribeToCollection('posts', '*', cb2);

      fire('posts.create', { id: '1', created_at: '', updated_at: '' });

      expect(cb1).toHaveBeenCalledOnce();
      expect(cb2).toHaveBeenCalledOnce();
    });

    it('unsubscribing one listener does not affect the other', async () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const unsub1 = await bridge.subscribeToCollection('posts', '*', cb1);
      await bridge.subscribeToCollection('posts', '*', cb2);

      unsub1();

      fire('posts.create', { id: '1', created_at: '', updated_at: '' });

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // unsubscribeFromCollection
  // -------------------------------------------------------------------------

  describe('unsubscribeFromCollection', () => {
    it("unsubscribeFromCollection('posts', '*') clears all * listeners", async () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      await bridge.subscribeToCollection('posts', '*', cb1);
      await bridge.subscribeToCollection('posts', '*', cb2);

      await bridge.unsubscribeFromCollection('posts', '*');

      fire('posts.create', { id: '1', created_at: '', updated_at: '' });

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).not.toHaveBeenCalled();
    });

    it('unsubscribeFromCollection with no topic clears all collection topics', async () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      await bridge.subscribeToCollection('posts', '*', cb1);
      await bridge.subscribeToCollection('posts', 'rec-1', cb2);

      await bridge.unsubscribeFromCollection('posts');

      fire('posts.create', { id: '1', created_at: '', updated_at: '' });
      fire('posts.create', { id: 'rec-1', created_at: '', updated_at: '' });

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).not.toHaveBeenCalled();
      expect(realtimeMock.unsubscribe).toHaveBeenCalledWith('posts');
    });
  });

  // -------------------------------------------------------------------------
  // unsubscribe (top-level)
  // -------------------------------------------------------------------------

  describe('unsubscribe (top-level)', () => {
    it('unsubscribe() with no args disconnects everything', async () => {
      const cb = vi.fn();
      await bridge.subscribeToCollection('posts', '*', cb);

      await bridge.unsubscribe();

      expect(realtimeMock.disconnect).toHaveBeenCalledOnce();

      fire('posts.create', { id: '1', created_at: '', updated_at: '' });
      expect(cb).not.toHaveBeenCalled();
    });

    it("unsubscribe('posts/*') clears * topic for posts", async () => {
      const cb = vi.fn();
      await bridge.subscribeToCollection('posts', '*', cb);

      await bridge.unsubscribe('posts/*');

      fire('posts.create', { id: '1', created_at: '', updated_at: '' });
      expect(cb).not.toHaveBeenCalled();
    });

    it("unsubscribe('posts') clears all posts topics", async () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      await bridge.subscribeToCollection('posts', '*', cb1);
      await bridge.subscribeToCollection('posts', 'id-1', cb2);

      await bridge.unsubscribe('posts');

      fire('posts.create', { id: '1', created_at: '', updated_at: '' });
      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // unsubscribeByPrefix
  // -------------------------------------------------------------------------

  describe('unsubscribeByPrefix', () => {
    it("unsubscribeByPrefix('posts') clears all posts/* subscriptions", async () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const cb3 = vi.fn();
      await bridge.subscribeToCollection('posts', '*', cb1);
      await bridge.subscribeToCollection('posts', 'rec-1', cb2);
      await bridge.subscribeToCollection('comments', '*', cb3);

      await bridge.unsubscribeByPrefix('posts');

      fire('posts.create', { id: '1', created_at: '', updated_at: '' });
      fire('comments.create', { id: '2', created_at: '', updated_at: '' });

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).not.toHaveBeenCalled();
      // comments subscription unaffected
      expect(cb3).toHaveBeenCalledOnce();

      expect(realtimeMock.unsubscribe).toHaveBeenCalledWith('posts');
      expect(realtimeMock.unsubscribe).not.toHaveBeenCalledWith('comments');
    });
  });

  // -------------------------------------------------------------------------
  // subscribe() — top-level pb.realtime.subscribe()
  // -------------------------------------------------------------------------

  describe('subscribe (top-level pb.realtime.subscribe)', () => {
    it("subscribe('posts/*', cb) works like subscribeToCollection(posts, *, cb)", async () => {
      const cb = vi.fn();
      await bridge.subscribe('posts/*', cb);

      fire('posts.create', { id: '1', created_at: '', updated_at: '' });

      expect(cb).toHaveBeenCalledOnce();
      expect(cb.mock.calls[0][0].action).toBe('create');
    });

    it("subscribe('posts/rec-1', cb) filters to specific ID", async () => {
      const cb = vi.fn();
      await bridge.subscribe('posts/rec-1', cb);

      fire('posts.create', { id: 'rec-1', created_at: '', updated_at: '' });
      fire('posts.create', { id: 'other', created_at: '', updated_at: '' });

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb.mock.calls[0][0].record.id).toBe('rec-1');
    });

    it("subscribe('posts', cb) (no slash) treats as '*' topic", async () => {
      const cb = vi.fn();
      await bridge.subscribe('posts', cb);

      fire('posts.update', { id: 'any', created_at: '', updated_at: '' });

      expect(cb).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // pb.collection('posts').subscribe / unsubscribe integration
  // -------------------------------------------------------------------------

  describe('RecordServiceCompat.subscribe / unsubscribe integration', () => {
    it('pb.collection subscribe calls bridge.subscribeToCollection', async () => {
      const subscribeToCollectionSpy = vi.spyOn(bridge, 'subscribeToCollection');

      // Create a minimal RecordServiceCompat — import it directly
      const { RecordServiceCompat } = await import('../record-service.js');
      const snackbaseMock = makeSnackbaseMock(realtimeMock);
      const svc = new RecordServiceCompat(snackbaseMock, 'posts', bridge);

      const cb = vi.fn();
      await svc.subscribe('*', cb);

      expect(subscribeToCollectionSpy).toHaveBeenCalledWith('posts', '*', cb);
    });

    it('pb.collection unsubscribe calls bridge.unsubscribeFromCollection', async () => {
      const unsubSpy = vi.spyOn(bridge, 'unsubscribeFromCollection');

      const { RecordServiceCompat } = await import('../record-service.js');
      const snackbaseMock = makeSnackbaseMock(realtimeMock);
      const svc = new RecordServiceCompat(snackbaseMock, 'posts', bridge);

      await svc.unsubscribe('*');

      expect(unsubSpy).toHaveBeenCalledWith('posts', '*');
    });

    it('pb.collection subscribe end-to-end: callback fires with correct shape', async () => {
      const { RecordServiceCompat } = await import('../record-service.js');
      const snackbaseMock = makeSnackbaseMock(realtimeMock);
      const svc = new RecordServiceCompat(snackbaseMock, 'posts', bridge);

      const cb = vi.fn();
      await svc.subscribe('*', cb);

      fire('posts.create', { id: 'p1', title: 'Test', created_at: '2024-01-01', updated_at: '2024-01-02' });

      expect(cb).toHaveBeenCalledOnce();
      const event: RecordSubscription = cb.mock.calls[0][0];
      expect(event.action).toBe('create');
      expect(event.record.id).toBe('p1');
      expect(event.record.collectionName).toBe('posts');
      expect(event.record.collectionId).toBe('posts');
      expect(event.record.created).toBe('2024-01-01');
      expect(event.record.updated).toBe('2024-01-02');
    });
  });
});
