import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { onCacheWrite, readCache, writeCache } from "@/hooks/cache";
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
    /**
     * Cache identity. Two hooks with the same key share an answer.
     *
     * Without one the hook still works and simply never caches, which is the
     * right default for anything whose freshness matters more than its
     * speed. Everything in `data.ts` passes one.
     */
    key?: string;
  } = {},
): AsyncState<T> {
  const cacheKey = options.key;

  // Seeded from the cache so a screen returned to paints on the first frame
  // instead of showing a skeleton for data it had a moment ago.
  const cached = cacheKey ? readCache<T>(cacheKey) : undefined;
  const [data, setData] = useState<T | undefined>(cached?.value);
  const [loading, setLoading] = useState(cached === undefined);
  const [error, setError] = useState<Error | null>(null);

  // Held in a ref so changing the fetcher identity every render does not
  // retrigger the effect; `deps` is what decides when to refetch.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const cancelled = useRef(false);

  const hasData = useRef(cached !== undefined);
  // Held so `run` can read them without being rebuilt, which would retrigger
  // every effect that depends on its identity.
  const cacheKeyRef = useRef(cacheKey);
  cacheKeyRef.current = cacheKey;
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
        if (cacheKeyRef.current) writeCache(cacheKeyRef.current, result);
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

    const hit = cacheKey ? readCache<T>(cacheKey) : undefined;
    if (hit) {
      // Paint what we have, then decide whether to ask again.
      hasData.current = true;
      setData(hit.value);
      setLoading(false);
      // A screen revisited within the freshness window does not touch the
      // network at all. Live updates and `reload` still override this, so
      // nothing can sit stale because of it.
      if (hit.fresh) return () => {
        cancelled.current = true;
      };
    } else {
      // New inputs mean different data: start clean rather than showing the
      // old result under the new question.
      hasData.current = false;
    }

    run();
    return () => {
      cancelled.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, cacheKey]);

  // A mutation elsewhere that writes this key straight into the cache — an
  // upload returning the updated user, say — updates this screen with no
  // request at all.
  useEffect(() => {
    if (!cacheKey) return;
    return onCacheWrite((written) => {
      if (written !== cacheKey) return;
      const hit = readCache<T>(cacheKey);
      if (!hit) return;
      hasData.current = true;
      // Compared by identity so this hook's own write, which already called
      // setData, does not cause a second render with the same value.
      setData((previous) => (previous === hit.value ? previous : hit.value));
      setLoading(false);
    });
  }, [cacheKey]);

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

  // An optimistic update has to reach the cache too. Otherwise navigating
  // away and back reverts it to the last server answer, which looks exactly
  // like the mutation silently failing.
  const set = useCallback(
    (value: T) => {
      hasData.current = true;
      setData(value);
      if (cacheKeyRef.current) writeCache(cacheKeyRef.current, value);
    },
    [],
  );

  return { data, loading, error, reload: run, set };
}
