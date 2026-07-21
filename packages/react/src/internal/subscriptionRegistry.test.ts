import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  acquireSubscription,
  __resetSubscriptionRegistry,
  __getSubscriptionCount,
  __getSubscriptionOps,
} from './subscriptionRegistry';

describe('subscriptionRegistry', () => {
  beforeEach(() => {
    __resetSubscriptionRegistry();
  });

  afterEach(() => {
    __resetSubscriptionRegistry();
  });

  it('merges ops and re-subscribes on expand', async () => {
    const subscribe = vi.fn(async () => {});
    const unsubscribe = vi.fn(async () => {});

    await acquireSubscription('posts', ['create'], subscribe, unsubscribe);
    expect(subscribe).toHaveBeenLastCalledWith('posts', ['create']);

    await acquireSubscription('posts', ['update'], subscribe, unsubscribe);
    expect(subscribe).toHaveBeenLastCalledWith('posts', ['create', 'update']);
    expect(__getSubscriptionOps('posts').sort()).toEqual(['create', 'update']);
  });

  /**
   * LivePosts sequential unmount race (shipped acquireSubscription path):
   * dual different-ops → unmount first (schedules delayed narrow re-subscribe)
   * → unmount last (unsubscribe) → delayed work finishes
   * → no subscribe#4; in-flight #3 compensated with unsubscribe; registry empty.
   */
  it('does not leave orphan subscribe after final unmount when narrow re-subscribe is delayed', async () => {
    const timeline: string[] = [];
    let releaseThirdSubscribe: (() => void) | undefined;
    let subscribeCalls = 0;

    const subscribe = vi.fn(async (_col: string, ops: string[]) => {
      subscribeCalls += 1;
      const n = subscribeCalls;
      timeline.push(`subscribe#${n}:${[...ops].sort().join(',')}`);
      // Third call is the narrow re-subscribe after partial unmount — delay it
      if (n === 3) {
        await new Promise<void>((resolve) => {
          releaseThirdSubscribe = resolve;
        });
        timeline.push('subscribe#3:body-done');
      }
    });

    const unsubscribe = vi.fn(async () => {
      timeline.push(`unsubscribe#${unsubscribe.mock.calls.length}`);
    });

    const releaseCreate = await acquireSubscription(
      'posts',
      ['create'],
      subscribe,
      unsubscribe
    );
    const releaseUpdate = await acquireSubscription(
      'posts',
      ['update'],
      subscribe,
      unsubscribe
    );

    expect(subscribeCalls).toBe(2);
    expect(__getSubscriptionCount('posts')).toBe(2);

    // Partial unmount → schedules narrow re-subscribe (call #3, delayed)
    releaseCreate();
    await vi.waitFor(() => {
      expect(subscribeCalls).toBe(3);
    });
    expect(unsubscribe).not.toHaveBeenCalled();
    expect(releaseThirdSubscribe).toBeTypeOf('function');

    // Last unmount while call #3 is still in-flight
    releaseUpdate();
    expect(unsubscribe).toHaveBeenCalled();
    expect(__getSubscriptionCount('posts')).toBe(0);
    timeline.push('after-final-unmount');

    const subscribeCountAtFinalUnmount = subscribeCalls;

    // Complete the in-flight third subscribe
    releaseThirdSubscribe!();
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));

    // Must not schedule a NEW subscribe after final unmount
    expect(subscribeCalls).toBe(subscribeCountAtFinalUnmount);
    expect(timeline.filter((t) => t.startsWith('subscribe#4')).length).toBe(0);

    // After final unmount marker: no new subscribe#N start events
    const finalIdx = timeline.indexOf('after-final-unmount');
    const afterFinal = timeline.slice(finalIdx + 1);
    expect(
      afterFinal.some((t) => /^subscribe#\d+:/.test(t) && !t.includes('body-done'))
    ).toBe(false);

    // In-flight #3 that started before final unmount must be compensated (orphan guard)
    if (afterFinal.includes('subscribe#3:body-done')) {
      expect(afterFinal.some((t) => t.startsWith('unsubscribe'))).toBe(true);
    }

    expect(__getSubscriptionCount('posts')).toBe(0);
    expect(__getSubscriptionOps('posts')).toEqual([]);
  });
});
