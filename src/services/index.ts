import type { Api } from "@/services/api";
import { httpApi } from "@/services/http";
import { mockApi } from "@/services/mock";

/**
 * The single place the app resolves its backend.
 *
 * Screens import `api` from "@/services" and nothing else. With
 * EXPO_PUBLIC_API_URL set (in .env) the app talks to the real server;
 * without it, it runs on the in-memory mock.
 */
export const usingServer = Boolean(process.env.EXPO_PUBLIC_API_URL);
export const api: Api = usingServer ? httpApi : mockApi;

export type { Api } from "@/services/api";
export type {
  AuthSession,
  RegisterInput,
  CommuteInput,
  VehicleInput,
  RideSearch,
  MatchPreferences,
} from "@/services/api";
