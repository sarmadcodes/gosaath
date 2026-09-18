import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Local persistence. Only three things live here: whether onboarding has been
 * seen, the session, and the theme preference (owned by the theme module).
 * Everything else is server state.
 */

const KEYS = {
  onboarding: "gosaath.onboardingComplete",
  session: "gosaath.session",
  areaMatches: "gosaath.areaMatches",
} as const;

export async function hasSeenOnboarding() {
  try {
    return (await AsyncStorage.getItem(KEYS.onboarding)) === "true";
  } catch {
    return false;
  }
}

export async function markOnboardingComplete() {
  try {
    await AsyncStorage.setItem(KEYS.onboarding, "true");
  } catch {
    // Non-fatal. Worst case the intro shows once more.
  }
}

export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function writeJson(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Non-fatal.
  }
}

export async function remove(key: string) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Non-fatal.
  }
}

/**
 * Clears everything tied to the signed-in account. Onboarding state is
 * deliberately kept, because the intro is about the product, not the user.
 */
export async function clearSessionData() {
  await Promise.all([remove(KEYS.session), remove(KEYS.areaMatches)]);
}

export { KEYS };
