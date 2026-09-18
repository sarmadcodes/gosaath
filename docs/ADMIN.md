# GoSaath Admin — Super Admin & University Admin

**Status: specified, not built.** The mobile app comes first. This is the brief
for the two React web panels that follow.

Read [SYSTEM.md](../SYSTEM.md) section 11 first — the role and scope model it
describes is what this document builds on, and it already exists in the mobile
codebase (`src/data/roles.ts`).

---

## 1. Two panels, one system

```
Super Admin  →  Institutions  →  University Admin  →  Students / Faculty
(platform)      (tenants)        (one institution)    (the mobile app)
```

| | University Admin | Super Admin |
|---|---|---|
| Who | Staff at one institution | GoSaath team |
| Scope | Exactly one institution | The whole platform |
| Question it answers | "How is commuting going at my campus?" | "How is the platform doing, and who do we onboard next?" |
| Can create institutions | No | Yes |
| Can assign admins | No | Yes |
| Sees other institutions | **Never** | Yes |

They are **one codebase, one deployment, two navigations.** The role on the
signed-in user decides which shell renders. Building them as separate apps
would duplicate the data layer, the design system and the auth — and would
guarantee they drift.

### The rule that matters most

**Every query is built from the signed-in user's scope, never from an id in the
request.**

```ts
const scope = scopeOf(user);           // null | platform | institution
if (!scope) throw forbidden();
const filter = scope.kind === "platform"
  ? {}
  : { institutionId: scope.institutionId };
```

A university admin who edits a URL, replays a request, or opens devtools must
get nothing. Enforce it in the data layer — a middleware that every admin query
passes through — not in each route handler, and never by hiding UI.

---

## 2. Shared foundations

### Stack

- **React + TypeScript + Vite.** No Next.js: this is a private dashboard behind
  a login, so SSR and SEO buy nothing and add deployment surface.
- **TanStack Query** for server state. The mobile app's `useAsync` deliberately
  mirrors its shape, so the patterns carry across.
- **TanStack Table** for the data grids — sorting, pagination and column
  visibility are not worth rewriting.
- **Recharts** for analytics. Small, composable, easy to theme.
- **React Router** with role-aware route guards.

### Design language, carried from the app

The panel should look like it belongs to the same product. Reuse the exact
tokens from `src/theme/` rather than re-picking them:

- Brand `#0F6E5C`; an institution-scoped panel takes on **that institution's**
  `brandColor`, exactly as the mobile app does
- Manrope for headings, Inter for body — the same ramp
- Flat, restrained, generous whitespace. Hairline dividers, not heavy cards
- Light and dark, following the OS
- Feather icons, one weight
- **No emoji, no gradients, no glassmorphism** — same rules as the app

Where the panel must differ: density. A phone shows one ride; an admin reviews
two hundred students. Use a compact table row (40–44px), a sticky header, and a
persistent left sidebar. Do not make an admin scroll a phone-sized card list.

### Layout

```
┌────────────┬──────────────────────────────────────┐
│            │  Topbar: search · institution · user │
│  Sidebar   ├──────────────────────────────────────┤
│  (nav)     │                                      │
│            │  Page: title, filters, table/chart   │
│            │                                      │
└────────────┴──────────────────────────────────────┘
```

Sidebar collapses under 1100px. The panels are desktop-first — an admin
reviewing verification documents is at a desk — but must stay usable on a
tablet.

### Auth

Same accounts as the mobile app; the panel simply refuses to load for `member`.
Admin sessions warrant more than the app's: **short-lived tokens, mandatory 2FA
for Super Admin, and re-authentication before destructive actions** (deleting
an institution, removing an admin).

---

## 3. University Admin

The institution's own view. Everything below is implicitly filtered to their
institution — that is not a filter the user can change, and the UI should not
imply it is one.

### 3.1 Overview

The landing page. Answers "is this working here?" in one screen.

- **Members**: total, and new this week
- **Active commutes** vs members — the adoption number that matters
- **Matches made** this week
- **Seats offered vs taken** — the supply/demand balance
- **Pending**: verification badges awaiting review, open reports
- A **seven-day activity chart**, and the **top commuter areas** — this is the
  number that tells them where their students actually live, which most
  universities do not know

