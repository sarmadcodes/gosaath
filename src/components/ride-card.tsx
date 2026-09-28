import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { WOMEN_ONLY_ENABLED } from "@/data/flags";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { formatPkr } from "@/components/contribution";
import { Text } from "@/components/text";
import { describeSchedule } from "@/utils/schedule";
import { makeStyles, spacing, useColors } from "@/theme";
import type { RideListing } from "@/data/types";

export type RideCardProps = {
  ride: RideListing;
  onPress?: () => void;
};

/**
 * Deliberately sparse. The card has to be readable in two or three seconds,
 * so it carries only what decides whether this ride is worth opening: who,
 * vehicle, where, when, cost and whether a seat is free.
 *
 * No rating, no ride count, no join date, no paragraph of detail.
 */
export function RideCard({ ride, onPress }: RideCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const full = ride.seatsAvailable === 0;

  return (
    <Card
      tone="ride"
      onPress={onPress}
      accessibilityLabel={`Ride with ${ride.driver.firstName}`}
    >
      <View style={styles.header}>
        <Avatar
          name={ride.driver.firstName}
          photoUrl={ride.driver.photoUrl}
          size="sm"
        />
        <Text variant="h4" style={styles.shrink} numberOfLines={1}>
          {ride.driver.firstName}
        </Text>
        {ride.driver.verified ? <Badge kind="verified" /> : null}
        <View style={styles.spacer} />
        <Badge kind={ride.vehicleType} />
      </View>

      {/* When every result is from the viewer's own campus, the destination
          is the same on every card and already sits in the screen header.
          Repeating it here only truncates the origin, which is the part that
          actually differs between rides. */}
      <View style={styles.route}>
        <Text variant="h3" numberOfLines={1} style={styles.shrink}>
          {ride.originArea}
        </Text>
        {!ride.sameCampus ? (
          <>
            <Feather name="arrow-right" size={15} color={colors.textTertiary} />
            <Text variant="h4" style={styles.shrink} numberOfLines={1}>
              {ride.destinationCampus}
            </Text>
          </>
        ) : null}
      </View>

      <View style={styles.meta}>
        <Feather name="calendar" size={13} color={colors.textTertiary} />
        <Text variant="bodySmall" tone="secondary" style={styles.shrink}>
          {describeSchedule(ride.schedule)}
        </Text>
      </View>

      {WOMEN_ONLY_ENABLED && ride.womenOnly ? (
        <View style={styles.tags}>
          <Badge kind="womenOnly" />
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text variant="h3">{formatPkr(ride.contribution)}</Text>
        <Text
          variant="caption"
          tone={full ? "tertiary" : "success"}
          style={styles.seats}
        >
          {full
            ? "No seats left"
            : `${ride.seatsAvailable} seat${ride.seatsAvailable === 1 ? "" : "s"} free`}
        </Text>
      </View>
    </Card>
  );
}

const useStyles = makeStyles((c) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  shrink: {
    flexShrink: 1,
  },
  spacer: {
    flex: 1,
  },
  route: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs + 2,
  },
  tags: {
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: c.rideCardBorder,
  },
  seats: {
    textAlign: "right",
  },
}));
