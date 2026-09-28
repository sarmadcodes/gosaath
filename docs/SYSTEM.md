# GoSaath — Complete System Reference

Everything about the product: the frontend that is built, and the backend that
is specified but not built.

| Part | Status |
|---|---|
| Design system, components, all screens | **Built and running** |
| Sample data + typed service layer | **Built.** Stands in for the API |
| Backend, database, API | **Not built.** Specified below |
| Live map, payments, push delivery | **Not built** |

Stack: Expo SDK 57, React Native 0.86, React 19, TypeScript, Expo Router.
Backend target: **Node + MongoDB**.

---

# PART 1 — PRODUCT MODEL

## 1.1 What this is

A **student and workplace carpooling app**. You are matched only with people
from your own institution and campus who travel when you do.

Not ride-hailing. Not a social network.

> Find people from your institution who have a similar daily commute and share
> transportation costs.

## 1.2 Users and market

Karachi first. University students, teachers/faculty, school and college
students and staff, office employees, organisations. Currency PKR.

## 1.3 Two ideas everything else follows from

**A. Institution and campus are hard constraints.** Matching is scoped to your
community first, then ranked by location. Someone from another university
nearby is *not* a match. This is what makes strangers feel safe.

**B. A commute is a recurring template, not a booking.** You set it up once
and the system keeps matching you.

```
Commute (template)  ->  RideInstance (one date)  ->  Attendance (per person)
```

Editing the template never rewrites past instances. **Do not collapse these
into one table** — the week view, skip-a-day, driver-unavailable and the
replacement flow all become impossible to express if you do.

## 1.4 Per-day schedules — read this carefully

Timetables are **not uniform**. A student may have an 8:00 Monday and a 10:00
Wednesday, and may not travel home at all on Friday.

So a commute carries `schedule: DaySchedule[]` — one entry per day, each with
its own optional `departureTime` and `returnTime`. There is no single
commute-wide time.

**Matching is therefore per day.** Two people can match Mon/Wed but not Tue,
and that is a normal outcome. The API returns `matchingDays: Weekday[]` per
match, and the UI says "4 of 5 days match".

Where times differ, the UI says **"times vary"** rather than showing one day's
time, which would mislead.

## 1.5 Cost model

Genuine cost sharing, never a fare. There is **no payment processing** —
contribution is settled directly between commuters.

| Always | Never |
|---|---|
| Estimated contribution, shared travel cost, fuel contribution | Fare, price, driver earnings |
| Offer seats | Become a driver |

Car: up to 7 seats, Rs. 200–600 one way. Bike: 1 seat, Rs. 100–300.

## 1.6 Deliberately absent

No ratings. No public profiles. No ride counts, no join dates. No followers,
posts, likes or feeds. No in-app chat. No gamification.

Other users are only ever seen as `PublicUser`: **first name, optional photo,
optional verified badge**. Nothing else is exposed, ever.

## 1.7 Trust model

- **Institution email + OTP** is the account requirement. That is the real check.
- **The verified badge is optional** — upload a student/employee card, an admin
  reviews it. The document is never public; only the badge is.
- Reporting and blocking.
- **Women-only: withdrawn from the product until gender can be verified.**
  The preference exists in the data model and the matching engine honours it,
  but nothing establishes that a person ticking it is a woman — no gender is
  collected or checked. A "Women only" badge reads as a guarantee, and one the
  system cannot enforce is worse than no option at all. The controls are hidden
  behind `WOMEN_ONLY_ENABLED` in `src/data/flags.ts`; switch it on once gender
  is established at signup or confirmed through the badge review that already
  exists.

The old four-check verification (CNIC, institution, licence, vehicle) was
**removed**.

## 1.8 A user is never "a driver"

The same account finds rides and offers seats. `intent` is `find | offer |
both` and is changeable. There is no driver role on the user.

---

# PART 2 — DESIGN SYSTEM

Single source of truth: `src/theme/`. Nothing hardcodes a colour, space,
radius or type value.

## 2.1 Theming

`ThemeProvider` + `useTheme()` / `useColors()` / `makeStyles()`.
Modes: **system (default)**, light, dark — persisted to AsyncStorage.

```ts
const useStyles = makeStyles((c) => ({ card: { backgroundColor: c.surface } }));
function Card() { const styles = useStyles(); }
```

Theme-independent tokens (spacing, radius, type) are plain exports usable at
module scope. Colours must go through the hook.

## 2.2 Palette (light / dark)

| Token | Light | Dark |
|---|---|---|
| background | `#F7F7F5` | `#101312` |
| surface | `#FFFFFF` | `#181C1B` |
| surfaceSecondary | `#F1F1EE` | `#1F2423` |
| textPrimary | `#14171A` | `#F2F3F2` |
| textSecondary | `#5B6168` | `#A3AAA7` |
| textTertiary | `#8B9096` | `#737B78` |
| border | `#E4E4E0` | `#2A302E` |
| brand | `#0F6E5C` | `#2E9C86` |
| brandSecondary | `#E4F1EE` | `#16302B` |
| **rideCard** | `#EDF6F1` | `#16241F` |
| **rideCardBorder** | `#D4E8DF` | `#24382F` |
| success / warning / error / info | see `palette.ts` | lifted variants |
| womenOnly | `#8A4B8C` | `#B77ABA` |

