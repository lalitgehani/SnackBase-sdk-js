import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RealTimeService } from './realtime-service';

class MockWebSocket {
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((error: any) => void) | null = null;
  readyState = 0; // CONNECTING
  url: string;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = 1; // OPEN
      this.onopen?.();
    }, 0);
  }

  send = vi.fn();
  close = vi.fn().mockImplementation(() => {
    this.readyState = 3; // CLOSED
    this.onclose?.();
  });
}

class MockEventSource {
  onopen: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((error: any) => void) | null = null;
  readyState = 0; // CONNECTING
  url: string;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = 1; // OPEN
      this.onopen?.();
    }, 0);
  }

  close = vi.fn();
}

describe('RealTimeService', () => {
  const options = {
    baseUrl: 'https://api.example.com',
    getToken: () => 'mock-token',
    maxRetries: 3,
    reconnectionDelay: 100,
  };

  let service: RealTimeService;

  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    vi.stubGlobal('EventSource', MockEventSource);
    service = new RealTimeService(options);
    vi.useFakeTimers();
  });

  afterEach(() => {
    service.disconnect();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('should establish WebSocket connection', async () => {
    const connectPromise = service.connect();
    expect(service.getState()).toBe('connecting');

    // MockWebSocket uses setTimeout(..., 0) to open
    await vi.advanceTimersByTimeAsync(0);
    await connectPromise;

    expect(service.getState()).toBe('connected');
  });

  it('should fail if no token provided', async () => {
    const noTokenService = new RealTimeService({ ...options, getToken: () => null });
    const errorSpy = vi.fn();
    noTokenService.on('error', errorSpy);

    await noTokenService.connect();
    expect(noTokenService.getState()).toBe('error');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should fallback to SSE if WebSocket fails during connection', async () => {
    vi.stubGlobal('WebSocket', class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        setTimeout(() => {
          this.onerror?.(new Error('WS Failed'));
        }, 0);
      }
    });

    const connectPromise = service.connect();
    await vi.advanceTimersByTimeAsync(0);
    await connectPromise;
    
    expect(service.getState()).toBe('connected');
  });

  it('should handle reconnection with exponential backoff', async () => {
    let connectionAttempts = 0;

    // Mock WS to succeed on both attempts
    vi.stubGlobal('WebSocket', class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        connectionAttempts++;
        // Parent's onopen timer will handle the connection success
      }
    });

    const connectPromise = service.connect();
    await vi.advanceTimersByTimeAsync(0);
    await connectPromise;

    expect(connectionAttempts).toBe(1);

    // @ts-ignore - accessing private to simulate close
    const socket = service.socket;
    socket.onclose();

    expect(service.getState()).toBe('connecting');

    // First retry delay: 100 * 2^0 = 100
    // Include the 0ms timers by advancing slightly more than 100
    await vi.advanceTimersByTimeAsync(101);

    expect(service.getState()).toBe('connected');
    expect(connectionAttempts).toBe(2);
  });

  it('should stop reconnecting after maxRetries', async () => {
    // Create a service with a shorter reconnection delay for faster testing
    const testService = new RealTimeService({
      baseUrl: 'https://api.example.com',
      getToken: () => 'mock-token',
      maxRetries: 2, // Use fewer retries for faster test
      reconnectionDelay: 10, // Use shorter delay
    });

    // Mock WS to always fail
    vi.stubGlobal('WebSocket', class {
      onopen: (() => void) | null = null;
      onclose: (() => void) | null = null;
      onmessage: ((event: any) => void) | null = null;
      onerror: ((error: any) => void) | null = null;
      readyState = 0; // CONNECTING
      url: string;

      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.onerror?.(new Error('Connection failed'));
        }, 0);
      }

      send = vi.fn();
      close = vi.fn();
    });
    vi.stubGlobal('EventSource', class {
      onopen: (() => void) | null = null;
      onmessage: ((event: any) => void) | null = null;
      onerror: ((error: any) => void) | null = null;
      readyState = 0; // CONNECTING
      url: string;

      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.onerror?.(new Error('SSE Failed'));
        }, 0);
      }

      close = vi.fn();
    });

    // Connect and suppress the initial rejection
    testService.connect().catch(() => {
      // Expected to fail since both WS and SSE are mocked to fail
    });

    // Manually advance time through each retry
    // Initial + 2 retries = 3 attempts before hitting maxRetries=2
    // Delays: 10ms, 20ms, then next would be 40ms but should hit maxRetries
    const delays = [1, 10, 20, 40];
    for (const delay of delays) {
      await vi.advanceTimersByTimeAsync(delay);
      // Process all 0ms timers that get scheduled
      await vi.runOnlyPendingTimersAsync();
      if (testService.getState() === 'error') {
        break;
      }
    }

    expect(testService.getState()).toBe('error');

    // Cleanup
    testService.disconnect();
  });

  it('should send subscribe message when connected', async () => {
    const connectPromise = service.connect();
    await vi.advanceTimersByTimeAsync(0);
    await connectPromise;

    const subscribePromise = service.subscribe('posts', ['create']);
    // @ts-ignore
    expect(service.socket.send).toHaveBeenCalledWith(JSON.stringify({
      action: 'subscribe',
      collection: 'posts',
      operations: ['create']
    }));
    
    // Simulate server confirmation to prevent timeout
    // @ts-ignore
    service.socket.onmessage({
      data: JSON.stringify({
        type: 'subscribed',
        collection: 'posts',
        timestamp: new Date().toISOString()
      })
    });
    
    await subscribePromise;
  });

  it('should resubscribe on reconnect', async () => {
    await service.subscribe('posts');
    const connectPromise = service.connect();
    await vi.advanceTimersByTimeAsync(0);
    await connectPromise;

    // @ts-ignore
    expect(service.socket.send).toHaveBeenCalledWith(JSON.stringify({
      action: 'subscribe',
      collection: 'posts',
      operations: ['create', 'update', 'delete']
    }));
  });

  it('should emit message events', async () => {
    const connectPromise = service.connect();
    await vi.advanceTimersByTimeAsync(0);
    await connectPromise;

    const messageSpy = vi.fn();
    const dataSpy = vi.fn();
    service.on('message', messageSpy);
    service.on('posts.create', dataSpy);

    const mockMessage = {
      type: 'posts.create',
      timestamp: new Date().toISOString(),
      data: { id: '1', title: 'Test' }
    };

    // @ts-ignore
    service.socket.onmessage({ data: JSON.stringify(mockMessage) });

    expect(messageSpy).toHaveBeenCalledWith(mockMessage);
    expect(dataSpy).toHaveBeenCalledWith(mockMessage.data);
  });

  it('should handle heartbeats', async () => {
    const connectPromise = service.connect();
    await vi.advanceTimersByTimeAsync(0);
    await connectPromise;

    // @ts-ignore
    const socket = service.socket;
    await vi.advanceTimersByTimeAsync(30000);
    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ action: 'ping' }));
  });

  it('should wait for subscription confirmation', async () => {
    const connectPromise = service.connect();
    await vi.advanceTimersByTimeAsync(0);
    await connectPromise;

    const subscribePromise = service.subscribe('posts', ['create']);
    
    // @ts-ignore
    expect(service.socket.send).toHaveBeenCalledWith(JSON.stringify({
      action: 'subscribe',
      collection: 'posts',
      operations: ['create']
    }));

    // Simulate server confirmation
    // @ts-ignore
    service.socket.onmessage({
      data: JSON.stringify({
        type: 'subscribed',
        collection: 'posts',
        timestamp: new Date().toISOString()
      })
    });

    await subscribePromise;
    expect(service.getSubscriptions()).toContain('posts');
  });

  it('should timeout if subscription confirmation not received', async () => {
    const connectPromise = service.connect();
    await vi.advanceTimersByTimeAsync(0);
    await connectPromise;

    const subscribePromise = service.subscribe('posts', ['create']);
    
    // Add a catch handler to prevent unhandled rejection warnings
    const caughtError = subscribePromise.catch(err => err);
    
    // Advance time past the 5 second timeout
    await vi.advanceTimersByTimeAsync(5001);

    await expect(subscribePromise).rejects.toThrow('Subscription to posts timed out');
  });

  it('should wait for unsubscription confirmation', async () => {
    const connectPromise = service.connect();
    await vi.advanceTimersByTimeAsync(0);
    await connectPromise;

    const subscribePromise = service.subscribe('posts');
    // @ts-ignore
    service.socket.onmessage({
      data: JSON.stringify({
        type: 'subscribed',
        collection: 'posts',
        timestamp: new Date().toISOString()
      })
    });
    await subscribePromise;

    const unsubscribePromise = service.unsubscribe('posts');
    
    // @ts-ignore
    expect(service.socket.send).toHaveBeenCalledWith(JSON.stringify({
      action: 'unsubscribe',
      collection: 'posts'
    }));

    // Simulate server confirmation
    // @ts-ignore
    service.socket.onmessage({
      data: JSON.stringify({
        type: 'unsubscribed',
        collection: 'posts',
        timestamp: new Date().toISOString()
      })
    });

    await unsubscribePromise;
    expect(service.getSubscriptions()).not.toContain('posts');
  });

  it('should enforce subscription limit of 100', async () => {
    // Add 100 subscriptions
    for (let i = 0; i < 100; i++) {
      await service.subscribe(`collection${i}`);
    }

    // 101st should throw
    await expect(service.subscribe('collection100')).rejects.toThrow('Maximum 100 subscriptions per connection');
  });

  it('should include subscriptions in SSE connection URL', async () => {
    // Subscribe before connecting
    await service.subscribe('posts', ['create', 'update']);
    await service.subscribe('users', ['delete']);

    // Mock to force SSE fallback
    vi.stubGlobal('WebSocket', undefined);

    const connectPromise = service.connect();
    await vi.advanceTimersByTimeAsync(0);
    await connectPromise;

    // @ts-ignore - access private sse to check URL
    const sseUrl = service.sse.url;
    // URL encodes colons and commas, so check for encoded versions
    expect(sseUrl).toContain('collections=posts%3Acreate%2Cupdate');
    expect(sseUrl).toContain('collections=users%3Adelete');
  });
});
