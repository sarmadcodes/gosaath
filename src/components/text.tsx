import { Text as RNText, TextProps as RNTextProps } from "react-native";
import { type, useColors } from "@/theme";
import type { Palette } from "@/theme";

type Variant = keyof typeof type;

type Tone =
  | "primary"
  | "secondary"
  | "tertiary"
  | "brand"
  | "onBrand"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "womenOnly";

const toneKeys: Record<Tone, keyof Palette> = {
  primary: "textPrimary",
  secondary: "textSecondary",
  tertiary: "textTertiary",
  brand: "brand",
  onBrand: "onBrand",
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
  womenOnly: "womenOnly",
};

export type TextProps = RNTextProps & {
  variant?: Variant;
  tone?: Tone;
  /** Renders the label ramp in caps. Used sparingly, for section labels only. */
  uppercase?: boolean;
};

/**
 * The only text primitive in the app. Taking size and family from the ramp
 * rather than accepting raw numbers is what keeps hierarchy consistent
 * across the whole product.
 */
export function Text({
  variant = "body",
  tone = "primary",
  uppercase,
  style,
  ...rest
}: TextProps) {
  const colors = useColors();

  return (
    <RNText
      {...rest}
      style={[
        type[variant],
        { color: colors[toneKeys[tone]] },
        uppercase && { textTransform: "uppercase" },
        style,
      ]}
    />
  );
}
