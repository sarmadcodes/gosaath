import { onSessionChange } from "@/services/http";

/**
 * What every screen already fetched, kept so it does not have to again.
 *
 * Without this, each screen's data lives inside its own hook instance. Walking
 * Home → Rides → Home unmounts and remounts the hook, so the second visit to
 * Home starts with nothing and shows a skeleton for data that was on screen a
 * second earlier. The app felt slow not because the requests were slow but
 * because it threw away every answer the moment you looked away.
 *
 * So: paint from the last answer immediately, fetch in the background, swap
 * when the new one lands. Stale-while-revalidate. The screen is never wrong
 * for long and never blank for a request that has already been made once.
 *
 * Deliberately not Redux. Redux is a store for state the app owns and
 * mutates; this is a cache of state the *server* owns, where the hard parts
 * are staleness, deduplication and invalidation rather than reducers. A
 * cached copy of a server answer in a Redux store is this file with more
 * ceremony. The real alternative is TanStack Query, which `useAsync` is
 * already shaped like — this is the subset of it the app actually uses.
 */

type Entry = { value: unknown; at: number };

const entries = new Map<string, Entry>();

/**
 * How long a cached answer may be shown before it is only a placeholder.
 *
 * Past this it is still painted immediately — a slightly old screen beats a
 * blank one — but the refetch is no longer optional. Under it, a screen that
 * was just visited does not hit the network at all.
 */
const FRESH_MS = 30_000;

export function readCache<T>(key: string): { value: T; fresh: boolean } | undefined {
  const entry = entries.get(key);
  if (!entry) return undefined;
  return {
    value: entry.value as T,
    fresh: Date.now() - entry.at < FRESH_MS,
  };
}

export function writeCache(key: string, value: unknown): void {
  entries.set(key, { value, at: Date.now() });
  for (const listener of listeners) listener(key);
}

/**
 * Replaces a cached answer without a request.
 *
 * For a mutation whose response already *is* the new state — uploading a
 * photo returns the updated user, so the profile screen has no reason to ask
 * the server what it just told it. Every mounted hook on that key re-renders
 * with the new value straight away.
 */
export function setCache<T>(key: string, value: T): void {
  writeCache(key, value);
}

/** Marks keys stale so the next mount refetches rather than trusting them. */
export function invalidateCache(prefix: string): void {
  for (const key of entries.keys()) {
    if (key === prefix || key.startsWith(`${prefix}:`)) entries.delete(key);
  }
}

type Listener = (key: string) => void;
const listeners = new Set<Listener>();

export function onCacheWrite(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Signing out has to empty this. Everything in here is one person's data, and
// the next person to sign in on this device must not see a frame of it.
onSessionChange(() => {
  entries.clear();
});
