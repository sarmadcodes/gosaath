import type { Campus, Institution } from "@/data/types";

/**
 * Karachi launch dataset. Karachi institutions only, by design.
 *
 * Two things are still placeholder and marked as such:
 *
 * 1. CAMPUSES — only SZABIST has a confirmed campus name (Clifton). Everything
 *    else carries a single "Main Campus" until the real list arrives, because
 *    inventing campus names would put wrong information in front of users
 *    during registration.
 *
 * 2. BRAND COLOURS — each institution drives the app's accent colour once
 *    selected. The values below are first approximations taken from each
 *    institution's known identity; replace them with exact values from the
 *    logo files as those land.
 */

export const NEEDS_REAL_CAMPUS_DATA = true;

/**
 * Institutions live in the current launch.
 *
 * GoSaath launches at SZABIST. The other seeds below are kept because the
 * architecture is meant to extend to them, but they are NOT selectable: an
 * institution goes live only after it has been contacted and onboarded, and a
 * user must never be able to register into one that has not.
 *
 * See docs/FUTURE-INSTITUTIONS.md. To activate one, add its id here once its
 * campus list and email domains are confirmed.
 */
export const ACTIVE_INSTITUTION_IDS = ["inst-szabist"];

type Seed = Omit<Institution, "active" | "city"> & { campuses?: string[] };