`rideCard` is the dedicated light-green surface for ride listings.
`womenOnly` is reserved for that preference and used nowhere else.
Brand is lifted in dark so it holds contrast.

## 2.3 Type

Manrope display/headings, Inter body/UI. Eleven variants
(`display, h1–h4, bodyLarge, body, bodySmall, caption, label, button`), all via
`<Text variant tone>`. Only display and h1 are bold. Never bold body copy for
emphasis — change tone instead.

## 2.4 Spacing, radius, elevation

Spacing `4 8 12 16 20 24 32 40 48 64`.
Radius: **8** inputs · **12** buttons/badges · **16** cards · **20** sheets ·
**999** avatars/pills. Applied without exception.
Elevation = 1px border + surface contrast. One shadow token, for floating
elements only.

## 2.5 Non-negotiables

- Touch targets ≥ **44pt**.
- **Status never relies on colour alone** — always icon + word + colour.
- Smallest supported screen **375 × 667**, verified.
- Icons: Feather via `@expo/vector-icons`, one family.

---

# PART 3 — FRONTEND ARCHITECTURE

```
src/
  app/            Expo Router routes only
    (auth)/       onboarding, user-type, institution-type, institution,
                  campus, register, otp, login, intent, commute-setup,
                  request-institution
    (tabs)/       index (Home), commute, rides, profile
    ride/         find, results, [id], request
    commute/      create, group
    driver/       offer, requests, unavailable, replacement
    vehicles/     index, edit
    safety/       report
    matches, notifications, settings, verification, institutions,
    preferences, blocked, appearance, profile-edit, active-ride
  components/     27 reusable components
  screens/        home/, commute/  (bodies too large for a route file)
  data/           types, content (sample), institutions, areas
  services/       api.ts (contract), mock.ts, storage.ts, area-match.ts
  state/          signup.tsx (registration draft)
  utils/          schedule.ts, greeting.ts
  theme/          palette, tokens, context
```

## 3.1 The service layer — how you plug in the backend

`src/services/api.ts` defines the **whole contract** as typed async
interfaces. `mock.ts` implements it. `index.ts` exports a single `api`.

**Screens import only `@/services`.** To go live, write an HTTP implementation
of the same `Api` interface and change one line in `index.ts`. No screen
changes.

```ts
export const api: Api = mockApi;   // <- swap this
```

Recommended: TanStack Query on top, since nearly all state is server state.

## 3.2 Entry gate (`src/app/index.tsx`)

live session → `(tabs)` · seen intro, signed out → `login` · otherwise →
`onboarding`. Onboarding completion persists and **survives logout**.

## 3.3 Registration flow

```
onboarding -> user-type -> [institution-type] -> institution -> campus
  -> register -> email OTP -> intent -> commute-setup -> Home
```

Employees skip institution-type. The draft is carried in `SignupProvider`, not
navigation params. Institution and campus are **confirmed, not re-asked**, on
the register screen. Email must match the institution's `emailDomains`.

---

# PART 4 — BACKEND SPECIFICATION (Node + MongoDB)

Not built. Specified to implement against.

## 4.1 Collections

```js
users {
  _id, phone, email, passwordHash, name, photoUrl,
  userType: "student"|"teacher"|"employee",
  institutionId, campusId, areaId,
  gender,                        // required for women-only matching
  badgeStatus: "none"|"pending"|"approved"|"rejected",
  badgeDocumentUrl,              // private, never served to other users
  additionalInstitutionIds: [],
  createdAt, deletedAt
}

institutions {
  _id, name, shortName,
  type: "university"|"college"|"school"|"organisation",
  emailDomains: [],              // validates registration
  city, active, featured         // featured pins SZABIST to the top
}

campuses { _id, institutionId, name, areaId }

institutionRequests {
  _id, name, type, website, campusName,
  requestedByEmail, status: "pending"|"approved"|"rejected", createdAt
}
// User submissions NEVER create an institution directly. Admin reviews.

areas { _id, name, city, centroid: { type:"Point", coordinates:[lng,lat] } }
// 2dsphere index. Area-level only, never a street address.

vehicles { _id, ownerId, type:"car"|"bike", model, plate, colour, imageUrl }

commutes {                                  // THE TEMPLATE
  _id, ownerId, intent:"find"|"offer"|"both",
  institutionId, campusId, originAreaId,
  schedule: [{ day, departureTime, returnTime }],   // PER DAY
  direction: "going"|"returning"|"both",
  vehicleId, seatsOffered, contribution,
  womenOnly, status:"active"|"paused"|"cancelled"
}

commuteMembers { commuteId, userId, role:"driver"|"passenger", status }

rideInstances {                             // ONE DATE
  _id, commuteId, date, driverId,           // driverId null = orphaned
  vehicleId, departureTime, returnTime,
  status:"scheduled"|"in_progress"|"completed"|"cancelled"
}                                           // unique (commuteId, date)

attendance {
  rideInstanceId, userId,
  status:"confirmed"|"pending"|"skipped"|"cancelled"|"no_driver"
}

seatRequests {
  _id, requesterId, commuteId,
  days: [],                                 // rider picks WHICH days
  direction, seats, status:"pending"|"accepted"|"declined"
}

areaMatchDecisions { userId, matchId, status:"accepted"|"rejected", commuteVersion }
// Cleared when the user's own schedule changes: a rejected area may now work.

reports { _id, reporterId, reportedId, rideInstanceId, category, detail, status }
blocks  { blockerId, blockedId, createdAt }
notifications { _id, userId, kind, title, body, payload, readAt, createdAt }
```

