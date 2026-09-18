# GoSaath Backend — Step 1 Audit & Step 2 Architecture

Produced before writing code, per the implementation brief's Step 1.
Source of truth inspected: `src/services/api.ts`, `src/data/types.ts`,
`src/data/roles.ts`, `src/data/areas.ts`, `src/data/institutions.ts`,
`src/services/mock.ts`, `src/hooks/data.ts`, `SYSTEM.md`, `docs/ADMIN.md`.

---

## 1. The contract, as it actually exists

14 namespaces, 57 methods. This is the full surface the backend must serve.

| Namespace | Methods | Notes |
|---|---|---|
| `auth` | register, verifyEmailOtp, resendOtp, login, requestPasswordReset, logout, restore | 7 |
| `institutions` | search, campuses, request | 3 |
| `me` | get, update, setPhoto, requestBadge, addInstitution, removeInstitution | 6 |
| `commutes` | mine, create, update, cancel | 4 |
| `commuteWeek` | week, members, skipDay, setUnavailable, replacements | 5 |
| `matches` | summary, list, setAreaMatch | 3 |
| `rides` | search, nearby, get, requestSeat, incomingRequests, sentRequests, respondToRequest | 7 |
| `vehicles` | list, save, remove | 3 |
| `areas` | list | 1 |
| `location` | search, recent, proximity, route | 4 |
| `notifications` | list, markRead, registerPushToken, unregisterPushToken | 4 |
| `safety` | report, block, unblock, blocked | 4 |
| `support` | submit | 1 |
| `preferences` | get, update | 2 |

**Return-shape rules already encoded in the client** and non-negotiable:

- `commutes.mine()` → `Commute | null`. `null` drives the "set up your
  commute" empty state; `[]` or `{}` would break it.
- Mutations return the **updated domain object**, not `{ ok: true }`. The
  client re-renders from the response (`me.update` → `User`,
  `respondToRequest` → `SeatRequest`, `skipDay` → `CommuteDay[]`).
- Lists return `[]`. Never `null`.
- Failures must **throw**, not return empty. `useAsync` distinguishes
  loading / error / empty, and the UI renders three different things.

---

## 2. Conflicts found — these need decisions

Six places where the brief and the existing contract disagree, or where the
contract cannot be implemented as written. Surfacing rather than inventing.

### 2.1 `NEARBY_RADIUS_KM = 3` is not computable from current data

**The problem.** `src/data/areas.ts` is `{ id, name, city }` — 16 Karachi
areas, **no coordinates of any kind**. The mock's `distanceKm` is fabricated
from array index order (`steps * 1.4`). There is no real geography anywhere in
the system, so "within 3 km" cannot currently be evaluated.

**Recommendation — add area centroids, not user coordinates.**

Storing "Gulshan-e-Iqbal's centre is at 24.92, 67.09" is public reference data
about a *neighbourhood*. It is categorically different from storing where a
*person* is, and it does not violate rule 2.4, which is about user location.
The user record still holds only `areaId`; no lat/lng is ever collected from,
stored against, or returned for a human being.

```
areas: { _id, name, city, centroid: { lat, lng }, active }
```

Distance is then area-centroid to area-centroid, computed server-side, used
only as a filter, and **never returned**. `ProximityEstimate.distanceKm` stays
internal; the client renders `label` only, exactly as it does today.

**Alternative if you reject centroids:** an explicit `adjacentAreaIds` list per
area, hand-curated. No geography at all, but someone maintains 16+ adjacency
lists by hand and "3 km" becomes "one hop", which is not what the brief says.

**I need your decision.** Centroids is my recommendation.

### 2.2 `me.update(patch: Partial<User>)` is a mass-assignment hole

The contract literally accepts a partial `User`, which includes `role`,
`institutionId`, `campusId`, `badgeStatus` and `additionalInstitutionIds`.
Taken at face value this lets any member POST `{"role":"superAdmin"}`.

**Resolution:** the backend whitelists. Only `name`, `phone`, `photoUrl`,
`areaId` are writable through this route. Everything else is rejected with 403
rather than silently dropped — silent dropping hides an attack.

No client change needed; the app only ever sends those four.

### 2.3 `RideSearch` lets the client send `institutionId` / `campusId`

`RideSearch` has optional `institutionId` and `campusId`. Rule 2.3 says these
are hard constraints, not filters.

**Resolution:** the backend **ignores** both fields and always uses the
caller's own institution and campus from the session. If a supplied value
differs from the caller's own, return 403 rather than empty results — an empty
list teaches an attacker the field is respected but unlucky.

