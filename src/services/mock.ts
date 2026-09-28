import type {
  Api,
  AuthSession,
  CommuteInput,
  MatchPreferences,
  RegisterInput,
  RideSearch,
} from "@/services/api";
import { KEYS, clearSessionData, readJson, writeJson } from "@/services/storage";
import {
  onScenarioChange,
  scenario,
  scenarioReady,
} from "@/services/scenarios";
import { areas } from "@/data/areas";
import {
  campusById,
  campusesFor,
  institutionById,
  searchInstitutions,
} from "@/data/institutions";
import {
  commuteMatches,
  commuteMembers,
  commuteWeek as seedWeek,
  currentUser,
  myCommute,
  notifications as seedNotifications,
  rideListings,
  seatRequests,
} from "@/data/content";
import type {
  AppNotification,
  Commute,
  CommuteDay,
  CommuteMatch,
  MatchSummary,
  PublicUser,
  RideListing,
  SeatRequest,
  User,
  Vehicle,
  Weekday,
} from "@/data/types";

/**
 * In-memory implementation used until the Node/Mongo backend exists.
 *
 * It serves the real sample content rather than empty arrays, so every screen
 * can be wired through this layer today and behave exactly as it will against
 * a live API. Mutations are held in module state for the session, which is
 * enough to make accept, skip and block feel real while clicking through.
 *
 * Calls are deliberately delayed so loading states are reachable.
 */

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Session-lived mutable state
// ---------------------------------------------------------------------------

let session: AuthSession | null = null;
let commute: Commute | null = null;
let week: CommuteDay[] = [];
let vehicles: Vehicle[] = [];
let requests: SeatRequest[] = [];
let notifications: AppNotification[] = [];
let blocked: PublicUser[] = [];
let sent: SeatRequest[] = [];
/** Ride ids already asked about, so a duplicate request is refused. */
let sentRideIds = new Set<string>();

/**
 * Whose number the signed-in user may see.
 *
 * SYSTEM.md 4.5.3: only once a seat request between the two has been
 * accepted. Mirrors the server, so developing against the mock cannot teach a
 * screen a rule the real backend does not follow.
 */
function mayContact(userId: string) {
  return [...requests, ...sent].some(
    (r) => r.status === "accepted" && r.user.id === userId,
  );
}
let pendingRegistration: RegisterInput | null = null;

/**
 * Rebuilds every collection from the active scenario. Called at startup and
 * whenever the scenario changes, so switching to "brand-new account" empties
 * the app exactly as a real new account would be.
 */
function resetState() {
  const s = scenario();
  commute = s.hasCommute ? myCommute : null;
  week =
    s.week === "none"
      ? []
      : s.week === "driverUnavailable"
        ? seedWeek.map((d, i) => (i === 2 ? { ...d, status: "noDriver" } : d))
        : [...seedWeek];
  vehicles = [];
  requests = s.incomingRequests ? [...seatRequests] : [];
  sent = [];
  sentRideIds = new Set();
  notifications = s.notifications ? [...seedNotifications] : [];
  blocked = [];
}

resetState();
onScenarioChange(resetState);
// The stored scenario arrives a tick later than module load, so rebuild once
// it is known rather than serving the default in the meantime.
scenarioReady.then(resetState);

/**
 * Every read funnels through this: it waits for the active scenario to be
 * resolved, adds the latency that makes loading states reachable, and fails
 * the whole surface when the failing scenario is selected.
 */
async function guard(ms = 350) {
  await scenarioReady;
  await delay(ms);
  if (scenario().failing) {
    throw new Error("We could not reach GoSaath. Check your connection.");
  }
}

let preferences: MatchPreferences = {
  womenOnly: false,
  verifiedOnly: false,
  carsOnly: false,
  sameCampusOnly: true,
  autoAcceptVerified: false,
  pickupRadius: "Nearby areas",
  timeWindow: "Within 30 minutes",
};

function makeUser(input: RegisterInput): User {
  return {
    id: "user-me",
    name: input.name,
    email: input.email,
    phone: input.phone,
    photoUrl: input.photoUrl ?? null,
    userType: input.userType,
    institutionId: input.institutionId,
    campusId: input.campusId,
    areaId: input.areaId,
    badgeStatus: "none",
    additionalInstitutionIds: [],
  };
}

/**
 * Screens read the signed-in user through this. Falls back to the sample
 * profile so the app is explorable without going through registration first.
 */
function activeUser(): User {
  return session?.user ?? currentUser;
}

