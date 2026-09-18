import { Pressable, View, ViewProps, ViewStyle } from "react-native";
import { makeStyles, radius, spacing, useColors } from "@/theme";

export type CardProps = ViewProps & {
  /**
   * brand renders the filled hero treatment used for the active commute.
   * ride is the dedicated light-green surface used for ride listings.
   */
  tone?: "default" | "brand" | "inset" | "ride";
  padding?: keyof typeof paddings;
  onPress?: () => void;
  style?: ViewStyle;
};

const paddings = {
  none: 0,
  compact: spacing.base,
  regular: spacing.lg,
} as const;

/**
 * Elevation comes from a hairline border against the app background, not from
 * a shadow. This is what keeps long scrolling lists calm.
 */
export function Card({
  tone = "default",
  padding = "compact",
  onPress,
  style,
  children,
  ...rest
}: CardProps) {
  const styles = useStyles();
  const colors = useColors();

  const surfaces: Record<NonNullable<CardProps["tone"]>, ViewStyle> = {
    default: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    brand: { backgroundColor: colors.brand },
    inset: { backgroundColor: colors.surfaceSecondary },
    ride: {
      backgroundColor: colors.rideCard,
      borderWidth: 1,
      borderColor: colors.rideCardBorder,
    },
  };

  const composed = [styles.base, surfaces[tone], { padding: paddings[padding] }, style];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [...composed, pressed && styles.pressed]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={composed} {...rest}>
      {children}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  base: {
    borderRadius: radius.lg,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
}));
