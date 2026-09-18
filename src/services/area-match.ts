import { KEYS, readJson, writeJson } from "@/services/storage";
import type { AreaMatchStatus } from "@/data/types";

/**
 * Remembers whether the user accepted or rejected another person's area.
 *
 * Without this the app would ask about the same pairing every time matches
 * reload, which is the fastest way to make a useful question feel like nagging.
 * Keyed by match id; the backend will own this once it exists.
 */
type AreaMatchMap = Record<string, AreaMatchStatus>;

export async function readAreaMatches(): Promise<AreaMatchMap> {
  return (await readJson<AreaMatchMap>(KEYS.areaMatches)) ?? {};
}

export async function setAreaMatch(matchId: string, status: AreaMatchStatus) {
  const current = await readAreaMatches();
  const next = { ...current, [matchId]: status };
  await writeJson(KEYS.areaMatches, next);
  return next;
}

/**
 * Decisions are tied to the commute they were made against. If the user
 * changes their own days or times, a previously rejected area may now work,
 * so the slate is cleared rather than silently hiding good matches.
 */
export async function clearAreaMatches() {
  await writeJson(KEYS.areaMatches, {});
}
