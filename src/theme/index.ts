/**
 * Single entry point for the design system.
 *
 * Theme-independent tokens (spacing, radius, type) are plain exports and can
 * be used at module scope. Colours are theme-dependent and must be read
 * through useTheme / useColors / makeStyles.
 */

export {
  spacing,
  radius,
  fonts,
  type,
  MIN_TOUCH_TARGET,
  SMALL_SCREEN_WIDTH,
  iconStroke,
} from "@/theme/tokens";

export { lightPalette, darkPalette, type Palette } from "@/theme/palette";

export {
  ThemeProvider,
  useTheme,
  useColors,
  makeStyles,
  type Theme,
  type ThemeMode,
  type ColorScheme,
} from "@/theme/context";
