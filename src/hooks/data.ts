import { useAsync } from "@/hooks/use-async";
import { api } from "@/services";
import type { RideSearch } from "@/services";
import type { InstitutionType, Weekday } from "@/data/types";
import { WOMEN_ONLY_ENABLED } from "@/data/flags";

/**
 * Domain hooks. Screens use these rather than calling `api` directly, so the
 * fetch shape for a given piece of data is defined once and every screen that
 * shows it stays consistent.
 *
 * `liveOn` is where the app stopped polling. Anything another person can
 * change — a request answered, a seat taken, a driver dropping out — used to be
 * re-fetched on a timer, which meant a fifteen-second window in which the
 * screen was confidently wrong, and a request every fifteen seconds from every
 * phone whether anything had happened or not. Now the server says when.
 */

/**
 * The institutions and campuses a person may register into.
 *
 * The server is the source of truth for WHICH exist and are active — an
 * institution activated by an admin has to appear here without an app
 * release. The local registry in `@/data/institutions` stays, but only for
 * presentation: logos and the accent colour.
 */
export function useInstitutionSearch(query: string, type?: InstitutionType) {
  return useAsync(() => api.institutions.search(query, type), [query, type]);
}

export function useCampuses(institutionId?: string) {
  return useAsync(
    () => (institutionId ? api.institutions.campuses(institutionId) : Promise.resolve([])),
    [institutionId],
  );
}

export function useMe() {
  return useAsync(() => api.me.get(), [], {
    key: "me",
    // The verified badge is decided by an admin, so it changes while the person
    // is doing nothing at all.
    liveOn: ["verification.updated", "account.suspended", "account.restored"],
  });
}

/**
 * Whether this person may create, see and join women-only rides: the
 * feature is on and they have declared themselves a woman. The server
 * enforces the same rule; this only decides which controls to draw.
 */
export function useWomenOnlyAvailable(): boolean {
  const { data: me } = useMe();
  return WOMEN_ONLY_ENABLED && me?.gender === "woman";
}

export function useCommute() {
  return useAsync(() => api.commutes.mine(), [], {
    key: "commute",
    refetchOnFocus: true,
    liveOn: [
      "commute.updated",
      "ride.confirmed",
      "ride.cancelled",
      "driverUnavailable",
      "driverAvailable",
    ],
  });
}

export function useCommuteWeek(commuteId?: string) {
  return useAsync(
    () => (commuteId ? api.commuteWeek.week(commuteId) : Promise.resolve([])),
    [commuteId],
    {
      key: `week:${commuteId ?? "none"}`,
      refetchOnFocus: true,
      liveOn: [
        "ride.confirmed",
        "ride.cancelled",
        "ride.updated",
        "ride.seatsChanged",
        "driverUnavailable",
        // A driver putting a day back on changes the same screens that
        // standing it down changed, so it has to travel the same way.
        "driverAvailable",
        "commute.updated",
      ],
    },
  );
}

export function useCommuteMembers(commuteId?: string) {
  return useAsync(
    () => (commuteId ? api.commuteWeek.members(commuteId) : Promise.resolve([])),
    [commuteId],
    {
      key: `members:${commuteId ?? "none"}`,
      refetchOnFocus: true,
      // A cancelled acceptance removes somebody from the group, which this
      // list is exactly what shows.
      liveOn: [
        "seatRequest.accepted",
        "seatRequest.cancelled",
        "ride.confirmed",
        "ride.cancelled",
        "driverAvailable",
      ],
    },
  );
}

export function useMatchSummary() {
  return useAsync(() => api.matches.summary(), [], {
    key: "matches:summary",
    refetchOnFocus: true,
    liveOn: ["match.created", "match.updated", "match.removed"],
  });
}

export function useMatches() {
  return useAsync(() => api.matches.list(), [], {
    key: "matches",
    liveOn: ["match.created", "match.updated", "match.removed"],
  });
}

export function useRideSearch(params: RideSearch) {
  return useAsync(() => api.rides.search(params), [JSON.stringify(params)]);
}

export function useNearbyRides(day?: Weekday) {
  return useAsync(() => api.rides.nearby({ day }), [day], {
    key: `rides:nearby:${day ?? "any"}`,
  });
}

export function useRide(id?: string) {
  return useAsync(
    () => (id ? api.rides.get(id) : Promise.resolve(null)),
    [id],
    {
      // Seats especially: somebody looking at a ride while its last seat goes
      // should see it go, not find out by being refused.
      key: `ride:${id ?? "none"}`,
      liveOn: [
        "ride.updated",
        "ride.seatsChanged",
        "ride.cancelled",
        "seatRequest.accepted",
        // Returns a seat to the ride, so a full one becomes bookable again.
        "seatRequest.cancelled",
      ],
    },
  );
}

const REQUEST_EVENTS = [
  "seatRequest.created",
  "seatRequest.accepted",
  "seatRequest.declined",
  "seatRequest.cancelled",
] as const;

export function useIncomingRequests() {
  return useAsync(() => api.rides.incomingRequests(), [], {
    key: "requests:incoming",
    refetchOnFocus: true,
    liveOn: [...REQUEST_EVENTS],
  });
}

export function useSentRequests() {
  return useAsync(() => api.rides.sentRequests(), [], {
    key: "requests:sent",
    refetchOnFocus: true,
    liveOn: [...REQUEST_EVENTS],
  });
}

export function useReplacements(commuteId?: string, day?: Weekday) {
  return useAsync(
    () =>
      commuteId && day
        ? api.commuteWeek.replacements(commuteId, day)
        : Promise.resolve([]),
    [commuteId, day],
    { liveOn: ["replacementAvailable", "ride.seatsChanged", "ride.cancelled"] },
  );
}

export function useVehicles() {
  return useAsync(() => api.vehicles.list(), [], {
    key: "vehicles",
    refetchOnFocus: true,
  });
}

export function useNotifications() {
  return useAsync(() => api.notifications.list(), [], {
    key: "notifications",
    refetchOnFocus: true,
    liveOn: ["notification.created", "notification.read"],
  });
}

export function useBlocked() {
  return useAsync(() => api.safety.blocked(), [], {
    key: "blocked",
    refetchOnFocus: true,
    // So blocking somebody on one device removes them from the list on
    // another. The blocked person is told nothing, here or anywhere.
    liveOn: ["safety.blocked", "safety.unblocked"],
  });
}

export function usePreferences() {
  return useAsync(() => api.preferences.get(), []);
}
