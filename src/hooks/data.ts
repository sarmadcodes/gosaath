import { useAsync } from "@/hooks/use-async";
import { api } from "@/services";
import type { RideSearch } from "@/services";
import type { Weekday } from "@/data/types";

/**
 * Domain hooks. Screens use these rather than calling `api` directly, so the
 * fetch shape for a given piece of data is defined once and every screen that
 * shows it stays consistent.
 */

export function useMe() {
  return useAsync(() => api.me.get(), []);
}

export function useCommute() {
  return useAsync(() => api.commutes.mine(), [], { refetchOnFocus: true });
}

export function useCommuteWeek(commuteId?: string) {
  return useAsync(
    () => (commuteId ? api.commuteWeek.week(commuteId) : Promise.resolve([])),
    [commuteId],
    { refetchOnFocus: true, pollMs: 30_000 },
  );
}

export function useCommuteMembers(commuteId?: string) {
  return useAsync(
    () => (commuteId ? api.commuteWeek.members(commuteId) : Promise.resolve([])),
    [commuteId],
    { refetchOnFocus: true, pollMs: 30_000 },
  );
}

export function useMatchSummary() {
  return useAsync(() => api.matches.summary(), [], { refetchOnFocus: true, pollMs: 30_000 });
}

export function useMatches() {
  return useAsync(() => api.matches.list(), []);
}

export function useRideSearch(params: RideSearch) {
  return useAsync(() => api.rides.search(params), [JSON.stringify(params)]);
}

export function useNearbyRides(day?: Weekday) {
  return useAsync(() => api.rides.nearby({ day }), [day]);
}

export function useRide(id?: string) {
  return useAsync(
    () => (id ? api.rides.get(id) : Promise.resolve(null)),
    [id],
  );
}

export function useIncomingRequests() {
  return useAsync(() => api.rides.incomingRequests(), [], {
    refetchOnFocus: true,
    pollMs: 15_000,
  });
}

export function useSentRequests() {
  return useAsync(() => api.rides.sentRequests(), [], {
    refetchOnFocus: true,
    pollMs: 15_000,
  });
}

export function useReplacements(commuteId?: string, day?: Weekday) {
  return useAsync(
    () =>
      commuteId && day
        ? api.commuteWeek.replacements(commuteId, day)
        : Promise.resolve([]),
    [commuteId, day],
  );
}

export function useVehicles() {
  return useAsync(() => api.vehicles.list(), [], { refetchOnFocus: true });
}

export function useNotifications() {
  return useAsync(() => api.notifications.list(), [], {
    refetchOnFocus: true,
    pollMs: 15_000,
  });
}

export function useBlocked() {
  return useAsync(() => api.safety.blocked(), [], { refetchOnFocus: true });
}

export function usePreferences() {
  return useAsync(() => api.preferences.get(), []);
}
