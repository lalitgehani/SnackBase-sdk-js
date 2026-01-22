import { useState, useEffect } from 'react';
import { useSnackBase } from '../SnackBaseContext';


export interface UseSubscriptionResult {
  connected: boolean;
  error: Error | null;
}

export const useSubscription = <T = any>(
  collection: string,
  event: string, // e.g., 'create', 'update', 'delete', '*'
  callback: (data: any) => void
): UseSubscriptionResult => {
  const client = useSnackBase();
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      try {
        // Subscribe to collection
        await client.realtime.subscribe(collection, event === '*' ? undefined : [event]);
        setConnected(true);

        // Listen for events
        const eventType = event === '*' ? `${collection}.*` : `${collection}.${event}`;
        unsubscribe = client.realtime.on(eventType, (e: any) => {
          callback(e.data);
        });

      } catch (err: any) {
        setError(err);
        setConnected(false);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) unsubscribe();
      // Unsubscribe from collection on cleanup? 
      // Maybe not if other components are using it, but for now specific hook usage implies ownership?
      // SDK handles ref counting if implemented, or we just unsubscribe.
      client.realtime.unsubscribe(collection).catch(console.error);
    };
  }, [client, collection, event]); // Callback omitted from dependency to avoid re-subscribing on every render if callback is not memoized

  return { connected, error };
};