## 4.2 Matching engine

**Hard constraints, in order:**
1. Same institution (or one of the viewer's `additionalInstitutionIds`)
2. Same campus
3. At least one **compatible day** — compare `schedule` entries day by day
4. Times within the viewer's tolerance **on that day**
5. Not blocked either direction
6. Women-only satisfied on both sides
7. Seats available

Return `matchingDays: Weekday[]`. A partial match is valid and expected.

**Ranking** (only after constraints pass): area proximity (`$geoNear`), time
closeness, seat availability, badge status. Do not surface a percentage unless
it is a real computed number.

## 4.3 The recurring engine — nightly job

1. **Materialise** `rideInstances` for each active commute's days, 14 days out.
2. **Seed** attendance rows as `pending`.
3. **Auto-confirm** at T-12h where a driver is assigned.
4. **Detect orphans** — any instance with `driverId: null` within 7 days →
   mark `no_driver`, notify every member.
5. **Pre-compute replacements** for orphans so the screen opens instantly.
6. **Reminders** at T-12h and T-20min.

Event-driven: driver marks unavailable → clear `driverId` on those dates,
notify, search replacements immediately.

**Never retroactively rewrite past instances** when a template changes.

## 4.4 API surface

```
POST /auth/register · /auth/verify-email-otp · /auth/resend-otp
POST /auth/login · /auth/password-reset · /auth/logout · /auth/refresh

GET  /me            PATCH /me       POST /me/photo
POST /me/badge      (document upload -> badgeStatus: pending)
POST /me/institutions · DELETE /me/institutions/:id

GET  /institutions?q&type    GET /institutions/:id/campuses
POST /institution-requests
GET  /areas?city

GET  /home                        composed Home payload
GET  /commutes/mine  POST /commutes  PATCH /commutes/:id  DELETE /commutes/:id
GET  /commutes/:id/week?start=     POST /commutes/:id/skip
POST /commutes/:id/unavailable     GET  /commutes/:id/replacements?date=
GET  /commutes/:id/members

GET  /matches            GET /matches/summary
POST /matches/:id/area-decision   { accepted | rejected }

GET  /rides/search       GET /rides/:id
POST /rides/:id/request  { days[], direction, seats }
GET  /requests/incoming  POST /requests/:id/accept · /decline

GET  /vehicles  POST /vehicles  DELETE /vehicles/:id

POST /safety/report · /safety/block · /safety/sos · /safety/trip-share
GET  /safety/blocked

GET  /notifications  POST /notifications/:id/read  POST /devices
```

## 4.5 Privacy rules the backend must enforce

1. Never return an exact address. **Area only.**
2. Badge documents are never served to another user. Only `badgeStatus`.
3. Phone numbers exchanged **only after a request is accepted**.
4. Vehicle plate masked until confirmed.
5. Reports are confidential — the reported user is never told who reported.
6. Blocks are silent and bidirectional for matching.
7. Other users are only ever serialised as `PublicUser`
   (`firstName`, `photoUrl`, `verified`). Enforce at the serialiser, not the
   screen.
8. Delete account anonymises reports (safety history survives) but removes
   name, photo, phone, email, documents.

## 4.6 Admin panel

Institutions (add/edit/deactivate), campuses, institution requests
(approve/reject), badge requests (approve/reject with reason), users, reports,
vehicles.

## 4.7 Out of scope, deliberately

Payments (changes the legal character — must be cost reimbursement, not fare
collection). In-app chat (makes it social). Live map/GPS (needs a location
stream and privacy review). Ratings, surge, referrals, gamification.

---

# PART 5 — IF YOU CHANGE ONE THING, DO NOT CHANGE THESE

1. **Commute ≠ RideInstance.** Template vs date. Keep them separate.
2. **Schedules are per day.** No commute-wide time. Matching is per day.
3. **Institution + campus are hard constraints**, applied before ranking.
4. **`PublicUser` is the only shape another user is ever seen in.**
5. **Institution email + OTP is the account check.** The badge is optional.
6. **Money is a contribution, never a fare.**
