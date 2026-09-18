import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing, useColors } from "@/theme";

export type ChoiceCardProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  caption?: string;
  selected?: boolean;
  /**
   * Not yet available. The card stays visible so the user can see where the
   * product is going, but it cannot be chosen.
   */
  disabled?: boolean;
  /** Small pill on the right, e.g. "Coming soon" on a disabled card. */
  badge?: string;
  onPress: () => void;
};

/**
 * Large single-select tile used for the branching decisions in onboarding:
 * who you are, what kind of institution, whether you want a seat or offer one.
 * Selection is carried by border weight and a check as well as colour.
 */
export function ChoiceCard({
  icon,
  label,
  caption,
  selected,
  disabled,
  badge,
  onPress,
}: ChoiceCardProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      accessibilityLabel={
        [label, caption, disabled ? "Coming soon" : null]
          .filter(Boolean)
          .join(". ")
      }
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.mark,
          selected && styles.markSelected,
          disabled && styles.markDisabled,
        ]}
      >
        <Feather
          name={icon}
          size={20}
          color={
            disabled
              ? colors.textTertiary
              : selected
                ? colors.onBrand
                : colors.brand
          }
        />
      </View>

      <View style={styles.copy}>
        <Text variant="h4" tone={disabled ? "tertiary" : "primary"}>
          {label}
        </Text>
        {caption ? (
          <Text variant="bodySmall" tone="tertiary">
            {caption}
          </Text>
        ) : null}
      </View>

      {/* A quiet pill rather than a warning: this is a roadmap note, not an
          error the user has to resolve. */}
      {badge ? (
        <View style={styles.badge}>
          <Text variant="caption" tone="tertiary">
            {badge}
          </Text>
        </View>
      ) : selected ? (
        <Feather name="check-circle" size={20} color={colors.brand} />
      ) : null}
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  selected: {
    borderColor: c.brand,
    borderWidth: 2,
    backgroundColor: c.rideCard,
  },
  disabled: {
    backgroundColor: c.surfaceSecondary,
    borderColor: c.border,
  },
  pressed: {
    opacity: 0.9,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: c.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  markSelected: {
    backgroundColor: c.brand,
  },
  markDisabled: {
    backgroundColor: c.surface,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
}));
