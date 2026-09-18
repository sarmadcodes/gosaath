/**
 * Light and dark palettes. Every colour in the app resolves from here through
 * useTheme(). Dark is not a separate visual design: it keeps the same
 * hierarchy, the same brand identity and the same semantic meanings, with the
 * surfaces inverted and the accents lifted enough to hold contrast.
 */

export type Palette = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  /**
   * The travelling highlight in a skeleton. Needs its own token because it has
   * to sit *above* the skeleton base in both themes, and `surface` is lighter
   * than the base in light mode but darker in dark.
   */
  skeletonHighlight: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;

  border: string;

  brand: string;
  brandSecondary: string;
  onBrand: string;

  /**
   * Dedicated ride-card surface. A very light mint that separates ride
   * listings from ordinary cards without introducing a new hue.
   */
  rideCard: string;
  rideCardBorder: string;

  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  error: string;
  errorBg: string;
  info: string;
  infoBg: string;

  /** Reserved exclusively for the women-only preference. Never decorative. */
  womenOnly: string;
  womenOnlyBg: string;

  overlay: string;
};

export const lightPalette: Palette = {
  background: "#F7F7F5",
  surface: "#FFFFFF",
  surfaceSecondary: "#F1F1EE",
  skeletonHighlight: "#FAFAF8",

  textPrimary: "#14171A",
  textSecondary: "#5B6168",
  textTertiary: "#8B9096",

  border: "#E4E4E0",

  brand: "#0F6E5C",
  brandSecondary: "#E4F1EE",
  onBrand: "#FFFFFF",

  rideCard: "#EDF6F1",
  rideCardBorder: "#D4E8DF",

  success: "#1E8E5A",
  successBg: "#E7F4EC",
  warning: "#B7791F",
  warningBg: "#FBF0DE",
  error: "#C0392B",
  errorBg: "#FBEAE8",
  info: "#2E6FB0",
  infoBg: "#E8F0F8",

  womenOnly: "#8A4B8C",
  womenOnlyBg: "#F3E9F3",

  overlay: "rgba(20, 23, 26, 0.45)",
};

export const darkPalette: Palette = {
  // Near-black with a faint green cast so the brand sits naturally on it,
  // rather than a neutral grey that would make the teal look bolted on.
  background: "#101312",
  surface: "#181C1B",
  surfaceSecondary: "#1F2423",
  skeletonHighlight: "#2C3331",

  textPrimary: "#F2F3F2",
  textSecondary: "#A3AAA7",
  textTertiary: "#737B78",

  border: "#2A302E",

  // The light brand is too dark to read on a dark surface, so it is lifted
  // while staying recognisably the same teal.
  brand: "#2E9C86",
  brandSecondary: "#16302B",
  onBrand: "#FFFFFF",

  rideCard: "#16241F",
  rideCardBorder: "#24382F",

  success: "#3FB37A",
  successBg: "#122A1F",
  warning: "#D9A441",
  warningBg: "#2E2417",
  error: "#E06A5C",
  errorBg: "#301D1B",
  info: "#5A9BD8",
  infoBg: "#16242F",

  womenOnly: "#B77ABA",
  womenOnlyBg: "#2A1E2B",

  overlay: "rgba(0, 0, 0, 0.6)",
};
