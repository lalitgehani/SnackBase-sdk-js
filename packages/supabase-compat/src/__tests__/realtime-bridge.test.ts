import { describe, it, expect, vi, beforeEach } from 'vitest';

function makeMockClient() {
  const realtimeService = {
    connect: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    on: vi.fn().mockReturnValue(() => {}),
  };

  return {
    realtime: realtimeService,
  };
}

let RealtimeChannelBridge: typeof import('../realtime-bridge').RealtimeChannelBridge;

beforeEach(async () => {
  const mod = await import('../realtime-bridge');
  RealtimeChannelBridge = mod.RealtimeChannelBridge;
});

describe('RealtimeChannelBridge', () => {
  let client: ReturnType<typeof makeMockClient>;
  let bridge: InstanceType<typeof import('../realtime-bridge').RealtimeChannelBridge>;

  beforeEach(() => {
    client = makeMockClient();
    bridge = new RealtimeChannelBridge('test-channel', client as any);
  });

  it('registers listeners with on()', () => {
    const callback = vi.fn();
    bridge.on('postgres_changes', { event: '*', table: 'posts' }, callback);
    
    expect((bridge as any)._listeners).toHaveLength(1);
    expect((bridge as any)._listeners[0].filter.table).toBe('posts');
  });

  describe('subscribe()', () => {
    it('connects and subscribes to collection on backend', async () => {
      bridge.on('postgres_changes', { event: 'INSERT', table: 'posts' }, vi.fn());
      
      const statusCallback = vi.fn();
      bridge.subscribe(statusCallback);

      // subscribe is async but returns this, so we wait for ticks
      await Promise.resolve(); // wait for internal run()
      await Promise.resolve(); // wait for connect()
      await Promise.resolve(); // wait for subscribe()

      expect(client.realtime.connect).toHaveBeenCalled();
      expect(client.realtime.subscribe).toHaveBeenCalledWith('posts', ['create']);
      expect(client.realtime.on).toHaveBeenCalledWith('posts.*', expect.any(Function));
      
      // statusCallback is called asynchronously
      await Promise.resolve();
      expect(statusCallback).toHaveBeenCalledWith('SUBSCRIBED');
    });

    it('normalizes and filters broadcasted events', async () => {
      const callback = vi.fn();
      bridge.on('postgres_changes', { event: 'INSERT', table: 'posts' }, callback);
      
      bridge.subscribe();
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

      // Get the callback registered with client.realtime.on
      const onCallback = (client.realtime.on as any).mock.calls[0][1];
      
      // Simulate an INSERT event
      onCallback({ type: 'posts.create', data: { id: 1, title: 'Hello' } });
      
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        eventType: 'INSERT',
        table: 'posts',
        new: { id: 1, title: 'Hello' },
      }));

      // Simulate an UPDATE event (should be filtered out because we only registered for INSERT)
      callback.mockClear();
      onCallback({ type: 'posts.update', data: { id: 1, title: 'Updated' } });
      expect(callback).not.toHaveBeenCalled();
    });

    it('handles wildcard event (*)', async () => {
      const callback = vi.fn();
      bridge.on('postgres_changes', { event: '*', table: 'posts' }, callback);
      
      bridge.subscribe();
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

      const onCallback = (client.realtime.on as any).mock.calls[0][1];
      
      onCallback({ type: 'posts.create', data: { id: 1 } });
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'INSERT' }));

      onCallback({ type: 'posts.update', data: { id: 1 } });
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'UPDATE' }));
      
      onCallback({ type: 'posts.delete', data: { id: 1 } });
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'DELETE' }));
    });
  });

  describe('unsubscribe()', () => {
    it('calls cleanup functions and unsubscribes from backend', async () => {
      const cleanup = vi.fn();
      client.realtime.on.mockReturnValue(cleanup);
      
      bridge.on('postgres_changes', { event: '*', table: 'posts' }, vi.fn());
      bridge.subscribe();
      
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
      
      await bridge.unsubscribe();
      
      expect(cleanup).toHaveBeenCalled();
      expect(client.realtime.unsubscribe).toHaveBeenCalledWith('posts');
    });
  });
});
