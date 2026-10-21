/**
 * Product flags.
 *
 * WOMEN_ONLY — on.
 *
 * Gender is self-declared and optional, asked at sign-up and editable in the
 * profile. Women-only controls are drawn only for people who have declared
 * themselves women (see `useWomenOnlyAvailable`), and the server enforces the
 * same rule everywhere a ride can be created, seen or joined — the flag here
 * decides what the app shows, never what anybody is allowed to do.
 *
 * Declarations are not verified. That is a deliberate first step, backed by
 * institution email, admin correction and reporting; verifying through the
 * student-card review can be layered on without changing these screens.
 */
export const WOMEN_ONLY_ENABLED = true;
