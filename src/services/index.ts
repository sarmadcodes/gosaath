import type { Api } from "@/services/api";
import { mockApi } from "@/services/mock";

/**
 * The single place the app resolves its backend.
 *
 * Screens import `api` from "@/services" and nothing else. When the Node and
 * MongoDB backend is ready, add an HTTP implementation of the same `Api`
 * interface and swap the assignment below. No screen changes.
 */
export const api: Api = mockApi;

export type { Api } from "@/services/api";
export type {
  AuthSession,
  RegisterInput,
  CommuteInput,
  VehicleInput,
  RideSearch,
  MatchPreferences,
} from "@/services/api";
