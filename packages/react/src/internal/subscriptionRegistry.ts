/**
 * Module-level ref-count for realtime collection subscriptions.
 * Multiple useSubscription instances on the same collection share one
 * SDK subscribe; unsubscribe runs only when the last subscriber unmounts.
 *
 * Operations are **merged** across subscribers: if A subscribes to `create`
 * and B later subscribes to `update` on the same collection, the shared
 * subscription is re-issued with `['create','update']` so both event types
 * are delivered (LivePosts multi-hook pattern).
 *
 * All async subscribe paths re-check the registry before (and after) I/O so
 * a delayed re-subscribe cannot orphan a server subscription after count→0.
 */

type CollectionKey = string;

interface Entry {
  count: number;
  /** Merged union of all active subscribers' operations */
  operations: string[];
  /** Ref-count per operation so release can shrink the union */
  opRefCounts: Map<string, number>;
  /** In-flight subscribe promise so concurrent mounts await the same work */
  pending: Promise<void> | null;
  /** Bumped when entry is torn down (count→0) so in-flight work can detect cancel */
  generation: number;
}

const registry = new Map<CollectionKey, Entry>();

function sortedOps(ops: Iterable<string>): string[] {
  return [...ops].sort();
}

/**
 * Call SDK subscribe only if the collection still has active subscribers.
 * After the async call, if the entry was torn down, issue unsubscribe to
 * undo a late subscribe that raced with last unmount.
 */
async function guardedSubscribe(
  key: CollectionKey,
  collection: string,
  generation: number,
  subscribe: (collection: string, operations: string[]) => Promise<void>,
  unsubscribe: (collection: string) => Promise<void>
): Promise<void> {
  const before = registry.get(key);
  if (!before || before.count <= 0 || before.generation !== generation) {
    return;
  }
  const opsToSend = before.operations.slice();
  await subscribe(collection, opsToSend);

  const after = registry.get(key);
  if (!after || after.count <= 0 || after.generation !== generation) {
    // Last subscriber left while subscribe was in flight — undo orphan
    await unsubscribe(collection).catch(() => {
      // best-effort
    });
  }
}

/**
 * Acquire a shared collection subscription.
 * - First subscriber (0→1): calls `subscribe(collection, operations)`.
 * - Later subscribers: merge operations into the union; if the union **expands**,
 *   re-subscribes with the full merged set so the server delivers new ops.
 * Returns a release function that decrements and unsubscribes at 0.
 */
export async function acquireSubscription(
  collection: string,
  operations: string[],
  subscribe: (collection: string, operations: string[]) => Promise<void>,
  unsubscribe: (collection: string) => Promise<void>
): Promise<() => void> {
  const key = collection;
  let entry = registry.get(key);

  if (!entry) {
    entry = {
      count: 0,
      operations: [],
      opRefCounts: new Map(),
      pending: null,
      generation: 0,
    };
    registry.set(key, entry);
  }

  const prevOps = entry.operations.slice();
  entry.count += 1;

  for (const op of operations) {
    entry.opRefCounts.set(op, (entry.opRefCounts.get(op) ?? 0) + 1);
  }

  const newOps = sortedOps(entry.opRefCounts.keys());
  const isFirst = entry.count === 1;
  const expanded = newOps.some((op) => !prevOps.includes(op));
  entry.operations = newOps;

  if (isFirst || expanded) {
    const prevPending = entry.pending;
    const generation = entry.generation;
    const work = (async () => {
      if (prevPending) {
        try {
          await prevPending;
        } catch {
          // Previous subscribe may have failed; still try with current union
        }
      }
      await guardedSubscribe(key, collection, generation, subscribe, unsubscribe);
    })();
    entry.pending = work.finally(() => {
      const cur = registry.get(key);
      if (cur && cur.pending === work) {
        cur.pending = null;
      }
    });
  }

  if (entry.pending) {
    await entry.pending;
  }

  // If we were torn down while awaiting (all others unmounted), do not hand out a no-op release incorrectly
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const current = registry.get(key);
    if (!current) return;

    current.count -= 1;
    for (const op of operations) {
      const n = (current.opRefCounts.get(op) ?? 1) - 1;
      if (n <= 0) current.opRefCounts.delete(op);
      else current.opRefCounts.set(op, n);
    }

    if (current.count <= 0) {
      // Invalidate any in-flight guardedSubscribe / re-subscribe
      current.generation += 1;
      current.pending = null;
      registry.delete(key);
      unsubscribe(collection).catch(() => {
        // Best-effort cleanup; avoid unhandled rejections on unmount
      });
      return;
    }

    // Remaining subscribers: update union; re-subscribe if ops narrowed
    const remaining = sortedOps(current.opRefCounts.keys());
    const prev = current.operations;
    current.operations = remaining;
    const narrowed =
      remaining.length !== prev.length || remaining.some((op, i) => op !== prev[i]);
    if (narrowed) {
      const prevPending = current.pending;
      const generation = current.generation;
      const work = (async () => {
        if (prevPending) {
          try {
            await prevPending;
          } catch {
            // ignore
          }
        }
        await guardedSubscribe(key, collection, generation, subscribe, unsubscribe);
      })();
      current.pending = work.finally(() => {
        const cur = registry.get(key);
        if (cur && cur.pending === work) {
          cur.pending = null;
        }
      });
    }
  };
}

/** Test helper: clear registry between tests */
export function __resetSubscriptionRegistry(): void {
  registry.clear();
}

/** Test helper: current ref-count for a collection */
export function __getSubscriptionCount(collection: string): number {
  return registry.get(collection)?.count ?? 0;
}

/** Test helper: merged operations for a collection */
export function __getSubscriptionOps(collection: string): string[] {
  return registry.get(collection)?.operations.slice() ?? [];
}
