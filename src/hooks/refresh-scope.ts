import { useCallback, useState } from "react";

/**
 * Pull to refresh, for every screen, without every screen wiring it up.
 *
 * Each `useAsync` registers its reload while its screen is focused and drops
 * it on blur. `Screen` pulling down reruns whatever is registered — which is
 * exactly the data on the screen in front of you — and the spinner stays
 * until the slowest has come back.
 */
type Reload = () => Promise<void>;

const focused = new Set<Reload>();

export function registerFocusedReload(reload: Reload) {
  focused.add(reload);
  return () => {
    focused.delete(reload);
  };
}

export function usePullToRefresh() {
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([...focused].map((reload) => reload()));
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { refresh, refreshing };
}