### 3.2 Students & faculty

A table of members: name, email, type, campus, area, badge status, commute
status, joined date.

- Filter by campus, user type, badge status, has-commute
- Row opens a detail panel: their commute, their group, their reports
- Actions: suspend, restore, resend verification email
- **Export CSV** — they will ask for this on day one

**Never show one member's phone number to an admin without a reason.** Put it
behind a "reveal" that writes an audit entry. Admins are staff, not a reason to
drop the privacy model.

### 3.3 Verification queue

The most-used screen after Overview. A queue of badge requests: the submitted
document, the account it belongs to, and **Approve / Reject with a reason**.

Reject reasons should be a short fixed list plus a note — free text alone
produces "no" and an unhappy student. The outcome pushes a `badgeUpdate`
notification to the app.

### 3.4 Campuses

Add, rename and deactivate campuses; set each one's area.

This is how the "Main Campus" placeholder problem gets solved permanently —
each institution maintains its own real list rather than waiting on us.
Deactivating a campus must warn about the members currently attached to it.

### 3.5 Institution profile

Name, short name, logos (**mark** and **wide**), brand colour, email domains.

- Logo upload previews at real sizes — 34px in the app header, 56px in the
  picker, 1024px for the icon — because a lockup that works on a website
  frequently does not work at 34px
- **The brand colour becomes the entire app accent for their members.** Show a
  live preview of the app's Today card in that colour, and run a contrast check
  against white before allowing save
- Email domains are the gate on who can register. Changing them needs a
  confirmation step that says how many existing accounts would no longer match

### 3.6 Reports & moderation

Reports raised by their members: reporter, reported, category, detail, status.
Actions: dismiss, warn, suspend, escalate to Super Admin. Every action is
audited and the thread keeps its history.

### 3.7 Analytics

Adoption over time; commutes by day of week; **arrival-time distribution**
(genuinely useful to a university — it tells them when their campus is under
load); area heat list; match success rate; seats offered vs filled.

### 3.8 Admin users

Their own institution's admins, with roles. They can invite and remove
institution-level admins but **cannot** create a Super Admin.

---

## 4. Super Admin

Platform-wide. Everything the university panel does, across every institution,
plus the things only we can do.

### 4.1 Platform overview

The live wall. Institutions, members, active commutes, matches today, and
**events streaming in as they happen** — a registration, a commute created, a
report raised. See section 5 for what "live" should and should not mean.

Also: signups by institution (which campuses are actually growing), platform
health, and anything needing attention — pending institution requests,
escalated reports, institutions with zero activity in 7 days.

### 4.2 Institutions

The core Super Admin object. A table of every institution with status
(**Active / Onboarding / Requested / Inactive**), type, city, member count,
adoption, campuses.

Creating one covers: name, short name, type (**university / college / school /
organisation**), city, email domains, campuses, logos, brand colour, and the
first admin to invite.

**Activation is a checklist, not a switch.** The mobile client's
`ACTIVE_INSTITUTION_IDS` becomes an API response, and
`isSingleInstitutionLaunch` derives from it — *no mobile screen changes are
needed*, the institution screen already switches between the single-institution
and search experiences on that flag. The checklist mirrors
[FUTURE-INSTITUTIONS.md](FUTURE-INSTITUTIONS.md):

- [ ] Contacted and agreed to launch
- [ ] Real campus list confirmed
- [ ] Email domains confirmed with their IT department
- [ ] Brand colour sampled from the official logo
- [ ] Both logo files uploaded and previewed at 34px
- [ ] A named admin who will review badges
- [ ] Enough signups that the first user is not alone

That last item is the one that gets skipped and the one that decides whether a
launch works. A commuter who joins and finds nobody on their route learns the
app does not work, and does not return.

**Institution requests** — what users submit from the app — land here as a
queue, with a count of how many people asked for each. That queue is the
roadmap: it tells you which campus to onboard next.

### 4.3 Organisations (Employees & Companies) — later

Same objects, different verification: company domain rather than institutional
email, and **no campus concept** — an office is a single location. The mobile
app already shows this as *Coming soon* and it should stay that way until the
panel can onboard a company properly.

