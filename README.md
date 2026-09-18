# GoSaath

Recurring-commute app for people who travel the same route to university or
work. Built with Expo (SDK 57), React Native 0.86, TypeScript and Expo Router.

**Set up your commute once. GoSaath handles the rest.**

## Running it

```bash
npm install
npx expo start
```

Press `i` for iOS, `a` for Android, or `w` for web. The web target is useful for
quick layout checks; the design targets 375x667 as the smallest supported
screen.

## Layout

```
src/
  app/            Expo Router routes only, one file per route
    (auth)/       welcome, sign-up, otp, profile-setup, verification
    (tabs)/       home, commute, rides, profile
    ride/         find, results, [id], confirm, rate
    commute/      create, group
    driver/       offer, requests, unavailable, replacement
    safety/       report
  components/     Reusable UI, one named export per file
  screens/        Screen bodies too large to sit in a route file
  data/           Domain types and sample content
  utils/          Standalone helpers
  theme.ts        The single source of design tokens
```

## Design system

`src/theme.ts` is the only place colour, spacing, radius and type values are
defined. Nothing in the UI hardcodes them. It mirrors
[design-system/TOKENS.md](design-system/TOKENS.md), which carries the reasoning.

- **Type**: Manrope for display and headings, Inter for body and UI. Eleven
  ramp entries, exposed through the `Text` component's `variant` prop.
- **Colour**: neutral background, white surfaces, one teal brand accent used
  selectively, plus semantic tokens. `womenOnly` is reserved for that
  preference and used nowhere else.
- **Radius**: a documented rule applied everywhere. Inputs 8, buttons and
  badges 12, cards 16, sheets 20, avatars and pills full.
- **Elevation**: hairline borders and surface contrast, not shadows. One shadow
  token exists, for genuinely floating elements.
- **Icons**: Feather via `@expo/vector-icons`, one family throughout.

## Conventions worth knowing

- Every interactive control is at least 44pt. Status is never carried by colour
  alone: attendance, verification and errors all pair an icon and a word with
  the colour.
- Money is always an "estimated contribution", never a fare. The product is
  cost sharing between commuters, and the copy reflects that everywhere.
- Locations are areas, never street addresses.
- Screens go through the `Screen` component so safe areas, the keyboard and the
  pinned footer behave the same on both platforms.
- Empty, loading and error states are built alongside the populated state
  rather than added later.

## What is stubbed

Sample content in `src/data/content.ts` stands in for the API. Search, booking
and verification resolve locally with a short delay so loading and error states
are real and reachable. The active ride screen uses a schematic route rather
than a live map; the map layer is an implementation concern that the
information hierarchy does not depend on.
