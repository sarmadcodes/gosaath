import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { WOMEN_ONLY_ENABLED } from "@/data/flags";
import { AppBar } from "@/components/app-bar";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { PersonRow } from "@/components/person-row";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Text } from "@/components/text";
import { formatPkr } from "@/components/contribution";
import { describeDayTimes, sortSchedule } from "@/utils/schedule";
import { makeStyles, spacing, useColors } from "@/theme";
import { SkeletonBlock } from "@/components/skeleton";
import { useRide } from "@/hooks/data";

export default function RideDetails() {
  const styles = useStyles();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: ride, loading } = useRide(id);

  if (loading) {
    return (
      <>
        <AppBar title="Ride details" />
        <Screen contentStyle={styles.content}>
          <SkeletonBlock height={90} />
          <SkeletonBlock height={200} />
          <SkeletonBlock height={120} />
        </Screen>
      </>
    );
  }

  if (!ride) {
    return (
      <>
        <AppBar title="Ride" />
        <Screen>
          <EmptyState
            icon="alert-circle"
            title="This ride is no longer listed"
            body="The person may have changed their commute or filled the last seat."
            actionLabel="Find another ride"
            onAction={() => router.replace("/ride/find")}
          />
        </Screen>
      </>
    );
  }

  const full = ride.seatsAvailable === 0;

  const directionLabel =
    ride.direction === "both"
      ? "Going and returning"
      : ride.direction === "going"
        ? "Going only"
        : "Return only";

  return (
    <>
      <AppBar title="Ride details" />
      <Screen
        footer={
          full ? (
            <Button label="No seats left" block disabled />
          ) : (
            <Button
              label="Request a seat"
              block
              onPress={() => router.push(`/ride/request?id=${ride.id}`)}
            />
          )
        }
        contentStyle={styles.content}
      >
        <Card tone="ride" padding="regular">
          <PersonRow
            user={ride.driver}
            size="lg"
            caption={`${ride.originArea} · ${ride.vehicleType === "car" ? "Car" : "Bike"}`}
          />
        </Card>

        <View style={styles.section}>
          <SectionHeader title="Route" />
          <Card padding="regular">
            <View style={styles.row}>
              <Feather name="map-pin" size={15} color={colors.textTertiary} />
              <Text variant="bodyLarge" style={styles.flex}>
                {ride.originArea}
              </Text>
            </View>
            <View style={styles.row}>
              <Feather name="flag" size={15} color={colors.textTertiary} />
              <Text variant="bodyLarge" style={styles.flex}>
                {ride.destinationCampus}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Feather name="repeat" size={15} color={colors.textTertiary} />
              <Text variant="body" tone="secondary" style={styles.flex}>
                {directionLabel}
              </Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="When they travel"
            caption="Times can differ from day to day."
          />
          <Card padding="none">
            {sortSchedule(ride.schedule).map((entry, index) => (
              <View
                key={entry.day}
                style={[
                  styles.dayRow,
                  index !== ride.schedule.length - 1 && styles.dayDivider,
                ]}
              >
                <Text variant="h4" style={styles.dayLabel}>
                  {entry.day}
                </Text>
                <Text
                  variant="body"
                  tone={
                    entry.arriveBy || entry.leaveCampusAt
                      ? "secondary"
                      : "tertiary"
                  }
                  style={styles.flex}
                >
                  {describeDayTimes(entry)}
                </Text>
              </View>
            ))}
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Your contribution" />
          <Card padding="regular">
            <Text variant="h2">{formatPkr(ride.contribution)}</Text>
            <Text variant="body" tone="secondary" style={styles.costNote}>
              A share of fuel and running costs for this route. GoSaath is
              cost sharing between commuters, not a taxi service, and nobody
              profits from the trip.
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Vehicle" />
          <Card padding="regular">
            <View style={styles.rowBetween}>
              <Text variant="h4" style={styles.flex}>
                {ride.vehicleModel ?? (ride.vehicleType === "car" ? "Car" : "Bike")}
              </Text>
              <Badge kind={ride.vehicleType} />
            </View>
          </Card>
        </View>

        {WOMEN_ONLY_ENABLED && ride.womenOnly ? (
          <Card tone="inset">
            <View style={styles.row}>
              <Feather name="users" size={16} color={colors.womenOnly} />
              <Text variant="bodySmall" tone="secondary" style={styles.flex}>
                This commute is women only.
              </Text>
            </View>
          </Card>
        ) : null}
      </Screen>
    </>
  );
}

const useStyles = makeStyles((c) => ({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.base,
  },
  section: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: c.border,
    marginVertical: spacing.sm,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  dayDivider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  dayLabel: {
    width: 44,
  },
  costNote: {
    marginTop: spacing.sm,
  },
  flex: {
    flex: 1,
  },
}));
