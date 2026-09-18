import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing, useColors } from "@/theme";

type Action = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  caption: string;
  onPress: () => void;
};

export type QuickActionsProps = {
  /** Omitted before a commute exists — there is nothing to search against. */
  onFindRide?: () => void;
  onOfferSeats: () => void;
};

/**
 * Two entry points, never more. "Offer seats" rather than "become a driver",
 * because the same person does both depending on the day and the product
 * should not ask them to pick an identity.
 */
export function QuickActions({ onFindRide, onOfferSeats }: QuickActionsProps) {
  const styles = useStyles();
  const colors = useColors();

  const actions: Action[] = [
    ...(onFindRide
      ? [
          {
            icon: "search" as const,
            label: "Find a ride",
            caption: "Going your way",
            onPress: onFindRide,
          },
        ]
      : []),
    {
      icon: "plus-circle",
      label: "Offer seats",
      caption: "Share your drive",
      onPress: onOfferSeats,
    },
  ];

  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          accessibilityRole="button"
          accessibilityLabel={`${action.label}. ${action.caption}`}
          onPress={action.onPress}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <View style={styles.mark}>
            <Feather name={action.icon} size={18} color={colors.brand} />
          </View>
          <View style={styles.copy}>
            <Text variant="h4">{action.label}</Text>
            <Text variant="bodySmall" tone="tertiary">
              {action.caption}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.base,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.lg,
  },
  pressed: {
    backgroundColor: c.surfaceSecondary,
  },
  mark: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: c.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    gap: 2,
  },
}));
