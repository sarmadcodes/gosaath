# GoSaath — System Document

**For:** whoever builds the Node + MongoDB backend.
**Status of the frontend:** complete as a UI, fully wired to a typed service
layer, currently served by an in-memory mock. No screen touches sample data
directly. Swapping in a real backend is one file.

Read sections 1–4 before writing any code. Sections 5–11 are the reference.

---

## 1. What the product is

GoSaath ("go" + *saath*, Urdu for *together*) is a **recurring-commute** app
for university students and faculty in Karachi. It is not a ride-hailing app.

The distinction drives every decision below:

| Ride-hailing (Uber/Careem) | GoSaath |
|---|---|
| One-off trip, booked now | A weekly timetable, set up once |
| Any driver, any passenger | Only people at **your institution and campus** |
| Precise pickup address | **Area only** — never an address |
| Rate the driver afterwards | **No ratings. Anywhere. At all.** |
| Public profile, trip history | **No public profiles.** First name + photo only |
| In-app chat | **No chat.** Phone number after a seat is accepted |

A user sets up their commute once ("I reach SZABIST Clifton by 8:00 from
Gulshan, Mon–Fri"). The app finds other people at the same campus whose
timetable overlaps. That's the product.

### Known gap: `womenOnly` cannot currently be enforced

The commute form, the ride listing and the preferences screen all carry a
women-only flag, but **the system stores no gender for anybody** — not on
`User`, not anywhere in the contract.

The backend therefore pairs the flag symmetrically: a women-only commute only
ever meets another women-only commute. That under-matches rather than
over-matches, which is the safer direction, but it is **not a guarantee** and
must not be presented in the UI as one.

Resolving it is a product decision, not a technical one: collecting gender
changes what this app holds about people.

### Hard rules — do not "improve" these

These came from the product owner explicitly. If a ticket seems to ask for one
of these, it's a misunderstanding — push back.

1. **No ratings, stars, reviews, or reputation scores.** No schema field, no
   endpoint, no average. It does not exist.
2. **No four-check verification.** There is exactly one optional,
   admin-reviewed **badge** (`badgeStatus`). Having an institution email is the
   account requirement and is not "verification" — every account has it, so it
   is not modelled.
3. **Institution + campus are hard matching constraints**, not filters or
   preferences. A SZABIST Clifton user is never shown an IBA user. This is
   enforced server-side, not by a UI toggle.
4. **Location is area-level only.** `areaId` → "Gulshan-e-Iqbal". Never
   collect, store, or return a street address, lat/lng, or live position.
5. **No public profiles and no chat.** The only shape another user is ever
   exposed as is `PublicUser` (section 5.3).
6. **Karachi only, for now.** Institution list is Karachi HEC institutions.
7. **SZABIST only, for now.** See section 1.1. Other institutions exist in the
   seed data but are `active: false` and cannot be registered into.
8. **Students and faculty only.** "Employees & companies" is visible in signup
   as *Coming soon* and is not selectable.

### 1.1 Launch scope — SZABIST first

One list controls this, in `src/data/institutions.ts`:

```ts
export const ACTIVE_INSTITUTION_IDS = ["inst-szabist"];
```

`active` derives from it, and every user-facing path filters on `active`
(`activeInstitutions`, `searchInstitutions`). While exactly one institution is
live, `isSingleInstitutionLaunch` is true and the signup flow offers SZABIST
directly instead of a searchable list of one; a single campus is auto-selected
and its screen skipped. Activating a second institution restores the search UI
with no screen changes.

Everything known about the other 24 institutions — unverified email domains,
which have real campus data, why their brand colours cannot be trusted, and the
activation checklist — is in
[docs/FUTURE-INSTITUTIONS.md](docs/FUTURE-INSTITUTIONS.md).

**A user-submitted institution must never become a live one.** Requests land in
`InstitutionRequest` with `status: "pending"` for admin review.

---

## 2. The load-bearing architecture

**This is the single most important thing in this document.** Three concepts,
never collapse them into one:

```
Commute  ──expands to──▶  RideInstance  ──has many──▶  Attendance
(template)                (one date)                   (who's on it)
```

### Commute — the recurring template
What the user sets up. "Mon/Wed/Fri, reach campus by 8:00, leave 17:30, from
Gulshan to SZABIST Clifton." One per user (for now). It has **no dates**. It is
a pattern.

### RideInstance — one concrete day
Generated from the template. "Monday 22 Sept." This is what gets cancelled,
skipped, or orphaned when a driver is unavailable.

### Attendance — a person on one instance
"Ayesha is confirmed on Monday 22 Sept." Skipping Tuesday must not affect
Monday, and must not touch the template.

**Why this matters:** the natural shortcut is to store "riders" on the Commute
and call it done. The moment a driver says "I can't drive Thursday," that model
breaks — you cannot express a one-day exception without editing the template,
which would silently change every other week. Every day-level feature in the UI
(skip a day, driver unavailable, find cover for Thursday) depends on instances
being real rows.

In the current frontend, `CommuteDay` is the read model for an instance. The
backend should expand the template into real `RideInstance` documents — a
rolling window (e.g. next 14 days), generated by a cron or lazily on read.

### Per-day schedules — the second load-bearing thing

Timetables are **not uniform**. A student may have an 8:00 Monday and a 10:00
Wednesday, and may not travel home at all on Friday. So:

```ts
type DaySchedule = {
  day: Weekday;             // "Mon" | "Tue" | ... | "Sun"
  arriveBy?: string;        // class start: be ON CAMPUS by this time
  leaveCampusAt?: string;   // class end: leaving campus. Absent = no return
};
```

**These are campus times, not departure times.** A student knows when their
class starts, not when a stranger would need to leave home to get them there —
that depends on the driver's area and the traffic. Both sides state the same
thing: when they must be on campus, and when they are done. Matching compares
those, and the driver works backwards from them.

This is why the UI says "Class starts at" / "Class ends at" and "reach by
8:00 AM" rather than "leaving at". Do not reintroduce a departure time as the
thing people enter.

A commute holds `DaySchedule[]`. **The days themselves are implied by which
entries exist** — there is no separate `days` array to keep in sync.

**Therefore matching is per-day.** Two people can match Monday and Wednesday
but not Tuesday. That is a normal result, not an edge case. `CommuteMatch`
carries `matchingDays: Weekday[]` and the UI says "2 of 5 days match".

---

## 3. How the frontend talks to the backend

### The seam

```
Screens  →  src/hooks/data.ts  →  src/services/index.ts  →  mock.ts
(UI)        (domain hooks)        (resolves `api`)          (in-memory)
                                          ↑
                                  swap this one line
```

`src/services/index.ts` is eleven lines:

```ts
import type { Api } from "@/services/api";
import { mockApi } from "@/services/mock";

export const api: Api = mockApi;
```

**Your job is to write `src/services/http.ts` implementing the same `Api`
interface, then change that line to `export const api: Api = httpApi;`.**
Nothing else in the app changes. This is verified: no screen imports a concrete
implementation, and `src/data/content.ts` (the sample data) is reachable only
from `mock.ts`.

### The contract

`src/services/api.ts` is the whole contract — **read it first, it is the spec.**
Thirteen namespaces:

| Namespace | Covers |
|---|---|
| `api.auth` | register, verifyEmailOtp, resendOtp, login, requestPasswordReset, logout, restore |
| `api.institutions` | search, campuses, request (admin review) |
| `api.me` | get, update, setPhoto, requestBadge, addInstitution, removeInstitution |
| `api.commutes` | mine, create, update, cancel |
| `api.commuteWeek` | week, members, skipDay, setUnavailable, replacements |
| `api.matches` | summary, list, setAreaMatch |
| `api.rides` | search, **nearby**, get, requestSeat, incomingRequests, **sentRequests**, respondToRequest |
| `api.vehicles` | list, save, remove |
| `api.areas` | list |
| `api.location` | search, recent, proximity, route |
| `api.notifications` | list, markRead, registerPushToken, unregisterPushToken |
| `api.safety` | report, block, unblock, blocked |
| `api.support` | submit (help and complaints) |
| `api.preferences` | get, update |

Every method is `async` and returns plain domain types from
`src/data/types.ts`. Ids are `string` so they map onto Mongo ObjectIds.

Types follow one convention: **anything the API returns as a populated
sub-document is a nested object here; anything returned as a reference is a
bare `...Id` string.** So `RideListing.driver` is a full `PublicUser` object,
but `Commute.vehicleId` is a string.

### Domain hooks

Screens don't call `api.*` for reads — they use `src/hooks/data.ts`:

```ts
const { data: commute, loading, error, reload, set } = useCommute();
```

`useMe`, `useCommute`, `useCommuteWeek`, `useCommuteMembers`, `useMatchSummary`,
`useMatches`, `useRideSearch`, `useNearbyRides`, `useRide`,
`useIncomingRequests`, `useSentRequests`, `useReplacements`, `useVehicles`,
`useNotifications`, `useBlocked`, `usePreferences`.

They wrap `useAsync` (`src/hooks/use-async.ts`), whose return shape
**deliberately mirrors TanStack Query** — `{ data, loading, error, reload, set }`.
Moving to TanStack later is a rewrite of that one file, not of every screen.

Hooks that can go stale while the user is on another screen pass
`{ refetchOnFocus: true }`.

**Writes** go through `api.*` directly, usually with an optimistic `set()`:

```ts
set(requests.filter((r) => r.id !== request.id));
await api.rides.respondToRequest(request.id, "accept");
```

### What the backend must therefore guarantee

- **Every method can be called independently.** Hooks fire in parallel; don't
  assume ordering.
- **Return the full updated object from mutations**, not `{ ok: true }`.
  `api.me.update` returns the whole `User`. The UI re-renders from the response.
- **Empty is `[]`, missing is `null`.** `api.commutes.mine()` returns `null`
  when the user has no commute (drives the "set up your commute" empty state).
  Lists always return an array.
- **Errors should be real `Error`s with a human-readable message.** `useAsync`
  surfaces `error.message` directly.

### Empty, loading and error are three different things

This is the most common way a screen here goes wrong, so it is worth stating
plainly. `useAsync` returns `{ data, loading, error }` and all three cases need
their own branch:

| State | Means | Render |
|---|---|---|
| `loading` | Still fetching | Skeleton matching the final layout |
| `error` | The request failed | `<ErrorState onRetry={reload} />` |
| `data` empty / `null` | Genuinely nothing | The section's empty state |

**Never gate a whole screen on the account.** Profile and Settings fetch `me`,
but only the identity card actually needs it — the menu rows are navigation.
Gating the screen meant a failed `/me` locked the user out of Settings and, on
the same screen, out of **logging out**: the one action that would let them
recover. Values degrade to absent; rows always render.

**Never render an empty state on error.** `api.commutes.mine()` returning
`null` means "set one up"; the same call *failing* means "we could not check".
Showing the setup card on failure tells somebody who already has a commute to
create a second one. Home, Commute, Rides, Matches and Notifications each
branch on `error` before anything else.

### Mock scenarios (development only)

`src/services/scenarios.ts` drives the whole mock from one selected scenario,
so every empty, partial and error state is reachable without editing screens.

The list is ordered as a journey. The first two control **launch state**, not
data — they write the onboarding flag and clear the session, because
`src/app/index.tsx` branches on those before any data is fetched. Without them
the intro and login screens, which every user sees first, are unreachable once
you have signed in:

| Scenario | Starts at |
|---|---|
| `firstLaunch` | The intro. A fresh install: sign-up, OTP, commute setup |
| `signedOut` | The login screen. Intro seen, no session |
| `newUser` | Home, signed in with nothing set up — the real State A |

Then the data scenarios: `populated`, `commuteNoMatches`, `noDayMatch`,
`noTimeMatch`, `driverUnavailable`, `replacementAvailable`, `requestPending`,
`verificationPending`, `verificationRejected`, `noNotifications`, `failing`.

`setScenario` is **async** and must be awaited before navigating — it writes
storage, and the launch gate reads it immediately after. Launch state is
applied only when a scenario is chosen, never on every boot, so getting halfway
through sign-up and reloading does not throw the progress away.

- Switch them in-app: **Settings → Development → Mock scenarios**, rendered
  only under `__DEV__`.
- The choice persists to AsyncStorage (`gosaath.devScenario`) because switching
  reloads the bundle on web, which would otherwise reset it.
- Every mock read awaits `scenarioReady` first, so no request is served from
  the wrong scenario during startup.

**Screens must never import this module or branch on the active scenario.** It
disappears together with `mock.ts` when the real backend lands.

---

## 4. Screen-by-screen flows

### 4.1 Launch

`src/app/index.tsx` decides where to go:

```
hasSeenOnboarding? ──no──▶ (auth)/onboarding
       │yes
       ▼
api.auth.restore() ──null──▶ (auth)/login
       │session
       ▼
api.commutes.mine() ──null──▶ (auth)/commute-setup
       │commute
       ▼
   (tabs)/index  [Home]
```

`restore()` reads the stored session from AsyncStorage (`gosaath.session`).
Backend: this is where you validate/refresh the JWT.

The institution accent is applied app-wide by `useInstitutionTheme()` in the
root layout, not only at launch — a deep link (push notification, or a URL on
web) mounts a screen without passing through this gate.

### 4.2 Registration (the multi-step wizard)

Screens: `onboarding → user-type → institution-type → institution → campus →
register → otp → intent → commute-setup`.

**Nothing is sent to the server until `register`.** The partially-filled account
lives in `SignupProvider` (`src/state/signup.tsx`).

Selections auto-advance — no Continue buttons. A single campus is auto-selected
and its screen skipped entirely.

The sequence of API calls:

1. `api.institutions.search(query, type)` — institution picker
2. (optional) `api.institutions.request({...})` — creates an
   `InstitutionRequest` with `status: "pending"`. **It must never create a live
   Institution.**
3. `api.auth.register(input)` → `{ pendingEmail }` — sends OTP to the
   **institution email**. Validate the domain against `Institution.emailDomains`
   server-side.
4. `api.auth.verifyEmailOtp(email, code)` → `AuthSession`
5. `api.commutes.create(input)` — the commute template, then `commute/ready`.

`commute/create` asks three questions on three screens — starting area, days,
then times — rather than presenting every field at once. Times are seeded so
the last step is a confirmation. It calls `api.commutes.create` and routes to
`commute/ready`, the activation moment.

Login is **email + password**. `api.auth.login` returns the same `AuthSession`.

### 4.3 Home — `src/screens/home/index.tsx`

1. **Header** — greeting + full name, institution **wide** logo, notification bell
2. **Today card**, or the **setup card** when there is no commute
3. **Match card** — driven by `useMatchSummary()`
4. **Quick actions** — "Find a ride" is hidden without a commute

`MatchSummary.state` is a five-way enum so empty and partial cases are
first-class rather than "no data":

| state | Means | UI says |
|---|---|---|
| `matches` | Found people | "4 people match your commute" |
| `noDayMatch` | Same campus, no overlapping days | "Nobody on your days yet" |
| `noTimeMatch` | Days overlap, times don't | "Same days, different times" |
| `noCommute` | User hasn't set one up | "Find your commute people" |
| `none` | Nobody at this campus yet | "You're early here" |

**Backend: compute this server-side.** The UI must not infer state from an
array length — it cannot tell `noDayMatch` from `none`.

With no commute the match card is an explainer with **no** action: the setup
card above already owns the one action worth offering.

### 4.4 Commute dashboard — `src/screens/commute/index.tsx`

The template plus this week's instances. `week-strip.tsx` renders the days with
their `AttendanceStatus`. Links to: group, skip a day, "Days I cannot drive",
offer to drive.

### 4.5 Finding and requesting a ride

```
ride/find (filters) → ride/results → ride/[id] → ride/request → driver decides
```

**Two lists, not one.** `search` matches a schedule — the right default, but it
returns nothing on a campus still filling up, and nothing is what makes a new
user leave. `nearby` relaxes **time only**: same institution, same campus,
optional day filter. Institution and campus stay hard constraints in both.

**Requests have two directions and they are not interchangeable.**
`incomingRequests()` is people asking for seats you offer — a to-do list, shown
with Accept/Decline in the Rides tab. `sentRequests()` is what you have asked
of others — a waiting list.

**The Rides tab is the only place requests live.** A standalone
`driver/requests` screen used to duplicate the incoming list; it is gone.
Seat-request notifications deep-link to `/(tabs)/rides?tab=requests`, and the
tab reads `?tab=` to open on the right list. Do not reintroduce a second
surface for this.

`find` passes its selections as route params; `results` reads them with
`useLocalSearchParams`. Institution and campus are never among them — they are
constraints, stated on the screen rather than offered as fields.

**Contact is on the match, not on `PublicUser`.** `CommuteMatch.contactPhone`
and `CommuteMember.contactPhone` are served only for people you are actually
matched with or share a group with. It is deliberately *not* on `PublicUser`,
which is the shape everyone is exposed as everywhere. There is no chat: the
`ContactActions` component opens WhatsApp or the dialler, because that is what
people in Karachi actually answer.

`CommuteMatch.seatsTaken` says how many have **joined** — never "agreed". The
server knows a request was accepted; it cannot know the two of them settled
anything between themselves, and the UI must not imply otherwise.

**Nearby is a radius, not a synonym for "everyone".** `NEARBY_RADIUS_KM` is 3 —
roughly a detour a driver will actually make on a route they were already
taking. `ProximityEstimate.distanceKm` exists to enforce that and is **never
rendered**; the `label` is what the UI shows.

### 4.6 The day-level exception flow (the important one)

```
driver/unavailable  ──▶ api.commuteWeek.setUnavailable(commuteId, days)
                            │
                            ▼
                    those instances → status "noDriver"
                            │
                            ▼
driver/replacement  ──▶ api.commuteWeek.replacements(commuteId, day)
                        (cover for THAT DAY, not the week)
```

Passengers keep their recurring seat on every other day. The template is
untouched.

### 4.7 Matches — `src/app/matches.tsx`, `src/app/match/[id].tsx`

**Area confirmation:** matching times doesn't mean the *location* works. The
user answers "Does this area work for you?" per match. Rejected matches drop
out and stay out — persisted in AsyncStorage (`gosaath.areaMatches`).
`api.matches.setAreaMatch` is the server-side equivalent.

Once the area is confirmed the card opens `match/[id]`: the day-by-day overlap
grid, their route, approximate proximity, and one action.

### 4.8 Safety — `src/app/safety/report.tsx`, `blocked.tsx`

`api.safety.report({ reportedUserId?, category, detail? })` — six concrete
categories, calm copy. After sending, offers to block.

**Blocking is silent and bidirectional for matching.** The blocked person is
never told. Enforce this in the match and search queries, not just in the UI.

### 4.9 Account

`profile` (account info only — no rating, no ride count, no join date),
`profile-edit`, `institutions`, `vehicles`, `verification`, `preferences`,
`settings`, `appearance`.

`preferences.tsx` writes through on every toggle — no Save button.

### 4.10 Location and proximity

Location is behind the same seam as everything else, as `api.location`. There
is deliberately **no** `currentPosition`, no watch, and no coordinate in any
signature — everything resolves to an `areaId`, because that is the only
granularity this product stores.

```ts
search(query): Promise<AreaSuggestion[]>      // type-ahead over areas
recent(): Promise<AreaSuggestion[]>           // previously chosen areas
proximity(fromAreaId, toAreaId): Promise<ProximityEstimate>
route(originAreaId, campusId): Promise<RoutePreview>
```

A Google Maps-backed implementation slots in here without a screen changing.
The current mock approximates over the static area list and marks every result
`approximate: true`.

**Proximity is a phrase, not a number.** `ProximityEstimate.label` is produced
by the service ("~12 min away", "Route near Shahrah-e-Faisal") and rendered
verbatim. The UI must never compute its own figure: "12.37 km" implies a
tracking accuracy this product does not have and is not going to have.
`CommuteMatch.proximity` is optional, and every match view must render
correctly without it.

Reusable components live in `src/components/location/`:

| Component | Use |
|---|---|
| `LocationSearch` / `LocationResult` | Area type-ahead with recents |
| `SelectedLocation` | Chosen area with a Change affordance |
| `LocationConfirmation` | Confirm step; holds the slot a map will occupy |
| `RoutePreviewCard` | Origin area → destination campus, as a rail |
| `ProximityIndicator` | "~12 min away" plus optional corridor |

`LocationConfirmation` draws an obviously-schematic placeholder rather than a
fake map, because a placeholder that looks real is the kind of thing that
survives to production. `RoutePreviewCard` is intentionally not a map at all: a
pin over somebody's home area would expose more than the product should.

---

## 5. Data model

Full definitions in `src/data/types.ts`. Highlights and the traps.

### 5.1 Institution & Campus

```ts
type Institution = {
  id, name, shortName?, type, emailDomains: string[],
  city, active, brandColor: string, featured?: boolean
};
type Campus = { id, institutionId, name, areaId? };
```

`emailDomains` validates institution email at registration.
`brandColor` drives the app accent (section 7).
`featured` pins to the top of the picker.

**Contribution is guidance, not a limit.** The UI shows a typical band
(Rs. 200–600 for a car) and accepts any non-negative amount. A hard range
blocks the honest cases at both ends — a short hop across one area, or somebody
driving in from Malir.

`InstitutionRequest` is the admin-review queue.

### 5.2 User

```ts
type User = {
  id, name, email, phone, photoUrl?,
  userType: "student" | "teacher" | "employee",
  institutionId, campusId,
  areaId,                          // approximate home area. NEVER an address
  badgeStatus: "none" | "pending" | "approved" | "rejected",
  additionalInstitutionIds: string[],
  role?: Role                      // platform role; see section 11
};
```

### 5.3 PublicUser — the privacy boundary

```ts
type PublicUser = {
  id;
  firstName;        // FIRST NAME ONLY. Never the full name
  photoUrl?;
  verified: boolean; // derived from badgeStatus === "approved"
};
```

**This is the only shape another user is ever exposed as.** No endpoint may
return a full `User` for anyone but the authenticated user themselves. If you
find yourself adding a field here, that's a product decision, not a technical
one — ask.

### 5.4 Commute, CommuteDay, CommuteMember

```ts
type Commute = {
  id, ownerId, intent: "find" | "offer" | "both",
  institutionId, campusId, originAreaId,
  schedule: DaySchedule[],    // days implied by entries
  direction: "going" | "returning" | "both",
  vehicleId?, seatsOffered?, contribution?,   // only if offering
  womenOnly: boolean,
  status: "active" | "paused" | "cancelled"
};

type CommuteDay = { day: Weekday; date: string; status: AttendanceStatus };
type AttendanceStatus =
  "confirmed" | "pending" | "skipped" | "cancelled" | "noDriver";

type CommuteMember = { user: PublicUser; role: "driver"|"passenger"; travellingNext: boolean };
```

### 5.5 RideListing, CommuteMatch, SeatRequest

`RideListing.sameCampus` is always true by default — it exists so the UI can
drop the redundant destination from the card when every result shares it.

`CommuteMatch.matchingDays` is **computed server-side**. The UI renders it, it
does not derive it.

`CommuteMatch.rideId` points at the listing to request a seat on, and is
present only when that person is offering and still has seats. The match detail
screen needs it to ask for *that* ride — without it the only honest action is a
generic search, which is a dead end from a screen about one specific person.
When they are looking for a ride rather than offering one, there is no invite
in this product: the action is to offer seats on your own commute and let the
match surface you to them.

### 5.6 Vehicles

Car or bike. **One photo** showing the front and the plate.

### 5.7 Notifications

**The in-app list is the source of truth; push is a best-effort nudge.** The
server writes the notification row and awaits it, then dispatches the push
without awaiting — a driver tapping Accept must not wait on Expo, and a push
provider having a bad afternoon must not turn an accepted seat into a failed
request. A push that never arrives loses a nudge, not the notification.

`AppNotification.time` is a phrase computed server-side — "18 min ago",
"Yesterday" — the same choice as `ProximityEstimate.label`. The client renders
it verbatim so every screen says the same thing.

Push tokens are keyed on the **token**, not the user: a phone gets passed
around, and signing in on a shared device reassigns it rather than leaving the
previous account notified. `unregisterPushToken` is called on logout for the
same reason.

Ten `NotificationKind`s: `seatRequest`, `requestAccepted`, `requestDeclined`,
`tomorrowCommute`, `driverUnavailable`, `replacementAvailable`, `rideReminder`,
`cancellation`, `badgeUpdate`, `institutionApproved`. Each maps to an icon and
colour in `notifications.tsx`; three deep-link to a screen.

---

## 6. Suggested MongoDB collections

| Collection | Notes |
|---|---|
| `users` | index `email` unique, `{institutionId, campusId}` |
| `institutions` | seeded, admin-managed |
| `campuses` | index `institutionId` |
| `institutionRequests` | admin review queue |
| `areas` | static Karachi list |
| `commutes` | index `{institutionId, campusId, status}` — the match query |
| `rideInstances` | index `{commuteId, date}`, `{date, status}` |
| `attendance` | index `{rideInstanceId, userId}` unique |
| `seatRequests` | index `{driverId, status}`, `{requesterId, status}` |
| `vehicles` | index `ownerId` |
| `notifications` | index `{userId, unread}` |
| `reports` | admin queue |
| `blocks` | index `{blockerId, blockedId}` — **query both directions** |
| `preferences` | one per user |
| `auditLog` | see section 11 |

**The match query** is the hot path. Roughly: same `institutionId` +
`campusId`, `status: active`, excluding blocks in either direction, then
per-day arrival-time overlap against `schedule`. Compute `matchingDays` in that
aggregation.

**Instance generation**: a job that expands active commutes into `rideInstances`
for a rolling window. Idempotent — key on `{commuteId, date}`.

---

## 7. Theming and institution branding

`makeStyles((c) => ({...}))` is the pattern — a theme-aware StyleSheet factory
hook. `c` is the palette. Never hardcode a colour in a screen.

Light and dark palettes, **system default** (`userInterfaceStyle: "automatic"`).
User can override in `appearance.tsx`.

**Institution branding:** when a user picks their institution, the app accent
becomes that institution's `brandColor`. SZABIST is `#0C4DA1`, sampled from the
real logo. The header shows the institution's **wide** logo; the picker shows
the **mark**. Home's Today card and Profile's identity card both carry the
filled brand surface.

Logos live at `assets/institutions/<institutionId>-mark.png` and `-wide.png`,
registered in `src/data/institutions.ts`. Aspect ratio is recorded in the
registry as `wideRatio` — **do not use `Image.resolveAssetSource`**, it doesn't
exist on RN Web and crashed the app.

**App icon and splash** are generated from the in-app mark by
`node scripts/build-logo.js`, which reads the same ratios as
`src/components/wordmark.tsx`. Never redraw the icon by hand — regenerate it.

---

## 8. Conventions

- **Expo SDK 57**, React Native 0.86.3, React 19.2.3, TypeScript, Expo Router
- `src/app/` is **routes only**. Screen bodies with real complexity live in
  `src/screens/`
- Files kebab-case, one named export per component file
- **Smallest supported screen: 375×667.** Several bugs were only caught by
  testing at that width — text truncation is the recurring one
- `src/utils/schedule.ts` has the schedule helpers
- AsyncStorage keys are namespaced `gosaath.*`. Only onboarding state, the
  session, area-match decisions and the dev scenario are stored locally.
  **Everything else is server state**
- Logging out clears the session and area matches but **keeps** the onboarding
  flag — the intro is about the product, not the account

### Loading states

Skeletons live in `src/components/skeleton.tsx` and are **shape-matched**, not
generic grey boxes: `HomeSkeleton`, `RideCardSkeleton`, `SkeletonRows`,
`SkeletonForm`, `SkeletonPerson`, `SkeletonCard`, `SkeletonText`. Each mirrors
the layout it stands in for, so nothing shifts position when data lands. Use an
existing one rather than stacking raw `SkeletonBlock`s.

`SkeletonBlock` animates a soft highlight sweeping across the block. That needs
the width in pixels from `onLayout`, which **does not fire on React Native
Web** — so when no measurement arrives it falls back to a slow breathe instead
of sitting static. Both paths use the native driver, and both are skipped
entirely when the OS reports reduce-motion.

Screens that seed form state from the account use a **gate wrapper**: an outer
component renders a skeleton until data arrives, then mounts the real form with
the data as a prop. The alternative — reconciling a late-arriving value against
text the user has already typed — is the classic "my edit got reverted" bug.

---

## 9. What is done vs. not

### Done
- All screens built and navigable
- Full typed API contract + in-memory mock serving real content
- Every screen on the service layer; `tsc --noEmit` clean
- Per-day schedules end to end, as campus times
- Light/dark + system default; per-institution accent
- 25 Karachi institutions seeded, SZABIST the only active one
- Mock scenario system; new-user, partial-match and error states reachable
- Empty/loading/error separated on the primary screens
- Location service contract + reusable location components (no Maps yet)
- Commute setup is a three-step flow and actually saves
- `commute/ready` activation screen; `match/[id]` detail screen
- Role/scope model in place for the future admin panels (section 11)
- 375×667 swept: no horizontal overflow, no clipped text
- App icon, adaptive icon, favicon and splash generated from the in-app mark
- Help, Terms and Privacy written and wired; no dead links remain
- Push registration wired (`usePushNotifications`) — token handed to the
  service layer, taps routed per notification kind. **Delivery is the
  backend's half**
- WhatsApp/call contact on matches and group members

### Not done
- **Backend** — this document is the brief for it
- 24 institution logos missing (SZABIST only). Other `brandColor`s are
  approximations until sampled from real logos
- Real campus lists — only SZABIST Clifton confirmed.
  `NEEDS_REAL_CAMPUS_DATA` flags this
- **Never tested on a real device — web only.** Swept at 320/360/375/430 in a
  browser: clean from 360 up. At 320 (2016-era hardware, below the supported
  floor) several labels truncate
- SOS and trip sharing are deliberately out of scope for now
- Institution logos, brand colours and campus lists are the Super Admin
  panel's job, not seed data — see section 11

---

## 11. Roles and the future admin surface

**Not built yet.** Two React web panels come after the mobile app. This section
exists so the backend is designed for them now rather than retrofitted, because
scoping added late is how one institution ends up able to read another's
students.

### The hierarchy

```
Super Admin  →  Institutions  →  University Admin  →  Students / Faculty
(platform)      (tenants)        (one institution)    (the mobile app)
```

### The model

`Role` and `AdminScope` are already in `src/data/types.ts`, with helpers in
`src/data/roles.ts`:

```ts
type Role = "member" | "universityAdmin" | "superAdmin";

type AdminScope =
  | { kind: "platform" }
  | { kind: "institution"; institutionId: string };
```

Three rules that matter:

1. **Role is separate from `UserType`.** `UserType` is what someone is at their
   institution (student / teacher / employee). `Role` is what they may
   administer. A university admin is also a member who commutes: role must
   never affect how anyone is matched.
2. **Every admin query is built from a scope, never from a caller-supplied
   institution id.** `scopeOf(user)` returns the scope; `scopeCovers(scope, id)`
   is the check. A university admin whose request names another institution
   gets nothing — enforced server-side, not by hiding UI.
3. **`PublicUser` never gains a `role` field.** Which staff member administers
   a campus is not another commuter's business.

### Panel responsibilities

| | University Admin | Super Admin |
|---|---|---|
| Scope | Exactly one institution | Platform-wide |
| Students & faculty | Their institution only | All institutions |
| Verification badges | Review their own | Oversight, policy |
| Campuses | Their own | Create, edit, all |
| Institutions | — | Onboard, activate, deactivate |
| Admins | — | Assign university admins |
| Reports / moderation | Their institution | Platform-wide |
| Analytics | Institution-level | Platform-wide |
| Audit logs | — | Full |
| Employee/company rollout | — | Owns it |

### What the backend should do now

- Put `role` on the user document, defaulting to `member`.
- Index by `institutionId` on everything an institution admin will list —
  users, commutes, reports. Those indexes already exist for matching.
- Add an `auditLog` collection before the Super Admin panel, not after.
  Institution activation and admin assignment are the two actions most likely
  to need an answer to "who did this".
- Keep institution activation server-side. The mobile client's
  `ACTIVE_INSTITUTION_IDS` is a launch-time constant; once the admin panel can
  activate institutions, that list becomes an API response and
  `isSingleInstitutionLaunch` is derived from it. **No mobile screen changes
  are needed for that.**

### What the mobile app assumes

Nothing about roles. It is a `member` surface throughout.

---

## 10. If you change one thing, check these

1. Did you collapse Commute and RideInstance? → section 2
2. Did you add a rating, score, or review anywhere? → don't
3. Did an endpoint return a full `User` for someone other than the caller?
   → must be `PublicUser`
4. Did you make institution/campus a filter instead of a constraint?
5. Did you store a precise location? → area only
6. Did you assume every day has the same time? → `DaySchedule[]`
7. Does a mutation return `{ ok: true }` instead of the updated object?
8. Do blocks filter in **both** directions?
9. Does the screen render an empty state when the request **failed**?
10. Does a failed fetch block navigation the user needs to recover — Settings,
    log out, or a retry? Degrade the values, keep the controls.
11. Did the UI compute its own distance or travel time? → consume the label
12. Did an institution become selectable without going through
    `ACTIVE_INSTITUTION_IDS` and the activation checklist?
13. Did an admin query take an institution id from the caller instead of from
    `scopeOf(user)`? → see section 11
14. Did `role` leak into `PublicUser`, or affect matching?
