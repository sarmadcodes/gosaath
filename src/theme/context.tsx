import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Platform,
  StyleSheet,
  useColorScheme,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkPalette, lightPalette, type Palette } from "@/theme/palette";

export type ThemeMode = "system" | "light" | "dark";
export type ColorScheme = "light" | "dark";

const STORAGE_KEY = "gosaath.themeMode";

export type Theme = {
  colors: Palette;
  /** The scheme actually in effect, after resolving "system". */
  scheme: ColorScheme;
  /** The user's stored preference, which may be "system". */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /**
   * Overrides the brand accent with the selected institution's colour, so the
   * app wears the user's own campus identity. Pass null to fall back to the
   * GoSaath teal.
   */
  setBrandColor: (color: string | null) => void;
  elevation: ViewStyle;
};

/**
 * Mixes a colour toward a background to produce the tinted surface that pairs
 * with it. Lets any institution colour generate a usable brandSecondary
 * without shipping a hand-picked tint per university.
 */
function tint(hex: string, toward: string, amount: number) {
  const parse = (value: string) => {
    const n = parseInt(value.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
  };
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(toward);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * amount);
  const to2 = (v: number) => v.toString(16).padStart(2, "0");
  return `#${to2(mix(r1, r2))}${to2(mix(g1, g2))}${to2(mix(b1, b2))}`;
}

/** Relative luminance, used to keep text on the accent readable. */
function isLight(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  // Read the stored preference once on mount. Until it resolves we follow the
  // system, which is also the default, so there is no visible flash.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (stored === "light" || stored === "dark" || stored === "system") {
          setModeState(stored);
        }
      })
      .catch(() => {
        // A failed read is not worth surfacing. System default stands.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [brandColor, setBrandColorState] = useState<string | null>(null);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const setBrandColor = useCallback((color: string | null) => {
    setBrandColorState(color);
  }, []);

  const scheme: ColorScheme =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const value = useMemo<Theme>(() => {
    const base = scheme === "dark" ? darkPalette : lightPalette;

    // An institution accent replaces the brand family only. Semantic colours
    // keep their meanings, so success stays green and error stays red
    // whatever the university's identity happens to be.
    const colors: Palette = brandColor
      ? {
          ...base,
          brand: brandColor,
          brandSecondary: tint(
            brandColor,
            scheme === "dark" ? base.background : "#FFFFFF",
            scheme === "dark" ? 0.78 : 0.88,
          ),
          onBrand: isLight(brandColor) ? "#14171A" : "#FFFFFF",
          rideCard: tint(
            brandColor,
            scheme === "dark" ? base.background : "#FFFFFF",
            scheme === "dark" ? 0.86 : 0.94,
          ),
          rideCardBorder: tint(
            brandColor,
            scheme === "dark" ? base.background : "#FFFFFF",
            scheme === "dark" ? 0.72 : 0.82,
          ),
        }
      : base;

    return {
      colors,
      setBrandColor,
      scheme,
      mode,
      setMode,
      // Elevation is borne by borders and surface contrast. This is the one
      // shadow in the system, for genuinely floating elements.
      elevation:
        Platform.OS === "ios"
          ? {
              shadowColor: "#000000",
              shadowOpacity: scheme === "dark" ? 0.4 : 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 2 },
            }
          : { elevation: 3 },
    };
  }, [scheme, mode, setMode, brandColor, setBrandColor]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return theme;
}

/** Convenience for the common case of only needing the palette. */
export function useColors(): Palette {
  return useTheme().colors;
}

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

/**
 * Builds a styles hook from a factory that takes the palette.
 *
 * Keeps style objects co-located at the bottom of the file the way a plain
 * StyleSheet would, while letting every colour resolve from the active theme.
 * The result is memoised per palette, so switching theme rebuilds once rather
 * than on every render.
 *
 *   const useStyles = makeStyles((c) => ({
 *     card: { backgroundColor: c.surface, borderColor: c.border },
 *   }));
 *
 *   function Card() {
 *     const styles = useStyles();
 *     ...
 *   }
 */
export function makeStyles<T extends NamedStyles>(
  factory: (colors: Palette) => T,
) {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
