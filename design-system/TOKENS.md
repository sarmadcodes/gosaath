# GoSaath — Design System Tokens

Source of truth mirrored 1:1 into Figma variables (collection: `GoSaath/Core`).
These values are what a React Native theme object should be generated from.

## Brand rationale
Trust + movement + community, without literalism. No car icon as a logo. Mark: a simple
abstract two-path monogram (two lines converging into one — "commute together") in a
single weight, works at small sizes, no gradient.

Primary accent: a controlled deep teal ("Transit Green") — reads as calm/trustworthy/
transit-adjacent without copying ride-hailing black/yellow/purple conventions. Used
selectively (primary CTAs, active states, selected chips, key badges) — not backgrounds.

## Typography
- Display / headings: **Manrope** (geometric, modern, distinct at large sizes)
- Body / UI: **Inter** (best-in-class legibility at small sizes, huge weight range)
- Fallback if unavailable in a given Figma env: system default sans (San Francisco /
  Roboto) — never fall back to a serif or decorative face.

| Style | Font | Size / Line height | Weight |
|---|---|---|---|
| Display | Manrope | 32 / 40 | 700 |
| H1 | Manrope | 26 / 32 | 700 |
| H2 | Manrope | 22 / 28 | 600 |
| H3 | Manrope | 18 / 24 | 600 |
| H4 | Inter | 16 / 22 | 600 |
| Body Large | Inter | 16 / 24 | 400 |
| Body | Inter | 14 / 20 | 400 |
| Body Small | Inter | 13 / 18 | 400 |
| Caption | Inter | 12 / 16 | 500 |
| Label | Inter | 12 / 16 | 600 (uppercase tracking +0.02em) |
| Button | Inter | 15 / 20 | 600 |

Rule: only Display/H1 use full bold (700). H2/H3/H4/Button use 600. Body copy is 400.
Never set body text bold for emphasis — use Text Primary vs Text Secondary color instead.

## Color — semantic tokens (light mode, primary)
| Token | Value | Use |
|---|---|---|
| Background | #F7F7F5 | App background |
| Surface | #FFFFFF | Cards, sheets, nav |
| Surface Secondary | #F1F1EE | Nested/inset surfaces, input fill |
| Text Primary | #14171A | Headings, primary copy |
| Text Secondary | #5B6168 | Supporting copy |
| Text Tertiary | #8B9096 | Placeholder, disabled, metadata |
| Border | #E4E4E0 | Card/input borders, dividers |
| Brand | #0F6E5C | Primary CTA, active states, links |
| Brand Secondary | #E4F1EE | Brand-tinted surface (selected chip, badge bg) |
| Success | #1E8E5A | Confirmed, verified, on-time |
| Warning | #B7791F | Pending, attention |
| Error | #C0392B | Cancelled, destructive, failed |
| Info | #2E6FB0 | Informational banners |
| Women-Only | #8A4B8C | Reserved solely for women-only badge/preference, used sparingly |

No other hues are introduced anywhere in the UI.

## Spacing scale
4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64

## Radius scale
8 (inputs, small controls) · 12 (buttons, badges) · 16 (cards) · 20 (sheets, modals) ·
999 (avatars, pills — used deliberately, not by default)

## Elevation
Prefer 1px Border + Surface/Background contrast. One shadow token only, for floating
elements (bottom sheet handles, FAB-equivalents): `0 2px 12px rgba(20,23,26,0.08)`.

## Icon system
Single line-icon set, 1.5px stroke, 24×24 base grid, consistent corner rounding. No
filled/outline mixing except for a deliberate "selected" state (stroke → filled, same
glyph).

## Component tokens (naming used in Figma)
`Button/Primary`, `Button/Secondary`, `Button/Tertiary`, `Button/Destructive`,
`Button/Icon`, `Input/Text`, `Input/Search`, `Input/Phone`, `Input/OTP`,
`Input/Location`, `Input/Date`, `Input/Time`, `Input/Select`, `Card/Ride`,
`Card/Driver`, `Card/Passenger`, `Card/Commute`, `Card/Vehicle`, `Card/Verification`,
`Card/Notification`, `Badge/Verified`, `Badge/University Verified`,
`Badge/Work Verified`, `Badge/Driver Verified`, `Badge/Vehicle Verified`,
`Badge/Women Only`, `Badge/Recurring`, `Navigation/Bottom`, `Sheet/Filter`,
`Sheet/Date`, `Sheet/Time`, `Sheet/Ride Actions`, `Modal/Confirmation`,
`Modal/Destructive`, `Modal/Safety`.

## Touch targets
Minimum 44×44pt for all interactive controls, including icon-only buttons.
