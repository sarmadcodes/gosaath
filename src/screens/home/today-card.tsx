import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Text } from "@/components/text";
import { makeStyles, spacing, useColors } from "@/theme";

export type TodayCardProps = {
  originArea: string;
  destinationCampus: string;
  arriveBy: string;
  /**
   * Absent until somebody is actually driving. A commute exists well before a
   * group forms, and the day is still worth showing in the meantime.
   */
  driverFirstName?: string;
  companions: number;
  onView: () => void;
};

const ON_BRAND_RULE = "rgba(255,255,255,0.20)";

/**
 * The one element on Home allowed to use the filled brand surface. Reserving
 * it for the ride happening today is what makes the screen read as a
 * dashboard rather than a list of equally weighted options.
 */
export function TodayCard({
  originArea,
  destinationCampus,
  arriveBy,
  driverFirstName,
  companions,
  onView,
}: TodayCardProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Card tone="brand" padding="regular">
      <Text variant="label" tone="onBrand" uppercase style={styles.eyebrow}>
        Today
      </Text>

      {/* Origin and destination are stacked rather than joined by an arrow.
          Real area and campus names are long enough that an inline route
          wraps mid-phrase on a 375pt screen. */}
      <View style={styles.route}>
        <View style={styles.rail}>
          <View style={styles.nodeStart} />
          <View style={styles.connector} />
          <View style={styles.nodeEnd} />
        </View>
        <View style={styles.routeLabels}>
          <Text variant="h2" tone="onBrand" numberOfLines={1}>
            {originArea}
          </Text>
          <Text variant="h2" tone="onBrand" numberOfLines={1}>
            {destinationCampus}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Feather name="clock" size={15} color={colors.onBrand} />
        <Text variant="bodyLarge" tone="onBrand">
          Leaving at {arriveBy}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Feather
          name={driverFirstName ? "users" : "search"}
          size={15}
          color={colors.onBrand}
        />
        <Text variant="body" tone="onBrand" style={styles.soft} numberOfLines={1}>
          {driverFirstName
            ? `${driverFirstName} driving${
                companions > 0
                  ? ` · ${companions} other ${companions === 1 ? "passenger" : "passengers"}`
                  : ""
              }`
            : "Looking for people on your route"}
        </Text>
      </View>

      <Button
        label={driverFirstName ? "View today's ride" : "See who matches"}
        onPress={onView}
        variant="secondary"
        block
        style={styles.cta}
      />
    </Card>
  );
}

const NODE = 10;

const useStyles = makeStyles((c) => ({
  eyebrow: {
    opacity: 0.75,
  },
  route: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.base,
  },
  rail: {
    width: NODE,
    alignItems: "center",
    paddingTop: 9,
    paddingBottom: 9,
  },
  nodeStart: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 2,
    borderColor: c.onBrand,
  },
  connector: {
    flex: 1,
    width: 2,
    minHeight: spacing.base,
    backgroundColor: ON_BRAND_RULE,
    marginVertical: 3,
  },
  nodeEnd: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    backgroundColor: c.onBrand,
  },
  routeLabels: {
    flex: 1,
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    marginTop: spacing.sm,
  },
  soft: {
    opacity: 0.85,
    flexShrink: 1,
  },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: c.surface,
    borderWidth: 0,
  },
}));
