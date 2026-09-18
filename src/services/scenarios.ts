import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BadgeStatus, MatchSummaryState } from "@/data/types";

/**
 * Mock scenarios.
 *
 * The populated sample data is useful for building screens, but it hides the
 * state most users actually start in: nothing at all. Rather than scattering
 * `if (__DEV__ && showEmpty)` flags through individual screens, the whole mock
 * is driven from one scenario chosen here.
 *
 * This exists only to exercise the UI. It disappears with `mock.ts` when the
 * real backend lands, and nothing outside `src/services/` may import it —
 * screens must never branch on the current scenario.
 */

export type ScenarioId =
  | "firstLaunch"
  | "signedOut"
  | "populated"
  | "newUser"
  | "commuteNoMatches"
  | "noDayMatch"
  | "noTimeMatch"
  | "driverUnavailable"
  | "replacementAvailable"
  | "requestPending"
  | "verificationPending"
  | "verificationRejected"
  | "noNotifications"
  | "failing";

export type ScenarioConfig = {
  id: ScenarioId;
  label: string;
  /** Shown in the dev switcher so the states are self-describing. */
  description: string;

  /**
   * Where the app starts before any data matters.
   *
   * `src/app/index.tsx` branches on the stored onboarding flag and the
   * restored session, so a scenario that does not control those can never
   * reach the intro or the login screen — the two screens every single user
   * sees first.
   */
  seenOnboarding: boolean;
  signedIn: boolean;

  hasCommute: boolean;
  /**
   * Forces the server-computed match state. `null` means derive it from the
   * data, the way the real backend will. The UI never infers this itself.
   */
  matchState: MatchSummaryState | null;
  /** Which seeded matches to serve. */
  matches: "all" | "none";
  week: "normal" | "none" | "driverUnavailable";
  /** Other people sharing the commute. */
  members: boolean;
  /** Ride listings available to find or as replacement cover. */
  rides: boolean;
  notifications: boolean;
  /** Incoming seat requests, for someone offering seats. */
  incomingRequests: boolean;
  vehicles: boolean;
  badgeStatus: BadgeStatus;
  /** Every call rejects, so error states are reachable. */
  failing: boolean;
};

const base: Omit<ScenarioConfig, "id" | "label" | "description"> = {
  seenOnboarding: true,
  signedIn: true,
  hasCommute: true,
  matchState: null,
  matches: "all",
  week: "normal",
  members: true,
  rides: true,
  notifications: true,
  incomingRequests: true,
  vehicles: true,
  badgeStatus: "approved",
  failing: false,
};

/** Everything a brand-new account has, which is nothing. */
const empty: Omit<ScenarioConfig, "id" | "label" | "description"> = {
  seenOnboarding: true,
  signedIn: true,
  hasCommute: false,
  matchState: "noCommute",
  matches: "none",
  week: "none",
  members: false,
  rides: false,
  notifications: false,
  incomingRequests: false,
  vehicles: false,
  badgeStatus: "none",
  failing: false,
};

/**
 * Ordered as a journey: the first three are the states a real person passes
 * through, in order, before any of the data scenarios below apply.
 */