Do not switch it on by activating an `organisation` seed. It is a separate
launch with its own rules.

### 4.4 Users

Every member across every institution. Same table as 3.2 plus an institution
column and cross-institution search. Used for support ("a student emailed us")
and abuse investigation.

### 4.5 Admin management

Create and remove institution admins, assign them to institutions, and manage
Super Admins. Invitations are emailed, single-use and expiring.

**Every action here writes an audit entry.** Admin assignment is the highest-
privilege action on the platform.

### 4.6 Moderation

All reports, all institutions, plus anything escalated. Repeat-offender view
across institutions — somebody removed from one campus should not quietly
reappear at another.

### 4.7 Platform analytics

Growth by institution, retention cohorts, match rate, seat fill rate, area
density maps, verification throughput, report rates per institution.

The metric worth watching above all: **match rate per institution**. A campus
with signups but no matches is a campus about to churn, and that is the signal
to act on.

### 4.8 Configuration

Feature flags, `NEARBY_RADIUS_KM`, the typical contribution band, notification
templates, and the terms/privacy documents.

Those legal documents currently live in `src/data/legal.ts` in the app. Moving
them here means updating them does not require an app release — worth doing
early.

### 4.9 Audit log

Every privileged action: who, what, when, from where. Filterable, exportable,
**append-only**.

Build this **before** the Super Admin panel ships, not after. Institution
activation and admin assignment are exactly the actions that later need an
answer to "who did this", and a log added afterwards cannot answer it for
anything that already happened.

---

## 5. What "live" should mean

Live is the difference between a dashboard people check and a dashboard people
leave open. But a page that reloads everything every few seconds is a page that
burns database capacity and makes tables jump under the cursor.

**Use the right tool per surface:**

| Surface | Approach |
|---|---|
| Overview counters, activity feed | **Server-Sent Events.** One-way, survives proxies, reconnects natively. WebSockets buy nothing here |
| Verification queue, reports | SSE for the *count*, manual refresh for the list |
| Tables | Not live. Poll on focus, plus an explicit refresh |
| Charts | Cached, recomputed every few minutes |

**Never re-sort or re-order a table under the user's cursor.** When new rows
arrive, show "3 new — click to load" and let them decide. That single rule is
the difference between "live" and "unusable".

---

## 6. What the backend needs to add

Beyond the mobile contract in SYSTEM.md:

```
GET    /admin/overview                    scoped counters
GET    /admin/members                     paginated, filterable
GET    /admin/members/:id
POST   /admin/members/:id/suspend
GET    /admin/verifications               pending queue
POST   /admin/verifications/:id/decision  approve | reject + reason
GET    /admin/campuses
POST   /admin/campuses
PATCH  /admin/institutions/:id            profile, logos, colour, domains
GET    /admin/reports
POST   /admin/reports/:id/action
GET    /admin/analytics/:metric
GET    /admin/events                      SSE stream

Super Admin only:
GET    /admin/institutions
POST   /admin/institutions
POST   /admin/institutions/:id/activate   runs the checklist
GET    /admin/institution-requests
POST   /admin/admins                      invite
GET    /admin/audit
```

Every one of these resolves its scope from the session. `/admin/institutions`
returns 403 for a university admin — it does not return their own institution
as a courtesy, because that teaches the client the wrong shape.

**Indexes**: `institutionId` on users, commutes and reports already exists for
matching and covers most of this. Add `{institutionId, createdAt}` for the
paginated tables and `{status, institutionId}` for the queues.

---

## 7. Build order

1. **Shell** — auth, role routing, sidebar, theme, one empty page
2. **Audit log** — before anything privileged exists
3. **University Admin: Overview + Members + Verification queue** — the three
   screens that make the panel worth opening
4. **Campuses + Institution profile** — this is what finally fixes the
   placeholder campus and approximate-colour problem
5. **Reports**
6. **Super Admin: Institutions + activation checklist + requests queue**
7. **Admin management**
8. **Analytics, both panels**
9. **SSE / live layer** — last, once the pages it enhances exist
10. **Organisations**, when the employee launch is ready

Steps 3 and 4 are the ones that unblock the mobile app: every remaining "not
done" item about logos, colours and campus lists is a University Admin feature,
not seed data.
