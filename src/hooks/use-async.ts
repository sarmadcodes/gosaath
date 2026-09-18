import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

export type AsyncState<T> = {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  /** Refetch on demand, after a mutation or a retry. */
  reload: () => void;
  /** Optimistic local update, for a mutation that already succeeded. */
  set: (value: T) => void;
};

/**
 * Minimal async data hook.
 *
 * Every screen needs the same three things from a fetch: the data, whether it
 * is still coming, and whether it failed. Hand-rolling that in each screen is
 * where inconsistent loading and silent failures come from.
 *
 * The shape deliberately mirrors TanStack Query, so moving to it later is a
 * swap of this file rather than a rewrite of every screen.
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: { refetchOnFocus?: boolean } = {},
): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Held in a ref so changing the fetcher identity every render does not
  // retrigger the effect; `deps` is what decides when to refetch.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const cancelled = useRef(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (!cancelled.current) setData(result);
    } catch (err) {
      if (!cancelled.current) {
        setError(err instanceof Error ? err : new Error("Something went wrong"));
      }
    } finally {
      if (!cancelled.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelled.current = false;
    run();
    return () => {
      cancelled.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Screens that can be returned to after a mutation elsewhere refetch on
  // focus, so the list is never stale after editing on another screen.
  useFocusEffect(
    useCallback(() => {
      if (options.refetchOnFocus) run();
    }, [options.refetchOnFocus, run]),
  );

  return { data, loading, error, reload: run, set: setData };
}