const seeds: Seed[] = [
  {
    id: "inst-szabist",
    name: "Shaheed Zulfikar Ali Bhutto Institute of Science and Technology",
    shortName: "SZABIST University",
    type: "university",
    emailDomains: ["szabist.pk", "khi.szabist.edu.pk"],
    // Sampled from the logo file, not estimated.
    brandColor: "#0C4DA1",
    featured: true,
    campuses: ["Clifton Campus"],
  },
  {
    id: "inst-iba",
    name: "Institute of Business Administration",
    shortName: "IBA Karachi",
    type: "university",
    emailDomains: ["khi.iba.edu.pk", "iba.edu.pk"],
    brandColor: "#0F4C81",
  },
  {
    id: "inst-ned",
    name: "NED University of Engineering and Technology",
    shortName: "NED University",
    type: "university",
    emailDomains: ["neduet.edu.pk", "cloud.neduet.edu.pk"],
    brandColor: "#00693E",
  },
  {
    id: "inst-ku",
    name: "University of Karachi",
    shortName: "University of Karachi",
    type: "university",
    emailDomains: ["uok.edu.pk"],
    brandColor: "#1C6B3C",
  },
  {
    id: "inst-aku",
    name: "Aga Khan University",
    shortName: "Aga Khan University",
    type: "university",
    emailDomains: ["aku.edu", "scholar.aku.edu"],
    brandColor: "#6E2639",
  },
  {
    id: "inst-duhs",
    name: "Dow University of Health Sciences",
    shortName: "DUHS",
    type: "university",
    emailDomains: ["duhs.edu.pk"],
    brandColor: "#134E8E",
    campuses: ["Ojha Campus"],
  },
  {
    id: "inst-habib",
    name: "Habib University",
    shortName: "Habib University",
    type: "university",
    emailDomains: ["sse.habib.edu.pk", "habib.edu.pk"],
    brandColor: "#C8102E",
  },
  {
    id: "inst-fast",
    name: "National University of Computer and Emerging Sciences",
    shortName: "FAST NUCES",
    type: "university",
    emailDomains: ["nu.edu.pk"],
    brandColor: "#0B3C7D",
  },
  {
    id: "inst-bahria",
    name: "Bahria University",
    shortName: "Bahria University",
    type: "university",
    emailDomains: ["bahria.edu.pk"],
    brandColor: "#06304B",
  },
  {
    id: "inst-air",
    name: "Air University",
    shortName: "Air University",
    type: "university",
    emailDomains: ["au.edu.pk"],
    brandColor: "#12457C",
  },
  {
    id: "inst-hamdard",
    name: "Hamdard University",
    shortName: "Hamdard University",
    type: "university",
    emailDomains: ["hamdard.edu.pk"],
    brandColor: "#1B6B4C",
  },
  {
    id: "inst-iqra",
    name: "IQRA University",
    shortName: "IQRA University",
    type: "university",
    emailDomains: ["iqra.edu.pk"],
    brandColor: "#00539B",
    campuses: ["Gulshan Campus", "North Campus", "Malir Campus", "M-9 Campus"],
  },
  {
    id: "inst-greenwich",
    name: "Greenwich University",
    shortName: "Greenwich University",
    type: "university",
    emailDomains: ["greenwich.edu.pk"],
    brandColor: "#0E6C3E",
  },
  {
    id: "inst-ilma",
    name: "Ilma University",
    shortName: "Ilma University",
    type: "university",
    emailDomains: ["ilmauniversity.edu.pk"],
    brandColor: "#8A1538",
    campuses: ["Main Campus", "Gulshan Campus"],
  },
  {
    id: "inst-ziauddin",
    name: "Ziauddin University",
    shortName: "Ziauddin University",
    type: "university",
    emailDomains: ["zu.edu.pk"],
    brandColor: "#00519E",
  },
  {
    id: "inst-kiet",
    name: "Karachi Institute of Economics and Technology",
    shortName: "KIET",
    type: "university",
    emailDomains: ["kiet.edu.pk"],
    brandColor: "#123F7B",
    campuses: ["Ahsanabad Campus"],
  },
  {
    id: "inst-dhasuffa",
    name: "DHA Suffa University",
    shortName: "DHA Suffa University",
    type: "university",
    emailDomains: ["dsu.edu.pk"],
    brandColor: "#0C3C60",
    campuses: ["Main Campus", "DHA City Campus"],
  },
  {
    id: "inst-indus",
    name: "Indus University",
    shortName: "Indus University",
    type: "university",
    emailDomains: ["indus.edu.pk"],
    brandColor: "#1A5632",
    campuses: ["Main Campus", "North Campus"],
  },
  {
    id: "inst-baqai",
    name: "Baqai Medical University",
    shortName: "Baqai Medical University",
    type: "university",
    emailDomains: ["baqai.edu.pk"],
    brandColor: "#0E5C4A",
  },
  {
    id: "inst-isra",
    name: "ISRA University",
    shortName: "ISRA University Karachi",
    type: "university",
    emailDomains: ["isra.edu.pk"],
    brandColor: "#134B8E",
  },
  {
    id: "inst-fuuast",
    name: "Federal Urdu University of Arts, Science and Technology",
    shortName: "FUUAST",
    type: "university",
    emailDomains: ["fuuast.edu.pk"],
    brandColor: "#1F5C3D",
  },
  {
    id: "inst-numl",
    name: "National University of Modern Languages",
    shortName: "NUML Karachi",
    type: "university",
    emailDomains: ["numl.edu.pk"],
    brandColor: "#123A6B",
  },
  {
    id: "inst-ntu",
    name: "National Textile University",
    shortName: "NTU Karachi",
    type: "university",
    emailDomains: ["ntu.edu.pk"],
    brandColor: "#0B4F6C",
  },
  {
    id: "inst-ist",
    name: "Institute of Space Technology",
    shortName: "IST Karachi",
    type: "university",
    emailDomains: ["ist.edu.pk"],
    brandColor: "#12335E",
  },
  {
    id: "inst-alkawthar",
    name: "Al-Kawthar University",
    shortName: "Al-Kawthar University",
    type: "university",
    emailDomains: ["alkawthar.edu.pk"],
    brandColor: "#1D5B4E",
  },
  {
    id: "inst-vu",
    name: "Virtual University of Pakistan",
    shortName: "Virtual University Karachi",
    type: "university",
    emailDomains: ["vu.edu.pk"],
    brandColor: "#124E78",
  },
];