export const SCENARIOS: ScenarioConfig[] = [
  {
    ...empty,
    id: "firstLaunch",
    label: "First launch",
    description:
      "A fresh install. Starts at the intro, then sign-up, OTP and commute setup.",
    seenOnboarding: false,
    signedIn: false,
  },
  {
    ...empty,
    id: "signedOut",
    label: "Signed out",
    description: "Intro already seen, no session. Starts at the login screen.",
    signedIn: false,
  },
  {
    ...base,
    id: "populated",
    label: "Active user",
    description: "Commute set up, matches found, rides and notifications.",
  },
  {
    ...empty,
    id: "newUser",
    label: "Brand-new account",
    description: "No commute, matches, rides or notifications. The real State A.",
  },
  {
    ...base,
    id: "commuteNoMatches",
    label: "Commute, nobody yet",
    description: "Commute set up but nobody at the campus matches. \"You're early here\".",
    matchState: "none",
    matches: "none",
    members: false,
    rides: false,
  },
  {
    ...base,
    id: "noDayMatch",
    label: "No overlapping days",
    description: "People travel, but never on your days.",
    matchState: "noDayMatch",
    matches: "none",
    members: false,
  },
  {
    ...base,
    id: "noTimeMatch",
    label: "Same days, different times",
    description: "Days overlap but departure times do not.",
    matchState: "noTimeMatch",
    matches: "none",
    members: false,
  },
  {
    ...base,
    id: "driverUnavailable",
    label: "Driver unavailable",
    description: "One day this week has no driver and needs cover.",
    week: "driverUnavailable",
    rides: false,
  },
  {
    ...base,
    id: "replacementAvailable",
    label: "Replacement available",
    description: "A day has no driver, and cover is available for it.",
    week: "driverUnavailable",
  },
  {
    ...base,
    id: "requestPending",
    label: "Seat requests waiting",
    description: "Someone has asked to join a seat you offered.",
  },
  {
    ...base,
    id: "verificationPending",
    label: "Badge in review",
    description: "Verified badge submitted and awaiting admin review.",
    badgeStatus: "pending",
  },
  {
    ...base,
    id: "verificationRejected",
    label: "Badge rejected",
    description: "Verified badge was not approved.",
    badgeStatus: "rejected",
  },
  {
    ...base,
    id: "noNotifications",
    label: "No notifications",
    description: "Active account with an empty notification list.",
    notifications: false,
  },
  {
    ...base,
    id: "failing",
    label: "Everything fails",
    description: "Every request rejects, so error states are reachable.",
    failing: true,
  },
];

/**
 * The scenario the app starts in. `populated` while building screens;
 * `newUser` is the one to check before calling any screen finished.
 */
const DEFAULT_SCENARIO: ScenarioId = "populated";

let current: ScenarioId = DEFAULT_SCENARIO;

/** Notified when the scenario changes, so the mock can rebuild its state. */
const listeners = new Set<(config: ScenarioConfig) => void>();

const STORAGE_KEY = "gosaath.devScenario";
const ONBOARDING_KEY = "gosaath.onboardingComplete";
const SESSION_KEY = "gosaath.session";

/**
 * Applies the launch-state part of a scenario to storage.
 *
 * Only run when a scenario is chosen, never on every boot: otherwise picking
 * "First launch", getting halfway through sign-up and reloading would throw
 * the progress away each time.
 */
async function applyLaunchState(config: ScenarioConfig) {
  try {
    if (config.seenOnboarding) {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } else {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
    }
    if (!config.signedIn) {
      await AsyncStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Dev-only convenience; never worth failing the switch over.
  }
}

/**
 * The chosen scenario has to survive a reload, because switching one triggers
 * a full bundle reload on web — which would otherwise reset this module and
 * silently drop the user back into the populated state.
 *
 * Reading it is async, so every mock call waits on `scenarioReady` before
 * serving. Without that, the first few requests after launch would race the
 * stored value and answer from the wrong scenario.
 */
export const scenarioReady: Promise<void> = (async () => {
  try {
    const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as ScenarioId | null;
    if (stored && SCENARIOS.some((s) => s.id === stored)) {
      current = stored;
    }
  } catch {
    // Falls back to the default, which is the right behaviour anyway.
  }
})();

export function scenario(): ScenarioConfig {
  return SCENARIOS.find((s) => s.id === current) ?? SCENARIOS[0]!;
}

export function scenarioId() {
  return current;
}

export async function setScenario(id: ScenarioId) {
  current = id;
  const config = scenario();
  await AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  // Awaited so the caller can navigate straight afterwards and hit the
  // launch gate with storage already in its new state.
  await applyLaunchState(config);
  listeners.forEach((listener) => listener(config));
}

export function onScenarioChange(listener: (config: ScenarioConfig) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