The client never populates them (verified in `ride/find.tsx`), so this is
defence against a tampered client, not a UI change.

### 2.4 `commuteWeek.*` takes a `commuteId` — IDOR surface

`week(commuteId)`, `members(commuteId)`, `skipDay(commuteId, day)`,
`setUnavailable`, `replacements` all accept an id from the client.

**Resolution:** every one verifies `commute.ownerId === session.userId`
(or membership, for `members`) before doing anything. 404, not 403, for a
commute the caller has no relationship with — 403 confirms the id exists.

### 2.5 `matches.setAreaMatch` is client-side today

Area decisions currently persist to AsyncStorage (`gosaath.areaMatches`) via
`src/services/area-match.ts`. The contract already declares the server method
and SYSTEM.md says to move it server-side.

**Resolution:** implement `areaMatches` server-side, keyed
`{ userId, matchedUserId }` so a decision survives reinstall and both devices.
Then delete `area-match.ts` and the AsyncStorage key during integration — that
is a small, contained client change and the only one I expect to need.

### 2.6 `safety.report` returns `void`, but moderation needs a lifecycle

The client's `report()` returns nothing. `docs/ADMIN.md` needs
`open / dismissed / warned / suspended / escalated`.

**No conflict, but worth stating:** the lifecycle lives entirely on the admin
side. The member-facing method stays `void`. Do not "helpfully" return a
report id to the reporter — it gives them something to poll and implies an
entitlement to the outcome that the product does not offer.

---

## 3. Architecture

### 3.1 Repository shape

**Separate repo, `gosaath-backend`.** Not a monorepo with the Expo app: Metro's
resolver walks up the tree and a second `node_modules` with a different
TypeScript target is a reliable source of bundler confusion. Two repos, one
shared contract file.

The contract stays authoritative by being **copied, not re-declared**:
`src/data/types.ts` and `src/services/api.ts` are vendored into the backend as
`src/contract/` with a check script that fails CI if they drift from the app's
copies. Re-typing them by hand is how response shapes silently diverge.

### 3.2 Stack

| Choice | Why |
|---|---|
| **Fastify** | Fastest mature Node framework; schema-first validation is native, not bolted on |
| **TypeScript**, strict | Non-negotiable per brief |
| **MongoDB driver + Mongoose** | Mongoose for schema/index declaration and hooks; raw driver for the matching aggregation where every millisecond counts |
| **Zod** | Validation, and the single source for OpenAPI generation so docs cannot drift |
| **Argon2id** | Password hashing, per brief §15 |
| **Pino** | Structured logging, Fastify-native, fast |
| **BullMQ + Redis** | Jobs. Justified: push delivery must not block the request, and instance generation must not double-run across PM2 workers |
| **Vitest + Testcontainers** | Real MongoDB in integration tests, not a mock |

### 3.3 Request path

```
HTTP
 → rate limit            (per IP + per account on auth routes)
 → body/params/query validation  (Zod, rejects unknown keys)
 → authenticate          (verify JWT: signature, exp, iss, aud, type, session state)
 → authorize             (role gate)
 → scope                 (AdminScope derived from the session, never the request)
 → controller            (HTTP only: parse, delegate, shape response)
 → service               (business rules, transactions, invariants)
 → repository            (Mongo access, projections, indexes)
 → MongoDB
```

Errors funnel through one handler that maps typed errors to status codes and
emits `{ error: { code, message, requestId } }`. Mongo errors never reach the
client — `E11000` on email becomes "An account with this email already exists."

### 3.4 The scope rule, mechanically

Not a convention — a function every admin repository call must take:

```ts
function scopeFilter(user: SessionUser): Record<string, unknown> {
  const scope = scopeOf(user);
  if (!scope) throw new AuthorizationError();
  return scope.kind === "platform" ? {} : { institutionId: scope.institutionId };
}
```

Admin repositories accept `scope` as their **first parameter** and merge it
last, so a caller-supplied `institutionId` cannot override it. A university
admin hitting `/admin/institutions` gets 403 — not their own institution as a
courtesy, which would teach the client the wrong shape.

### 3.5 Collections and indexes

