import { TextStyle } from "react-native";

/**
 * Theme-independent tokens. These do not change between light and dark, so
 * they stay plain exports and can be imported at module scope inside
 * StyleSheet.create without going through the theme hook.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
} as const;

/**
 * Documented radius rule, applied everywhere without exception:
 * inputs and small controls = sm, buttons and badges = md,
 * cards = lg, sheets and modals = xl, avatars and pills = full.
 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const fonts = {
  displayBold: "Manrope_700Bold",
  displaySemi: "Manrope_600SemiBold",
  bodyRegular: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemi: "Inter_600SemiBold",
} as const;

/**
 * Weight is used strategically, not everywhere. Only Display and H1 carry
 * full bold. Emphasis inside body copy is expressed with textSecondary vs
 * textPrimary colour, never by bolding the run of text.
 */
export const type = {
  display: { fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 40 },
  h1: { fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 32 },
  h2: { fontFamily: fonts.displaySemi, fontSize: 22, lineHeight: 28 },
  h3: { fontFamily: fonts.displaySemi, fontSize: 18, lineHeight: 24 },
  h4: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22 },
  bodyLarge: { fontFamily: fonts.bodyRegular, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fonts.bodyRegular, fontSize: 14, lineHeight: 20 },
  bodySmall: { fontFamily: fonts.bodyRegular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  button: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

/** Minimum interactive target. Enforced on every pressable. */
export const MIN_TOUCH_TARGET = 44;

/**
 * The smallest supported screen is the iPhone SE / 8 at 375x667. Layouts
 * are checked against this width before anything else.
 */
export const SMALL_SCREEN_WIDTH = 375;

export const iconStroke = 1.75;
