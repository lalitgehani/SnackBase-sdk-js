/**
 * Lightweight collection invalidation bus for optional mutation → query refresh.
 * Not a full cache: subscribers (useQuery / useRecord) register refetch callbacks.
 *
 * Default: mutations do NOT invalidate (invalidateOnSuccess defaults to false).
 */

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribeInvalidation(collection: string, listener: Listener): () => void {
  let set = listeners.get(collection);
  if (!set) {
    set = new Set();
    listeners.set(collection, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) {
      listeners.delete(collection);
    }
  };
}

export function invalidateCollection(collection: string): void {
  const set = listeners.get(collection);
  if (!set) return;
  // Copy to tolerate unsub during notify
  for (const listener of [...set]) {
    try {
      listener();
    } catch {
      // Ignore listener errors so one bad refetch does not block others
    }
  }
}

/** Test helper */
export function __resetInvalidation(): void {
  listeners.clear();
}
