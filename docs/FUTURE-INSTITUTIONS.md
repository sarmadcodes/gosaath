# Future Institutions — Not Active

**Status: FUTURE / NOT ACTIVE.** Nothing in this file is selectable in the app.

GoSaath launches at **SZABIST only**. The institutions below are Karachi HEC
institutions that were seeded during early development as a starting point for
expansion. They remain in `src/data/institutions.ts` so the architecture stays
extensible, but every one of them has `active: false` and cannot be chosen
during signup.

An institution goes live only after it has been contacted and onboarded
individually. See [Activation checklist](#activation-checklist) below.

---

## How activation works

Institutions are gated by a single list in `src/data/institutions.ts`:

```ts
export const ACTIVE_INSTITUTION_IDS = ["inst-szabist"];
```

`active` is derived from that list, and every user-facing path filters on it
(`activeInstitutions`, `searchInstitutions`). Adding an id here is what makes an
institution selectable — **do not** flip `active` by hand on a seed, and do not
let a user-submitted institution request create a live institution. Requests go
to `InstitutionRequest` with `status: "pending"` for admin review, by design.

While exactly one institution is active, `isSingleInstitutionLaunch` is true and
the signup flow offers it directly instead of rendering a searchable list of
one. Adding a second active institution restores the search UI automatically —
no screen changes needed.

---

## Currently active

| | |
|---|---|
| **Name** | Shaheed Zulfikar Ali Bhutto Institute of Science and Technology |
| **Short name** | SZABIST University |
| **Id** | `inst-szabist` |
| **Type** | University |
| **City** | Karachi |
| **Campuses** | Clifton Campus *(confirmed)* |
| **Email domains** | `szabist.pk`, `khi.szabist.edu.pk` |
| **Brand colour** | `#0C4DA1` — sampled from the real logo, not estimated |
| **Logo assets** | `inst-szabist-mark.png`, `inst-szabist-wide.png` — both present |
| **Status** | **ACTIVE** |

---

## Future institutions

All rows below are **Karachi**, all **type: university**, all **NOT ACTIVE**.

Two columns need care:

- **Email domain** — these were seeded from publicly known domains during
  development. They are *unverified* and must be confirmed with the institution
  before activation. Do not treat them as authoritative.
- **Campuses** — only the institutions marked below carry anything more
  specific than a single "Main Campus" placeholder. `NEEDS_REAL_CAMPUS_DATA` is
  `true` in the codebase for exactly this reason. **Campus names were never
  invented** — where the real list is unknown, the placeholder is deliberate.

| Institution | Short name | Id | Email domain (unverified) | Campuses on record | Brand colour |
|---|---|---|---|---|---|
| Institute of Business Administration | IBA Karachi | `inst-iba` | `khi.iba.edu.pk`, `iba.edu.pk` | *placeholder* | `#0F4C81` |
| NED University of Engineering and Technology | NED University | `inst-ned` | `neduet.edu.pk`, `cloud.neduet.edu.pk` | *placeholder* | `#00693E` |
| University of Karachi | University of Karachi | `inst-ku` | `uok.edu.pk` | *placeholder* | `#1C6B3C` |
| Aga Khan University | Aga Khan University | `inst-aku` | `aku.edu`, `scholar.aku.edu` | *placeholder* | `#6E2639` |
| Dow University of Health Sciences | DUHS | `inst-duhs` | `duhs.edu.pk` | Ojha Campus | `#134E8E` |
| Habib University | Habib University | `inst-habib` | `sse.habib.edu.pk`, `habib.edu.pk` | *placeholder* | `#C8102E` |
| National University of Computer and Emerging Sciences | FAST NUCES | `inst-fast` | `nu.edu.pk` | *placeholder* | `#0B3C7D` |
| Bahria University | Bahria University | `inst-bahria` | `bahria.edu.pk` | *placeholder* | `#06304B` |
| Air University | Air University | `inst-air` | `au.edu.pk` | *placeholder* | `#12457C` |
| Hamdard University | Hamdard University | `inst-hamdard` | `hamdard.edu.pk` | *placeholder* | `#1B6B4C` |
| IQRA University | IQRA University | `inst-iqra` | `iqra.edu.pk` | Gulshan, North, Malir, M-9 | `#00539B` |
| Greenwich University | Greenwich University | `inst-greenwich` | `greenwich.edu.pk` | *placeholder* | `#0E6C3E` |
| Ilma University | Ilma University | `inst-ilma` | `ilmauniversity.edu.pk` | Main, Gulshan | `#8A1538` |
| Ziauddin University | Ziauddin University | `inst-ziauddin` | `zu.edu.pk` | *placeholder* | `#00519E` |
| Karachi Institute of Economics and Technology | KIET | `inst-kiet` | `kiet.edu.pk` | Ahsanabad Campus | `#123F7B` |
| DHA Suffa University | DHA Suffa University | `inst-dhasuffa` | `dsu.edu.pk` | Main, DHA City | `#0C3C60` |
| Indus University | Indus University | `inst-indus` | `indus.edu.pk` | Main, North | `#1A5632` |
| Baqai Medical University | Baqai Medical University | `inst-baqai` | `baqai.edu.pk` | *placeholder* | `#0E5C4A` |
| ISRA University | ISRA University Karachi | `inst-isra` | `isra.edu.pk` | *placeholder* | `#134B8E` |
| Federal Urdu University of Arts, Science and Technology | FUUAST | `inst-fuuast` | `fuuast.edu.pk` | *placeholder* | `#1F5C3D` |
| National University of Modern Languages | NUML Karachi | `inst-numl` | `numl.edu.pk` | *placeholder* | `#123A6B` |
| National Textile University | NTU Karachi | `inst-ntu` | `ntu.edu.pk` | *placeholder* | `#0B4F6C` |
| Institute of Space Technology | IST Karachi | `inst-ist` | `ist.edu.pk` | *placeholder* | `#12335E` |
| Al-Kawthar University | Al-Kawthar University | `inst-alkawthar` | `alkawthar.edu.pk` | *placeholder* | `#1D5B4E` |
| Virtual University of Pakistan | Virtual University Karachi | `inst-vu` | `vu.edu.pk` | *placeholder* | `#124E78` |

### On the brand colours

**Every colour above except SZABIST's is an approximation.** They were taken
from each institution's general known identity, not sampled from a logo file.
Since the institution's colour becomes the entire app accent once selected,
shipping an approximate value would mean shipping a subtly wrong version of
someone's brand. Sample from the real logo before activating.

### On the logos

Only SZABIST has logo assets. The convention is two files per institution in
`assets/institutions/`:

- `<id>-mark.png` — square-ish mark, used in the institution picker
- `<id>-wide.png` — full horizontal lockup, used in the app header

Both must be registered in the `logos` map in `src/data/institutions.ts` with a
`wideRatio` (width ÷ height of the wide lockup). The ratio is recorded manually
because `Image.resolveAssetSource` does not exist on React Native Web and
crashes the app. An institution with no registered logo falls back to a
brand-coloured monogram, so a missing logo is not a blocker — a wrong colour is.

---

## Activation checklist

Before adding an id to `ACTIVE_INSTITUTION_IDS`:

- [ ] Institution contacted and has agreed to launch
- [ ] Real campus list confirmed — every campus students actually travel to,
      not a "Main Campus" placeholder
- [ ] Email domains confirmed with their IT department, including any
      student-only or faculty-only subdomains
- [ ] Brand colour sampled from the official logo file
- [ ] `<id>-mark.png` and `<id>-wide.png` added and registered with `wideRatio`
- [ ] A contact at the institution who can review verified-badge submissions
- [ ] Enough students signed up that the first user does not land in an empty
      network — matching is only useful with density

The last point is the one most easily missed. A commuter who joins and finds
nobody on their route learns the app does not work, and does not come back.
Launching one institution at a time is what makes the match density work at all.

---

## Types beyond university

`InstitutionType` already supports `university`, `college`, `school` and
`organisation`. Only universities are seeded today.

`organisation` exists for the **Employees & Companies** audience, which is
visible in the signup flow as *Coming soon* and deliberately not selectable.
That is a separate launch with different requirements — company verification
rather than institutional email, and no campus concept — and should not be
switched on by simply activating an organisation seed.
