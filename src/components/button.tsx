import { ActivityIndicator, Pressable, View, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@/components/text";
import { makeStyles, MIN_TOUCH_TARGET, radius, spacing, useColors } from "@/theme";

type Variant = "primary" | "secondary" | "tertiary" | "destructive";
type Size = "regular" | "compact";

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  /** Stretches to the container width. Used for primary actions in a screen footer. */
  block?: boolean;
  style?: ViewStyle;
};

const labelTones: Record<Variant, "onBrand" | "brand"> = {
  primary: "onBrand",
  secondary: "brand",
  tertiary: "brand",
  destructive: "onBrand",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "regular",
  disabled,
  loading,
  icon,
  block,
  style,
}: ButtonProps) {
  const styles = useStyles();
  const colors = useColors();

  const surfaces: Record<Variant, { bg: string; border?: string }> = {
    primary: { bg: colors.brand },
    secondary: { bg: colors.surface, border: colors.brand },
    tertiary: { bg: "transparent" },
    destructive: { bg: colors.error },
  };

  const surface = surfaces[variant];
  const tone = labelTones[variant];
  const inert = disabled || loading;
  const contentColour = tone === "onBrand" ? colors.onBrand : colors.brand;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inert, busy: !!loading }}
      accessibilityLabel={label}
      disabled={inert}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === "compact" ? styles.compact : styles.regular,
        {
          backgroundColor: surface.bg,
          borderColor: surface.border ?? "transparent",
          borderWidth: surface.border ? 1.5 : 0,
        },
        block && styles.block,
        // Pressed reads as a physical push rather than a colour change, which
        // keeps the palette stable while still confirming the tap.
        pressed && !inert && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColour} />
      ) : (
        <View style={styles.content}>
          {icon ? <Feather name={icon} size={18} color={contentColour} /> : null}
          <Text variant="button" tone={tone}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles(() => ({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  regular: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  compact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  block: {
    alignSelf: "stretch",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.4,
  },
}));