| Collection | Indexes |
|---|---|
| `users` | `email` **unique** (lowercased, trimmed); `{institutionId, campusId}`; `{institutionId, createdAt}` |
| `institutions` | `active`; `emailDomains` |
| `campuses` | `{institutionId, active}` |
| `institutionRequests` | `{status, createdAt}` |
| `areas` | `city`; `{city, active}` |
| `commutes` | `{institutionId, campusId, status}` ← the match query; `ownerId` |
| `rideInstances` | `{commuteId, date}` **unique**; `{date, status}` |
| `attendance` | `{rideInstanceId, userId}` **unique** |
| `seatRequests` | `{driverId, status}`; `{requesterId, status}`; `{rideInstanceId, requesterId}` **unique** |
| `vehicles` | `ownerId` |
| `notifications` | `{userId, unread, createdAt}` |
| `pushTokens` | `token` **unique**; `userId` |
| `reports` | `{institutionId, status, createdAt}` |
| `blocks` | `{blockerId, blockedId}` **unique**; `blockedId` |
| `areaMatches` | `{userId, matchedUserId}` **unique** |
| `preferences` | `userId` **unique** |
| `auditLog` | `{createdAt}`; `{actorUserId}`; `{institutionId, createdAt}` |
| `supportRequests` | `{status, createdAt}` |

Every unique index above is a correctness guarantee, not an optimisation:
duplicate ride instances, double attendance, double blocks and duplicate seat
requests are all prevented by the database rather than by hopeful application
checks.

### 3.6 The two hard concurrency problems

**Seat acceptance.** Never read-then-write. One atomic
`findOneAndUpdate` on the ride instance guarded by
`$expr: { $lt: ["$seatsTaken", "$seatsOffered"] }`, incrementing `seatsTaken`,
inside a transaction with the attendance insert and the request state change.
If the guard fails, the request is rejected with a 409 "last seat has gone".
Ten concurrent requests against two seats must yield exactly two.

**Instance generation.** `{commuteId, date}` unique plus bulk `upsert`, so two
PM2 workers racing produce one row. Under BullMQ the job is additionally
single-flighted by a repeatable job key.

### 3.7 Time

`arriveBy` / `leaveCampusAt` are **local wall-clock strings** ("08:00"), not
timestamps. They are stored as strings and compared as minutes-since-midnight.
`RideInstance.date` is a calendar date in `Asia/Karachi`, stored as a UTC
timestamp anchored to local midnight. Server timezone is never consulted;
`TZ=Asia/Karachi` is set explicitly and date maths goes through one `dates.ts`.

Pakistan has no DST, which removes the worst class of bug here — but the code
must not *depend* on that.

---

## 4. Build order

Mapped to the brief's steps, with a verification gate after each.

| Phase | Deliverable | Gate |
|---|---|---|
| 0 | Skeleton, config, logging, errors, health, Mongo pool, graceful shutdown | Boots, `/health/ready` honest |
| 1 | Models + indexes + seed (areas, SZABIST, Clifton) | Indexes asserted in a test |
| 2 | Auth: register, OTP, verify, login, restore, logout, reset | Integration + brute-force tests |
| 3 | me, institutions, campuses, areas, preferences, vehicles | Mass-assignment tests pass |
| 4 | Commutes, DaySchedule, RideInstance generation, attendance, day exceptions | Idempotency test: job twice → one row |
| 5 | **Matching** + search + nearby + blocks both directions | `explain()` shows IXSCAN; cross-institution + block tests |
| 6 | Seat requests, accept/decline | **10-concurrent-against-2-seats test** |
| 7 | Notifications, push tokens, delivery job | Delivery does not block the response |
| 8 | Safety, reports, support | |
| 9 | **Audit log + scope middleware** — before any admin route | Member cannot read or write audit |
| 10 | University Admin | IDOR suite across members/campuses/reports |
| 11 | Super Admin + activation checklist | Privilege-escalation suite |
| 12 | SSE | Scoped events; university admin never sees another institution |
| 13 | Perf: load, p95/p99, query plans | |
| 14 | Security review, then `httpApi` integration | App runs against the real backend |

Phases 0–6 are the product. After those, SZABIST works end to end.

---

## 5. Blocker

**Disk: 136 MB free of 244 GB.**

A Fastify + Mongoose + TypeScript + Vitest + Testcontainers `node_modules` is
roughly 400–600 MB. `npm install` cannot run, so phases 0 onward cannot start,
and nothing can be typechecked or tested — which the brief's own §163 and §166
require after every phase.

Writing source files that cannot be compiled or tested would directly violate
the working style this brief sets out. I am not going to do that.

**To clear it** (all regenerable, none of it source):

```
HedPop/node_modules           1.67 GB
MissedMoments/node_modules    1.64 GB
calculator-app/node_modules   1.29 GB
netflix-platform/node_modules 1.08 GB
```

Any two of those is enough. `npm install` restores them.

Also recommended before starting: `git init` in both repos. SYSTEM.md was
destroyed by a disk-full truncation this week and there was nothing to restore
from.
