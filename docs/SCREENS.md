# GoSaath — Screen & Flow Inventory

Reflects what is built in `src/app`. Frame references: iPhone SE 375x667 as the
smallest supported screen, iPhone 393x852 as the primary target, Android
360x800 checked as a secondary.

## Authentication — `src/app/(auth)/`

| Route | What it does |
|---|---|
| `welcome` | Brand mark, the "Your daily commute, shared." proposition, three value points, Get started / I already have an account |
| `sign-up` | Mobile number and optional institution email, with inline validation for Pakistani mobile format |
| `otp` | Six-digit code driven by one hidden input so paste and SMS autofill work, resend timer, change number, error state |
| `profile-setup` | Name, area, institution. Four questions, all used for matching |
| `verification` | Why verification exists, then four checks showing all four states: verified, in review, not started, needs attention |

Native splash is configured in `app.json`; the root layout holds it until the
type ramp has loaded to avoid a flash of system font.

## Home — `src/app/(tabs)/index.tsx`

Personal dashboard, not a booking screen. Greeting, today's commute as the only
brand-filled surface on the screen, an alert banner when a day in the routine
needs attention, two quick actions, tomorrow, and the recurring commute summary.

## Rider — `src/app/ride/`

| Route | What it does |
|---|---|
| `find` | From, to, day, time, plus verified / women-only / community preferences. Day and time are stacked because a side-by-side pair truncates real dates at 375pt |
| `results` | Loading skeletons matched to the card shape, populated list, empty state, and an offline state with retry |
| `[id]` | High-trust detail: driver and verification, route timeline, contribution with the cost-sharing explanation, vehicle, safety actions. Handles the ride-no-longer-listed case |
| `confirm` | Summary, optional "make this my daily commute", then a quiet success state with no celebration graphics |
| `rate` | Star rating, contextual quick feedback chips, optional note |

## Recurring commute — `src/app/commute/`

| Route | What it does |
|---|---|
| `create` | Route, day picker, departure and return, preferences, seats offered |
| `group` | Roles, verification and who is travelling next. Explicitly not a social feed |

`(tabs)/commute` is the dashboard: route summary, the week with per-day status
and actions, group preview, and manage actions including cancel.

## Driver — `src/app/driver/`

| Route | What it does |
|---|---|
| `offer` | Route, days, seats, contribution, who can join. Framed as offering spare seats, not running a service |
| `requests` | Incoming seat requests with verification and accept / decline |
| `unavailable` | Pick the days you cannot drive and optionally trigger the replacement search |
| `replacement` | Leads with the answer: verified commuters on a similar route, sorted by overlap |

## Active ride — `src/app/active-ride.tsx`

Focused ride mode: ETA, schematic route, driver with call action, vehicle,
passengers. SOS sits behind a confirmation sheet so a mis-tap in a moving car
cannot raise a false emergency.

## Safety and account

`safety/report` (six concrete categories, confidential, offers blocking
afterwards), `settings`, `notifications`, and `(tabs)/profile`.

## States

Built into the screens that own them rather than as separate mockups: loading
skeletons and offline on `ride/results`, ride-full on `ride/[id]`, no-driver
banners on home and the commute dashboard, verification pending and failed on
`(auth)/verification`, empty rides on `(tabs)/rides`, empty requests on
`driver/requests`.

## React Native notes

- Spacing, radius, colour and type all resolve from `src/theme.ts`, so a value
  is never invented at the call site.
- Layouts use flex and gap throughout, so they map directly to the constraints
  a designer would set.
- Touch targets are at least 44pt, including icon-only controls.
- No effect is used that React Native cannot represent natively.
