import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { registerFocusedReload } from "@/hooks/refresh-scope";
import { onRealtime } from "@/services/realtime";
import type { RealtimeEventType } from "@/data/events";

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
  options: {
    refetchOnFocus?: boolean;
    pollMs?: number;
    /**
     * Event types that mean this data is out of date.
     *
     * The event is a hint to refetch, never the new value: the server stays
     * the only thing that decides what this person may see. `resync` is added
     * automatically — a screen that refetches on a seat request must also
     * refetch when the connection admits it lost track.
     */
    liveOn?: RealtimeEventType[];
  } = {},
): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Held in a ref so changing the fetcher identity every render does not
  // retrigger the effect; `deps` is what decides when to refetch.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const cancelled = useRef(false);

  const hasData = useRef(false);
  // Only the latest call may write: a slow poll must not overwrite a newer
  // answer, e.g. the list fetched right after accepting a request.
  const latest = useRef(0);

  const run = useCallback(async () => {
    // Only the first load shows a skeleton. A refetch keeps what is on
    // screen and swaps it when the new data lands, so nothing flickers.
    const call = ++latest.current;
    if (!hasData.current) setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (call !== latest.current) return;
      if (!cancelled.current) {
        hasData.current = true;
        setData(result);
      }
    } catch (err) {
      // A background refetch that fails keeps what is already on screen; the
      // error state is for when there is nothing to show.
      if (call !== latest.current || hasData.current) return;
      if (!cancelled.current) {
        setError(err instanceof Error ? err : new Error("Something went wrong"));
      }
    } finally {
      if (!cancelled.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelled.current = false;
    // New inputs mean different data: start clean rather than showing the
    // old result under the new question.
    hasData.current = false;
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

  // Legacy fallback for any screen not yet moved onto `liveOn`. Live updates
  // are the mechanism now; polling is what this replaced.
  useFocusEffect(
    useCallback(() => {
      if (!options.pollMs) return;
      const timer = setInterval(run, options.pollMs);
      return () => clearInterval(timer);
    }, [options.pollMs, run]),
  );

  // Live updates. Subscribed for as long as the screen is mounted rather than
  // only while focused: a request answered while the person is two screens
  // deep should be correct when they come back, without the stale frame a
  // focus-triggered refetch always shows first.
  const liveOn = options.liveOn;
  useEffect(() => {
    if (!liveOn || liveOn.length === 0) return;
    return onRealtime([...liveOn, "resync"], () => run());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, liveOn?.join(",")]);

  // Available to pull-to-refresh while this screen is the one in front.
  useFocusEffect(useCallback(() => registerFocusedReload(run), [run]));

  return { data, loading, error, reload: run, set: setData };
}
