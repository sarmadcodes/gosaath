import { useSyncExternalStore } from "react";

/**
 * A counter that moves whenever the signed-in account changes.
 *
 * Anything that holds per-account state for the life of the app — the push
 * token registration, the institution accent — keys off this, so switching
 * accounts starts them over instead of carrying the previous person along.
 */
let epoch = 0;
const listeners = new Set<() => void>();

export function bumpSessionEpoch() {
  epoch += 1;
  listeners.forEach((listener) => listener());
}

export function useSessionEpoch() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => epoch,
  );
}