async function persist(next: AuthSession | null) {
  session = next;
  if (next) await writeJson(KEYS.session, next);
  else await clearSessionData();
}

export const mockApi: Api = {
  auth: {
    async register(input) {
      await delay();
      pendingRegistration = input;
      return { pendingEmail: input.email };
    },

    async verifyEmailOtp(email, code) {
      await delay();
      // 000000 exercises the error path in the UI.
      if (code === "000000") throw new Error("That code is not right.");
      if (!pendingRegistration || pendingRegistration.email !== email) {
        throw new Error("No registration in progress for this email.");
      }
      const next: AuthSession = {
        token: "mock-token",
        user: makeUser(pendingRegistration),
      };
      pendingRegistration = null;
      // A brand new account starts without a commute.
      commute = null;
      week = [];
      await persist(next);
      return next;
    },

    async resendOtp() {
      await delay(200);
    },

    async login(email, password) {
      await delay();
      if (!password) throw new Error("Enter your password.");
      const stored = await readJson<AuthSession>(KEYS.session);
      if (stored && stored.user.email.toLowerCase() === email.toLowerCase()) {
        await persist(stored);
        return stored;
      }
      // Falls back to the sample account so the app stays explorable.
      const next: AuthSession = { token: "mock-token", user: currentUser };
      resetState();
      await persist(next);
      return next;
    },

    async requestPasswordReset() {
      await delay(200);
    },

    async logout() {
      await persist(null);
      resetState();
    },

    async restore() {
      await scenarioReady;

      // A signed-out scenario must actually be signed out, even if a session
      // from an earlier scenario is still sitting in storage.
      if (!scenario().signedIn) {
        session = null;
        await clearSessionData();
        return null;
      }

      const stored = await readJson<AuthSession>(KEYS.session);
      // Signed-in scenarios are explorable without going through sign-up, so
      // a missing session resolves to the sample account rather than bouncing
      // the developer back to the login screen.
      const next: AuthSession = stored ?? {
        token: "mock-token",
        user: currentUser,
      };
      session = next;
      if (!stored) await writeJson(KEYS.session, next);
      return next;
    },
  },

  institutions: {
    async search(query, type) {
      await delay(120);
      return searchInstitutions(query, type);
    },
    async campuses(institutionId) {
      await delay(120);
      return campusesFor(institutionId);
    },
    async request(input) {
      await delay();
      return {
        id: `req-${Date.now()}`,
        ...input,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
    },
  },

  me: {
    async get() {
      await guard(150);
      return { ...activeUser(), badgeStatus: scenario().badgeStatus };
    },
    async update(patch) {
      await delay();
      const user = { ...activeUser(), ...patch };
      if (session) await persist({ ...session, user });
      return user;
    },
    async setPhoto(uri) {
      await delay();
      const user = { ...activeUser(), photoUrl: uri };
      if (session) await persist({ ...session, user });
      return user;
    },
    async requestBadge() {
      await delay();
      const user: User = { ...activeUser(), badgeStatus: "pending" };
      if (session) await persist({ ...session, user });
      return user;
    },
    async addInstitution(institutionId) {
      await delay();
      const current = activeUser();
      const ids = new Set(current.additionalInstitutionIds);
      ids.add(institutionId);
      const user = { ...current, additionalInstitutionIds: [...ids] };
      if (session) await persist({ ...session, user });
      return user;
    },
    async removeInstitution(institutionId) {
      await delay();
      const current = activeUser();
      const user = {
        ...current,
        additionalInstitutionIds: current.additionalInstitutionIds.filter(
          (id) => id !== institutionId,
        ),
      };
      if (session) await persist({ ...session, user });
      return user;
    },
  },

  commutes: {
    async mine() {
      await guard(200);
      return commute;
    },
    async create(input: CommuteInput) {
      await delay();
      const next: Commute = {
        id: "commute-me",
        ownerId: activeUser().id,
        status: "active",
        ...input,
      };
      commute = next;
      // A fresh commute materialises its week, the way the nightly job will.
      week = input.schedule.map((entry, index) => ({
        day: entry.day,
        date: `${15 + index} Sep`,
        status: "pending",
      }));
      return next;
    },
    async update(_id, patch) {
      await delay();
      if (!commute) throw new Error("No commute to update");
      commute = { ...commute, ...patch };
      return commute;
    },
    async cancel() {
      await delay();
      commute = null;
      week = [];
    },
  },

  commuteWeek: {
    async week() {
      await guard(200);
      return week;
    },
    async members() {
      await guard(200);
      if (!commute || !scenario().members) return [];
      // Group members can reach each other; that is the point of a group.
      return commuteMembers.map((m) => ({
        ...m,
        contactPhone: CONTACT_NUMBERS[m.user.id],
      }));
    },
    async skipDay(_id, day) {
      await delay(250);
      week = week.map((d) => (d.day === day ? { ...d, status: "skipped" } : d));
      return week;
    },
    async setUnavailable(_id, days) {
      await delay();
      // Clearing the driver orphans those days, exactly as the real engine does.
      week = week.map((d) =>
        days.includes(d.day) ? { ...d, status: "noDriver" } : d,
      );
      return week;
    },
    async replacements() {
      await guard();
      return scenario().rides ? rideListings : [];
    },
  },

  matches: {
    async summary(): Promise<MatchSummary> {
      await guard(250);
      const user = activeUser();
      const campusName = institutionById(user.institutionId)?.shortName ?? "";
      const forced = scenario().matchState;

      // The state is computed by the server, never inferred by the UI from an
      // empty array — it cannot tell "nobody here yet" from "no day overlap".
      if (forced) {
        const count =
          forced === "matches" && scenario().matches === "all"
            ? commuteMatches.filter((m) => m.matchingDays.length > 0).length
            : 0;
        return { state: forced, count, campusName };
      }

      if (!commute || commute.schedule.length === 0) {
        return { state: "noCommute", count: 0, campusName };
      }

      if (scenario().matches === "none") {
        return { state: "none", count: 0, campusName };
      }

      const usable = commuteMatches.filter((m) => m.matchingDays.length > 0);
      if (usable.length > 0) {
        return { state: "matches", count: usable.length, campusName };
      }

      const sharesADay = commuteMatches.some((m) =>
        m.schedule.some((entry) =>
          commute!.schedule.some((mine) => mine.day === entry.day),
        ),
      );
      return {
        state: sharesADay ? "noTimeMatch" : "noDayMatch",
        count: 0,
        campusName,
      };
    },

    async list(): Promise<CommuteMatch[]> {
      await guard(300);
      if (scenario().matches === "none") return [];
      const blockedIds = new Set(blocked.map((b) => b.id));
      const mine = commute?.originAreaId;
      return commuteMatches
        .filter((m) => !blockedIds.has(m.user.id))
        .map((m) => {
          const theirArea = areas.find((a) => a.name === m.area);
          // The backend will carry this on the match itself; here it is
          // resolved from the listings by driver.
          const listing = rideListings.find((r) => r.driver.id === m.user.id);
          const seatsTaken =
            listing && listing.seatsAvailable
              ? Math.max(0, 2 - listing.seatsAvailable)
              : undefined;
          return {
            ...m,
            rideId: listing?.id,
            seatsTaken,
            ...(mayContact(m.user.id)
              ? { contactPhone: CONTACT_NUMBERS[m.user.id] }
              : {}),
            ...(mine && theirArea
              ? { proximity: estimateBetween(mine, theirArea.id) }
              : {}),
          };
        });
    },

    async setAreaMatch(matchId, status) {
      await delay(150);
      const match = commuteMatches.find((m) => m.id === matchId);
      return { ...(match as CommuteMatch), areaMatch: status };
    },
  },

  rides: {
    async search(params: RideSearch): Promise<RideListing[]> {
      await guard();
      if (!scenario().rides) return [];
      const blockedIds = new Set(blocked.map((b) => b.id));
      return rideListings.filter((ride) => {
        if (blockedIds.has(ride.driver.id)) return false;
        if (params.womenOnly && !ride.womenOnly) return false;
        if (params.vehicleType && ride.vehicleType !== params.vehicleType) {
          return false;
        }
        if (params.day && !ride.schedule.some((s) => s.day === params.day)) {
          return false;
        }
        return true;
      });
    },

    async nearby({ day }) {
      await guard(300);
      if (!scenario().rides) return [];
      const blockedIds = new Set(blocked.map((b) => b.id));
      const mine = commute?.originAreaId;
      return rideListings.filter((ride) => {
        if (blockedIds.has(ride.driver.id)) return false;
        // Campus is still a hard constraint here. Only time is relaxed.
        if (!ride.sameCampus) return false;
        if (day && !ride.schedule.some((s) => s.day === day)) return false;

        // "Nearby" has to mean something, or the list is just everyone.
        if (mine) {
          const theirArea = areas.find((a) => a.name === ride.originArea);
          if (!theirArea) return false;
          const { distanceKm } = estimateBetween(mine, theirArea.id);
          if (distanceKm !== undefined && distanceKm > NEARBY_RADIUS_KM) {
            return false;
          }
        }
        return true;
      });
    },

    async get(id) {
      await delay(200);
      return rideListings.find((r) => r.id === id) ?? null;
    },

    async requestSeat(rideId, seats) {
      await delay();
      const ride = rideListings.find((r) => r.id === rideId);
      if (!ride) throw new Error("That ride was not found.");

      // The same refusals the real backend applies. A mock that accepts
      // everything trains the UI against behaviour that does not exist, and
      // the error states then get discovered in production.
      if (ride.driver.id === activeUser().id) {
        throw new Error("That is your own ride.");
      }
      if (sentRideIds.has(rideId)) {
        throw new Error("You have already asked for a seat on this ride.");
      }
      if (seats > ride.seatsAvailable) {
        throw new Error("There are not that many seats left.");
      }

      const request: SeatRequest = {
        id: `req-${Date.now()}`,
        user: {
          id: activeUser().id,
          firstName: activeUser().name.split(" ")[0]!,
          verified: true,
        },
        originArea: ride.originArea,
        destinationCampus: ride.destinationCampus,
        schedule: ride.schedule,
        direction: ride.direction,
        seats,
        contribution: ride.contribution,
        status: "pending",
      };

      // Kept beside the list rather than on the request: `SeatRequest` is the
      // client contract, and the mock has no business widening it.
      sentRideIds.add(rideId);
      sent = [...sent, request];
      return request;
    },

    async incomingRequests() {
      await guard(250);
      // Pending and accepted, matching the server: an answered request stays
      // visible briefly so the list does not appear to swallow what was just
      // acted on.
      return requests.filter(
        (r) => r.status === "pending" || r.status === "accepted",
      );
    },

    async sentRequests() {
      await guard(250);
      return sent;
    },

    async respondToRequest(requestId, action) {
      await delay(250);
      const existing = requests.find((r) => r.id === requestId);
      if (!existing) throw new Error("That request was not found.");

      // pending is the only answerable state. A declined request must never
      // become accepted by a second tap — the rule the server enforces with a
      // guarded update.
      if (existing.status !== "pending") {
        throw new Error("That request has already been answered.");
      }

      // Capacity is deliberately not modelled here: the sample incoming
      // requests are not tied to a listing, and inventing an arithmetic the
      // server does differently would be worse than leaving it out.
      requests = requests.map((r) =>
        r.id === requestId
          ? { ...r, status: action === "accept" ? "accepted" : "declined" }
          : r,
      );
      return requests.find((r) => r.id === requestId)!;
    },
  },

  vehicles: {
    async list() {
      await guard(200);
      return vehicles;
    },
    async save(input) {
      await delay();
      const next: Vehicle = {
        id: input.id ?? `veh-${Date.now()}`,
        ownerId: activeUser().id,
        type: input.type,
        model: input.model,
        plate: input.plate,
        colour: input.colour,
        imageUrl: input.imageUri ?? null,
      };
      vehicles = [...vehicles.filter((v) => v.id !== next.id), next];
      return next;
    },
    async remove(id) {
      await delay(200);
      vehicles = vehicles.filter((v) => v.id !== id);
    },
  },

  areas: {
    async list(city) {
      await delay(100);
      return city ? areas.filter((a) => a.city === city) : areas;
    },
  },

  /**
   * Stand-in for the future Google Maps-backed service.
   *
   * Everything here is an approximation over the static area list and is
   * labelled as such (`approximate: true`) so the UI never presents it as a
   * routed result. It exists to shape the screens, not to be correct.
   */
  location: {
    async search(query) {
      await guard(150);
      const q = query.trim().toLowerCase();
      const pool = q
        ? areas.filter((a) => a.name.toLowerCase().includes(q))
        : areas;
      return pool.slice(0, 8).map((a) => ({
        areaId: a.id,
        name: a.name,
        city: a.city,
        hint: LANDMARKS[a.id],
      }));
    },

    async recent() {
      await guard(120);
      const seen = recentAreaIds
        .map((id) => areas.find((a) => a.id === id))
        .filter(Boolean);
      return seen.map((a) => ({
        areaId: a!.id,
        name: a!.name,
        city: a!.city,
        hint: LANDMARKS[a!.id],
      }));
    },

    async proximity(fromAreaId, toAreaId) {
      await guard(200);
      return estimateBetween(fromAreaId, toAreaId);
    },

    async route(originAreaId, campusId) {
      await guard(200);
      const origin = areas.find((a) => a.id === originAreaId);
      const campus = campusById(campusId);
      return {
        originArea: origin?.name ?? "",
        destinationCampus: campus?.name ?? "",
        via: CORRIDORS[originAreaId],
        estimate: campus?.areaId
          ? estimateBetween(originAreaId, campus.areaId)
          : undefined,
      };
    },
  },

  notifications: {
    async list() {
      await guard(250);
      return notifications;
    },
    async registerPushToken() {
      await delay(120);
    },
    async unregisterPushToken() {
      await delay(120);
    },
    async markRead(id) {
      await delay(120);
      notifications = notifications.map((n) =>
        n.id === id ? { ...n, unread: false } : n,
      );
    },
  },

  safety: {
    async report() {
      await delay();
    },
    async block(userId) {
      await delay(250);
      const person =
        commuteMatches.find((m) => m.user.id === userId)?.user ??
        rideListings.find((r) => r.driver.id === userId)?.driver;
      if (person && !blocked.some((b) => b.id === person.id)) {
        blocked = [...blocked, person];
      }
    },
    async unblock(userId) {
      await delay(200);
      blocked = blocked.filter((b) => b.id !== userId);
    },
    async blocked() {
      await guard(200);
      return blocked;
    },
  },

  support: {
    async submit() {
      await guard();
      // The reference is what the user quotes when they follow up, so it is
      // short and readable rather than a raw id.
      const n = Math.floor(Math.random() * 9000) + 1000;
      return { reference: `GS-${n}` };
    },
  },

  preferences: {
    async get() {
      await guard(150);
      return preferences;
    },
    async update(patch) {
      await delay(150);
      preferences = { ...preferences, ...patch };
      return preferences;
    },
  },
};

/**
 * Landmarks and corridors, so route descriptions read like a person wrote
 * them. Placeholder data for the mock only.
 */
const LANDMARKS: Record<string, string> = {
  "area-gulshan": "Near NIPA Chowrangi",
  "area-johar": "Near Johar Mor",
  "area-clifton": "Near Teen Talwar",
  "area-dha-2": "Near Korangi Road",
  "area-pechs": "Near Shahrah-e-Faisal",
  "area-nazimabad": "Near Board Office",
  "area-tariq-road": "Near Dolmen Mall",
};

const CORRIDORS: Record<string, string> = {
  "area-gulshan": "Route near Shahrah-e-Faisal",
  "area-johar": "Route near Rashid Minhas Road",
  "area-nazimabad": "Route near Lasbela",
  "area-pechs": "Route near Shahrah-e-Faisal",
};

const recentAreaIds = ["area-gulshan", "area-clifton", "area-dha-2"];

/**
 * Numbers served only alongside a match or a group membership. The real
 * backend reads these from the user record and must apply the same gate.
 */
const CONTACT_NUMBERS: Record<string, string> = {
  "u-zainab": "0300 2145566",
  "u-danish": "0321 8843210",
  "u-hina": "0333 7719004",
  "u-ahmed": "0301 4456712",
  "u-areeba": "0345 9903318",
  "u-bilal": "0311 6620945",
};

/**
 * A deliberately coarse estimate. Rounded to five-minute steps because a
 * minute-accurate figure would imply a routing precision this does not have.
 */
/**
 * How far apart two areas can be and still count as "nearby".
 *
 * Three kilometres is roughly a detour a driver will actually make on a route
 * they were already taking. Beyond that the pickup stops being incidental and
 * starts being a favour, which is not what this list is for.
 */
export const NEARBY_RADIUS_KM = 3;

function estimateBetween(fromAreaId: string, toAreaId: string) {
  const a = areas.findIndex((x) => x.id === fromAreaId);
  const b = areas.findIndex((x) => x.id === toAreaId);
  if (a < 0 || b < 0) {
    return { label: "Nearby", approximate: true as const };
  }
  const steps = Math.abs(a - b);
  // Placeholder geometry: the real service returns a routed distance.
  const distanceKm = Math.round(steps * 1.4 * 10) / 10;
  const minutes = Math.max(5, Math.round((steps * 4 + 6) / 5) * 5);
  return {
    label: `~${minutes} min away`,
    overlapHint: CORRIDORS[fromAreaId],
    distanceKm,
    approximate: true as const,
  };
}

/** Weekdays the commute currently covers, for screens that need it. */
export function commuteDays(): Weekday[] {
  return commute?.schedule.map((s) => s.day) ?? [];
}
