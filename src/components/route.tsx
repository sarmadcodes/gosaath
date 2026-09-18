import { View } from "react-native";
import { Text } from "@/components/text";
import { makeStyles, spacing } from "@/theme";

export type RouteSummaryProps = {
  from: string;
  to: string;
  variant?: "h3" | "h2" | "h4";
};

/**
 * Compact origin and destination, used in cards and list rows. The arrow is a
 * text glyph so it inherits the type ramp and stays aligned with the labels
 * at every size.
 */
export function RouteSummary({ from, to, variant = "h3" }: RouteSummaryProps) {
  return (
    <Text variant={variant} numberOfLines={2}>
      {from}
      <Text variant={variant} tone="tertiary">
        {"  →  "}
      </Text>
      {to}
    </Text>
  );
}

export type RouteStop = {
  label: string;
  detail?: string;
  time?: string;
};

export type RouteTimelineProps = {
  stops: RouteStop[];
};

/**
 * Vertical timeline for the ride detail screen, where pickup point and any
 * intermediate stops need to be read in order rather than at a glance.
 */
export function RouteTimeline({ stops }: RouteTimelineProps) {
  const styles = useStyles();

  return (
    <View style={styles.timeline}>
      {stops.map((stop, index) => {
        const isLast = index === stops.length - 1;
        return (
          <View key={`${stop.label}-${index}`} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[styles.node, isLast ? styles.nodeEnd : styles.nodeStart]}
              />
              {!isLast ? <View style={styles.connector} /> : null}
            </View>
            <View style={styles.stopBody}>
              <View style={styles.stopHeader}>
                <Text variant="h4" style={styles.flex}>
                  {stop.label}
                </Text>
                {stop.time ? (
                  <Text variant="body" tone="secondary">
                    {stop.time}
                  </Text>
                ) : null}
              </View>
              {stop.detail ? (
                <Text variant="bodySmall" tone="tertiary">
                  {stop.detail}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const NODE = 12;

const useStyles = makeStyles((c) => ({
  timeline: {
    gap: 0,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rail: {
    alignItems: "center",
    width: NODE,
    paddingTop: 5,
  },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 2.5,
  },
  nodeStart: {
    borderColor: c.brand,
    backgroundColor: c.surface,
  },
  nodeEnd: {
    borderColor: c.brand,
    backgroundColor: c.brand,
  },
  connector: {
    flex: 1,
    width: 2,
    minHeight: spacing.xl,
    backgroundColor: c.border,
    marginVertical: 2,
  },
  stopBody: {
    flex: 1,
    gap: 2,
    paddingBottom: spacing.lg,
  },
  stopHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
}));
