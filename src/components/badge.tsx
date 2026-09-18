import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing, useColors } from "@/theme";
import type { Palette } from "@/theme";

/**
 * Institution email is the account requirement, so it is not a badge. The
 * only trust badge is the optional, admin-reviewed one. The rest describe the
 * ride itself rather than the person.
 */
export type BadgeKind =
  | "verified"
  | "womenOnly"
  | "recurring"
  | "car"
  | "bike"
  | "pending";

type Spec = {
  label: string;
  fg: keyof Palette;
  bg: keyof Palette;
  icon: keyof typeof Feather.glyphMap;
};

const specs: Record<BadgeKind, Spec> = {
  verified: {
    label: "Verified",
    fg: "brand",
    bg: "brandSecondary",
    icon: "check-circle",
  },
  womenOnly: {
    label: "Women only",
    fg: "womenOnly",
    bg: "womenOnlyBg",
    icon: "users",
  },
  recurring: {
    label: "Recurring",
    fg: "textSecondary",
    bg: "surfaceSecondary",
    icon: "repeat",
  },
  car: {
    label: "Car",
    fg: "textSecondary",
    bg: "surfaceSecondary",
    icon: "truck",
  },
  bike: {
    label: "Bike",
    fg: "textSecondary",
    bg: "surfaceSecondary",
    icon: "navigation",
  },
  pending: {
    label: "In review",
    fg: "warning",
    bg: "warningBg",
    icon: "clock",
  },
};

export type BadgeProps = {
  kind: BadgeKind;
  /** Overrides the default copy where a screen needs to be more specific. */
  label?: string;
  /** Sitting on the filled brand surface: tinted white instead of its own colour. */
  onBrand?: boolean;
};

export function Badge({ kind, label, onBrand }: BadgeProps) {
  const styles = useStyles();
  const colors = useColors();
  const spec = specs[kind];
  const text = label ?? spec.label;

  const background = onBrand ? "rgba(255,255,255,0.18)" : colors[spec.bg];
  const foreground = onBrand ? colors.onBrand : colors[spec.fg];

  return (
    <View
      style={[styles.base, { backgroundColor: background }]}
      accessible
      accessibilityLabel={text}
    >
      {/* The icon repeats the meaning of the text rather than replacing it,
          so status is never carried by colour or glyph alone. */}
      <Feather name={spec.icon} size={12} color={foreground} />
      <Text variant="caption" style={{ color: foreground }}>
        {text}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  base: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
}));