export const institutions: Institution[] = seeds.map((seed) => ({
  id: seed.id,
  name: seed.name,
  shortName: seed.shortName,
  type: seed.type,
  emailDomains: seed.emailDomains,
  brandColor: seed.brandColor,
  featured: seed.featured,
  city: "Karachi",
  active: ACTIVE_INSTITUTION_IDS.includes(seed.id),
}));

/** Selectable institutions. Everything user-facing goes through this. */
export const activeInstitutions = institutions.filter((i) => i.active);

/**
 * True while exactly one institution is live, which is the launch case. The
 * signup flow uses this to offer that institution directly instead of asking
 * the user to search a list of one.
 */
export const isSingleInstitutionLaunch = activeInstitutions.length === 1;

/** The institution to offer when the launch is single-institution. */
export const launchInstitution = activeInstitutions[0];

/**
 * Campus ids are slugged from the name rather than indexed, so reordering or
 * inserting a campus never silently repoints an existing user's record.
 */
function campusSlug(institutionId: string, name: string) {
  const base = name
    .toLowerCase()
    .replace(/\s*campus$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `camp-${institutionId.replace("inst-", "")}-${base || "main"}`;
}

export const campuses: Campus[] = seeds.flatMap((seed) =>
  (seed.campuses ?? ["Main Campus"]).map((name) => ({
    id: campusSlug(seed.id, name),
    institutionId: seed.id,
    name,
  })),
);

/**
 * Logo assets, registered as they arrive.
 *
 * Drop files into assets/institutions/ and add them here. Metro needs a
 * literal require, so this cannot be built from a string path at runtime.
 * Anything absent falls back to a brand-coloured monogram.
 */
type LogoSet = {
  mark?: number;
  wide?: number;
  /**
   * Width divided by height of the wide lockup. Recorded here because
   * Image.resolveAssetSource is unavailable on React Native Web, and every
   * university's lockup is a different shape.
   */
  wideRatio?: number;
};

const logos: Record<string, LogoSet> = {
  "inst-szabist": {
    mark: require("../../assets/institutions/inst-szabist-mark.png"),
    wide: require("../../assets/institutions/inst-szabist-wide.png"),
    wideRatio: 1371 / 437,
  },
  // Add each university the same way as its files land in
  // assets/institutions/, named <id>-mark.png and <id>-wide.png.
};

/** Falls back to a typical lockup shape when a ratio is not recorded. */
export function wideRatio(institutionId: string) {
  return logos[institutionId]?.wideRatio ?? 3.2;
}

export function institutionLogo(
  institutionId: string,
  variant: "mark" | "wide" = "mark",
) {
  const set = logos[institutionId];
  if (!set) return null;
  return set[variant] ?? set.mark ?? null;
}

/** Featured sorts first, then alphabetically by display name. */
export function sortInstitutions(list: Institution[]) {
  return [...list].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (b.featured && !a.featured) return 1;
    return (a.shortName ?? a.name).localeCompare(b.shortName ?? b.name);
  });
}

export function searchInstitutions(query: string, type?: Institution["type"]) {
  const q = query.trim().toLowerCase();
  const pool = institutions.filter(
    (i) => i.active && (type ? i.type === type : true),
  );
  if (!q) return sortInstitutions(pool);
  return sortInstitutions(
    pool.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.shortName ?? "").toLowerCase().includes(q),
    ),
  );
}

export function campusesFor(institutionId: string) {
  return campuses.filter((c) => c.institutionId === institutionId);
}

export function institutionById(id: string) {
  return institutions.find((i) => i.id === id);
}

export function campusById(id: string) {
  return campuses.find((c) => c.id === id);
}

/** "SZABIST University · Clifton Campus", for headers and confirmations. */
export function communityLabel(institutionId: string, campusId: string) {
  const institution = institutionById(institutionId);
  const campus = campusById(campusId);
  if (!institution) return "";
  const name = institution.shortName ?? institution.name;
  return campus ? `${name} · ${campus.name}` : name;
}
