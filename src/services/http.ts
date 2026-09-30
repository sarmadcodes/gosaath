import type {
  Api,
  AuthSession,
  CommuteInput,
  RegisterInput,
  RideSearch,
} from "@/services/api";
import type {
  AreaSuggestion,
  Campus,
  Commute,
  Institution,
  User,
} from "@/data/types";
import { KEYS, clearSessionData, readJson, writeJson } from "@/services/storage";

/**
 * The real backend, behind the same `Api` interface as the mock.
 *
 * Screens never see this file. Two jobs happen here that nothing else should
 * have to know about:
 *
 *   Tokens. `AuthSession.token` is the long-lived REFRESH token. It is stored;
 *   a short-lived access token is fetched from it and kept in memory only, and
 *   refreshed transparently when it expires. No screen ever handles either.
 *
 *   Reference ids. The app ships its own registry of institutions, campuses
 *   and areas — logos, colours, names — keyed like "inst-szabist". The server
 *   uses database ids. Every id of those three kinds is translated at this
 *   boundary, in both directions, from one table the server publishes at
 *   `/reference`. The ~45 places in the app that look things up by key keep
 *   working unchanged.
 */

export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

let session: AuthSession | null = null;
let accessToken: string | null = null;
let accessExpiresAt = 0;
let refreshing: Promise<string> | null = null;

async function storedSession(): Promise<AuthSession | null> {
  if (!session) session = await readJson<AuthSession>(KEYS.session);
  return session;
}

/**
 * Told whenever the app gains or loses a session.
 *
 * A callback rather than a direct call into the realtime client, which imports
 * this module for its token: wiring it the other way round would be a cycle.
 * It also means the live connection follows the session itself rather than a
 * screen remembering to start and stop it — there is no path to a signed-in
 * app with no stream, or a signed-out app still holding one open.
 */
type SessionListener = (signedIn: boolean) => void;
const sessionListeners = new Set<SessionListener>();

export function onSessionChange(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

async function saveSession(next: AuthSession | null) {
  session = next;
  accessToken = null;
  accessExpiresAt = 0;
  if (next) await writeJson(KEYS.session, next);
  else await clearSessionData();

  for (const listener of sessionListeners) {
    try {
      listener(next !== null);
    } catch {
      // Signing in must not fail because something downstream of it did.
    }
  }
}


// ---------------------------------------------------------------------------
// Times
// ---------------------------------------------------------------------------

/**
 * The app shows and picks times as "7:30 AM"; the server stores "07:30".
 * Converted here in both directions so neither side has to know.
 */
const TIME_KEYS = new Set(["arriveBy", "leaveCampusAt"]);

export function to24h(value: string): string {
  const m = /^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/.exec(value.trim());
  if (!m) return value;
  let hour = Number(m[1]) % 12;
  if (m[3]!.toUpperCase() === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${m[2]}`;
}

export function to12h(value: string): string {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return value;
  const hour = Number(m[1]);
  return `${hour % 12 === 0 ? 12 : hour % 12}:${m[2]} ${hour < 12 ? "AM" : "PM"}`;
}

function convertTimes(value: unknown, convert: (t: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => convertTimes(v, convert));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = TIME_KEYS.has(k) && typeof v === "string" ? convert(v) : convertTimes(v, convert);
    }
    return out;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

async function send<T>(
  method: Method,
  path: string,
  body?: unknown,
  token?: string | null,
): Promise<{ status: number; data: T }> {
  if (!BASE_URL) {
    throw new ApiError("The app is not configured with a server address.", 0);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/api/v1${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(convertTimes(body, to24h)) } : {}),
      signal: controller.signal,
    });
  } catch (error) {
    // A network failure is an error, never an empty result: the app draws a
    // retry state for this, and an empty list would claim there is nothing.
    const aborted = error instanceof Error && error.name === "AbortError";
    throw new ApiError(
      aborted
        ? "GoSaath is taking too long to respond. Try again."
        : "Could not reach GoSaath. Check your connection.",
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return { status: 204, data: undefined as T };

  const json = (await response.json().catch(() => ({}))) as {
    data?: T;
    error?: { message?: string; code?: string };
  };

  if (!response.ok) {
    throw new ApiError(
      json.error?.message ?? "Something went wrong. Try again.",
      response.status,
      json.error?.code,
    );
  }

  return { status: response.status, data: convertTimes(json.data, to12h) as T };
}

/**
 * A fresh access token, fetched from the stored refresh token when needed.
 *
 * Exported for the realtime client, which authenticates its stream with the
 * same token and must go through the same single-flight refresh — two
 * independent refreshes racing would have one of them rotate the refresh token
 * out from under the other, which the server correctly reads as token theft
 * and answers by revoking the whole chain.
 */
export async function currentAccessToken(): Promise<string> {
  if (accessToken && Date.now() < accessExpiresAt) return accessToken;

  // Concurrent requests share one refresh rather than each starting their own.
  if (!refreshing) {
    refreshing = (async () => {
      const stored = await storedSession();
      if (!stored) throw new ApiError("Sign in to continue.", 401);
      const { data } = await send<{ accessToken: string; expiresInMinutes: number }>(
        "POST",
        "/auth/refresh",
        { token: stored.token },
      );
      accessToken = data.accessToken;
      // A minute early, so a token never expires in flight.
      accessExpiresAt = Date.now() + Math.max(1, data.expiresInMinutes - 1) * 60_000;
      return data.accessToken;
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

async function authed<T>(method: Method, path: string, body?: unknown): Promise<T> {
  try {
    return (await send<T>(method, path, body, await currentAccessToken())).data;
  } catch (error) {
    // One retry on 401, with a freshly minted token. If that fails too the
    // session really is gone.
    if (error instanceof ApiError && error.status === 401) {
      accessToken = null;
      accessExpiresAt = 0;
      return (await send<T>(method, path, body, await currentAccessToken())).data;
    }
    throw error;
  }
}

const pub = async <T>(method: Method, path: string, body?: unknown) =>
  (await send<T>(method, path, body)).data;

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  return entries.length
    ? `?${entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&")}`
    : "";
};

// ---------------------------------------------------------------------------
// Reference id translation
// ---------------------------------------------------------------------------

type Kind = "areas" | "institutions" | "campuses";
type Maps = Record<Kind, { toServer: Map<string, string>; toApp: Map<string, string> }>;

let maps: Maps | null = null;
let loadingMaps: Promise<Maps> | null = null;

async function referenceMaps(): Promise<Maps> {
  if (maps) return maps;
  if (!loadingMaps) {
    loadingMaps = pub<Record<Kind, Array<{ id: string; key: string }>>>("GET", "/reference")
      .then((table) => {
        const build = (rows: Array<{ id: string; key: string }>) => ({
          toServer: new Map(rows.map((r) => [r.key, r.id])),
          toApp: new Map(rows.map((r) => [r.id, r.key])),
        });
        maps = {
          areas: build(table.areas),
          institutions: build(table.institutions),
          campuses: build(table.campuses),
        };
        return maps;
      })
      .finally(() => {
        loadingMaps = null;
      });
  }
  return loadingMaps;
}

/** App key → database id. Unknown values pass through untouched. */
async function out(kind: Kind, id: string | undefined): Promise<string | undefined> {
  if (!id) return id;
  return (await referenceMaps())[kind].toServer.get(id) ?? id;
}

/** Database id → app key. Unknown values pass through untouched. */
function back(kind: Kind, id: string | undefined): string | undefined {
  if (!id || !maps) return id;
  return maps[kind].toApp.get(id) ?? id;
}

async function userIn(user: User): Promise<User> {
  await referenceMaps();
  return {
    ...user,
    institutionId: back("institutions", user.institutionId)!,
    campusId: back("campuses", user.campusId)!,
    areaId: back("areas", user.areaId)!,
    additionalInstitutionIds: user.additionalInstitutionIds.map((id) => back("institutions", id)!),
  };
}

async function sessionIn(s: AuthSession): Promise<AuthSession> {
  return { ...s, user: await userIn(s.user) };
}

async function commuteIn(c: Commute): Promise<Commute> {
  await referenceMaps();
  return {
    ...c,
    institutionId: back("institutions", c.institutionId)!,
    campusId: back("campuses", c.campusId)!,
    originAreaId: back("areas", c.originAreaId)!,
  };
}

async function commuteOut<T extends Partial<CommuteInput>>(input: T): Promise<T> {
  return {
    ...input,
    ...(input.institutionId ? { institutionId: await out("institutions", input.institutionId) } : {}),
    ...(input.campusId ? { campusId: await out("campuses", input.campusId) } : {}),
    ...(input.originAreaId ? { originAreaId: await out("areas", input.originAreaId) } : {}),
  };
}

// ---------------------------------------------------------------------------
// The API
// ---------------------------------------------------------------------------

export const httpApi: Api = {
  uploads: {
    sign: (input) => authed("POST", "/uploads/sign", input),
  },

  auth: {
    async register(input: RegisterInput) {
      return pub("POST", "/auth/register", {
        ...input,
        photoUrl: input.photoUrl ?? undefined,
        institutionId: await out("institutions", input.institutionId),
        campusId: await out("campuses", input.campusId),
        areaId: await out("areas", input.areaId),
      });
    },
    async verifyEmailOtp(email, code) {
      const next = await sessionIn(await pub<AuthSession>("POST", "/auth/verify-otp", { email, code }));
      await saveSession(next);
      return next;
    },
    async resendOtp(email) {
      await pub("POST", "/auth/resend-otp", { email });
    },
    async login(email, password) {
      const next = await sessionIn(await pub<AuthSession>("POST", "/auth/login", { email, password }));
      await saveSession(next);
      return next;
    },
    async requestPasswordReset(email) {
      await pub("POST", "/auth/password-reset/request", { email });
    },
    async logout() {
      const stored = await storedSession();
      try {
        if (stored) await pub("POST", "/auth/logout", { token: stored.token });
      } finally {
        // Signed out locally even if the server could not be reached.
        await saveSession(null);
      }
    },
    async restore() {
      const stored = await storedSession();
      if (!stored) return null;
      const restored = await pub<AuthSession | null>("POST", "/auth/restore", { token: stored.token });
      if (!restored) {
        await saveSession(null);
        return null;
      }
      const next = await sessionIn(restored);
      // Through saveSession, so a restored session starts the live connection
      // exactly as a fresh sign-in does. Setting `session` directly here is
      // how the stream came to be missing on every app launch that did not go
      // through the login screen.
      await saveSession(next);
      return next;
    },
  },

  institutions: {
    async search(query, type) {
      await referenceMaps();
      const rows = await pub<Institution[]>("GET", `/institutions${qs({ q: query, type })}`);
      return rows.map((i) => ({ ...i, id: back("institutions", i.id)! }));
    },
    async campuses(institutionId) {
      const rows = await pub<Campus[]>(
        "GET",
        `/institutions/${await out("institutions", institutionId)}/campuses`,
      );
      return rows.map((c) => ({
        ...c,
        id: back("campuses", c.id)!,
        institutionId: back("institutions", c.institutionId)!,
        ...(c.areaId ? { areaId: back("areas", c.areaId)! } : {}),
      }));
    },
    async request(input) {
      return pub("POST", "/institution-requests", input);
    },
  },

  me: {
    async get() {
      return userIn(await authed<User>("GET", "/me"));
    },
    async update(patch) {
      // Only what a member may change. The server refuses anything else, so
      // sending it would only turn an edit into an error.
      const body: Record<string, unknown> = {};
      if (patch.name !== undefined) body["name"] = patch.name;
      if (patch.phone !== undefined) body["phone"] = patch.phone;
      if (patch.photoUrl !== undefined) body["photoUrl"] = patch.photoUrl;
      if (patch.areaId !== undefined) body["areaId"] = await out("areas", patch.areaId);
      return userIn(await authed<User>("PATCH", "/me", body));
    },
    async setPhoto(key) {
      return userIn(await authed<User>("PUT", "/me/photo", { key }));
    },
    async requestBadge(key) {
      return userIn(await authed<User>("POST", "/me/badge", { key }));
    },
    async addInstitution(institutionId) {
      return userIn(
        await authed<User>("POST", "/me/institutions", {
          institutionId: await out("institutions", institutionId),
        }),
      );
    },
    async deleteAccount(password: string) {
      await authed("DELETE", "/me", { password });
      // Nothing to come back to, so the local session goes with it.
      await saveSession(null);
    },
    async removeInstitution(institutionId) {
      return userIn(
        await authed<User>("DELETE", `/me/institutions/${await out("institutions", institutionId)}`),
      );
    },
  },

  commutes: {
    async mine() {
      const commute = await authed<Commute | null>("GET", "/commutes/mine");
      return commute ? commuteIn(commute) : null;
    },
    async create(input) {
      return commuteIn(await authed<Commute>("POST", "/commutes", await commuteOut(input)));
    },
    async update(id, patch) {
      return commuteIn(await authed<Commute>("PATCH", `/commutes/${id}`, await commuteOut(patch)));
    },
    async cancel(id) {
      await authed("DELETE", `/commutes/${id}`);
    },
  },

  commuteWeek: {
    week: (commuteId) => authed("GET", `/commutes/${commuteId}/week`),
    members: (commuteId) => authed("GET", `/commutes/${commuteId}/members`),
    skipDay: (commuteId, day) => authed("POST", `/commutes/${commuteId}/skip`, { day }),
    setUnavailable: (commuteId, days) =>
      authed("POST", `/commutes/${commuteId}/unavailable`, { days }),
    replacements: (commuteId, day) =>
      authed("GET", `/commutes/${commuteId}/replacements${qs({ day })}`),
  },

  matches: {
    summary: () => authed("GET", "/matches/summary"),
    list: () => authed("GET", "/matches"),
    setAreaMatch: (matchId, status) => authed("POST", `/matches/${matchId}/area`, { status }),
  },

  rides: {
    async search(params: RideSearch) {
      // Institution and campus are constraints the server takes from the
      // account; they are not sent at all rather than translated and trusted.
      return authed(
        "GET",
        `/rides${qs({
          day: params.day,
          time: params.time ? to24h(params.time) : undefined,
          vehicleType: params.vehicleType,
          womenOnly: params.womenOnly,
        })}`,
      );
    },
    nearby: (params) => authed("GET", `/rides/nearby${qs({ day: params.day })}`),
    get: (id) => authed("GET", `/rides/${id}`),
    requestSeat: (rideId, seats) => authed("POST", `/rides/${rideId}/request`, { seats }),
    incomingRequests: () => authed("GET", "/requests/incoming"),
    sentRequests: () => authed("GET", "/requests/sent"),
    respondToRequest: (requestId, action) =>
      authed("POST", `/requests/${requestId}/respond`, { action }),
  },

  vehicles: {
    list: () => authed("GET", "/vehicles"),
    save: (input) => authed("PUT", "/vehicles", input),
    async remove(id) {
      await authed("DELETE", `/vehicles/${id}`);
    },
  },

  areas: {
    async list(city) {
      await referenceMaps();
      const rows = await pub<Array<{ id: string; name: string; city: string }>>(
        "GET",
        `/areas${qs({ city })}`,
      );
      return rows.map((a) => ({ ...a, id: back("areas", a.id)! }));
    },
  },

  location: {
    async search(query) {
      await referenceMaps();
      const rows = await authed<AreaSuggestion[]>("GET", `/location/search${qs({ q: query })}`);
      return rows.map((r) => ({ ...r, areaId: back("areas", r.areaId)! }));
    },
    async recent() {
      await referenceMaps();
      const rows = await authed<AreaSuggestion[]>("GET", "/location/recent");
      return rows.map((r) => ({ ...r, areaId: back("areas", r.areaId)! }));
    },
    async proximity(fromAreaId, toAreaId) {
      return authed(
        "GET",
        `/location/proximity${qs({ from: await out("areas", fromAreaId), to: await out("areas", toAreaId) })}`,
      );
    },
    async route(originAreaId, campusId) {
      return authed(
        "GET",
        `/location/route${qs({
          originAreaId: await out("areas", originAreaId),
          campusId: await out("campuses", campusId),
        })}`,
      );
    },
  },

  notifications: {
    list: () => authed("GET", "/notifications"),
    async markRead(id) {
      await authed("POST", `/notifications/${id}/read`);
    },
    async registerPushToken(token, platform) {
      await authed("POST", "/notifications/token", { token, platform });
    },
    async unregisterPushToken(token) {
      await authed("DELETE", "/notifications/token", { token });
    },
  },

  safety: {
    async report(input) {
      await authed("POST", "/safety/reports", input);
    },
    async block(userId) {
      await authed("POST", "/safety/blocks", { userId });
    },
    async unblock(userId) {
      await authed("DELETE", `/safety/blocks/${userId}`);
    },
    blocked: () => authed("GET", "/safety/blocks"),
  },

  support: {
    submit: (input) => authed("POST", "/support", input),
  },

  preferences: {
    get: () => authed("GET", "/preferences"),
    update: (patch) => authed("PATCH", "/preferences", patch),
  },
};
