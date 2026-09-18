import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing, useColors } from "@/theme";
import type { AreaSuggestion, ProximityEstimate } from "@/data/types";

// ---------------------------------------------------------------------------
// SelectedLocation
// ---------------------------------------------------------------------------

export type SelectedLocationProps = {
  suggestion: AreaSuggestion;
  onChange: () => void;
};

/** The chosen area, with a way back. Area name only — never an address. */
export function SelectedLocation({
  suggestion,
  onChange,
}: SelectedLocationProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Card padding="regular">
      <View style={styles.selectedRow}>
        <View style={styles.pin}>
          <Feather name="map-pin" size={16} color={colors.brand} />
        </View>
        <View style={styles.flex}>
          <Text variant="h4" numberOfLines={1}>
            {suggestion.name}
          </Text>
          <Text variant="bodySmall" tone="tertiary" numberOfLines={1}>
            {suggestion.hint ?? suggestion.city}
          </Text>
        </View>
        <Button
          label="Change"
          variant="tertiary"
          size="compact"
          onPress={onChange}
        />
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// LocationConfirmation
// ---------------------------------------------------------------------------

export type LocationConfirmationProps = {
  suggestion: AreaSuggestion;
  onConfirm: () => void;
  onChange: () => void;
};

/**
 * Confirm step for a chosen area.
 *
 * The framed panel is where a map goes once Maps is connected. It is drawn as
 * an obvious schematic rather than a fake map, because a placeholder that
 * looks like a real map is the kind of thing that survives to production.
 */
export function LocationConfirmation({
  suggestion,
  onConfirm,
  onChange,
}: LocationConfirmationProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Card padding="regular">
      <View style={styles.mapSlot}>
        <Feather name="map" size={22} color={colors.textTertiary} />
        <Text variant="bodySmall" tone="tertiary" style={styles.centred}>
          Map view appears here once location services are connected
        </Text>
      </View>

      <Text variant="h3" style={styles.confirmTitle} numberOfLines={2}>
        {suggestion.name}
      </Text>
      <Text variant="bodySmall" tone="secondary">
        {suggestion.hint
          ? `${suggestion.hint} · ${suggestion.city}`
          : suggestion.city}
      </Text>

      <Text variant="bodySmall" tone="tertiary" style={styles.privacy}>
        We use your selected area to help find people with a compatible
        commute. We do not continuously track your location, and other
        commuters never see your exact address.
      </Text>

      <View style={styles.confirmActions}>
        <Button label="Confirm area" block onPress={onConfirm} />
        <Button
          label="Choose a different area"
          variant="tertiary"
          block
          onPress={onChange}
        />
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// RoutePreview
// ---------------------------------------------------------------------------

export type RoutePreviewProps = {
  originArea: string;
  destinationCampus: string;
  /** Corridor description, e.g. "Route near Shahrah-e-Faisal". */
  via?: string;
};

/**
 * Origin area to destination campus as a schematic rail.
 *
 * Intentionally not a map: this communicates commute compatibility, and a map
 * pin over somebody's home area would expose more than the product should.
 */
export function RoutePreviewCard({
  originArea,
  destinationCampus,
  via,
}: RoutePreviewProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Card padding="regular">
      <View style={styles.route}>
        <View style={styles.rail}>
          <View style={styles.nodeStart} />
          <View style={styles.connector} />
          <View style={styles.nodeEnd} />
        </View>
        <View style={styles.routeLabels}>
          <Text variant="h4" numberOfLines={1}>
            {originArea}
          </Text>
          <Text variant="h4" numberOfLines={1}>
            {destinationCampus}
          </Text>
        </View>
      </View>

      {via ? (
        <View style={styles.viaRow}>
          <Feather name="navigation" size={13} color={colors.textTertiary} />
          <Text variant="bodySmall" tone="secondary" style={styles.flex}>
            {via}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ProximityIndicator
// ---------------------------------------------------------------------------

export type ProximityIndicatorProps = {
  estimate: ProximityEstimate;
  /** Hides the corridor line where space is tight, e.g. on a list card. */
  compact?: boolean;
};

/**
 * "~12 min away", never "12.37 km".
 *
 * The label is produced by the location service, not computed here — the UI
 * must not invent authoritative-looking numbers from data it does not have.
 */
export function ProximityIndicator({
  estimate,
  compact,
}: ProximityIndicatorProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View style={styles.proximity}>
      <View style={styles.proximityRow}>
        <Feather name="navigation-2" size={13} color={colors.textTertiary} />
        <Text variant="bodySmall" tone="secondary" numberOfLines={1}>
          {estimate.label}
        </Text>
      </View>
      {!compact && estimate.overlapHint ? (
        <Text variant="caption" tone="tertiary" numberOfLines={1}>
          {estimate.overlapHint}
        </Text>
      ) : null}
    </View>
  );
}

const NODE = 9;

const useStyles = makeStyles((c) => ({
  flex: {
    flex: 1,
  },
  centred: {
    textAlign: "center",
  },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: c.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  mapSlot: {
    height: 132,
    borderRadius: radius.md,
    backgroundColor: c.surfaceSecondary,
    borderWidth: 1,
    borderColor: c.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  confirmTitle: {
    marginTop: spacing.base,
  },
  privacy: {
    marginTop: spacing.base,
  },
  confirmActions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  route: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rail: {
    width: NODE,
    alignItems: "center",
    paddingVertical: 7,
  },
  nodeStart: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 2,
    borderColor: c.brand,
  },
  connector: {
    flex: 1,
    width: 2,
    minHeight: spacing.base,
    backgroundColor: c.border,
    marginVertical: 3,
  },
  nodeEnd: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    backgroundColor: c.brand,
  },
  routeLabels: {
    flex: 1,
    gap: spacing.base,
  },
  viaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  proximity: {
    gap: 1,
  },
  proximityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm - 2,
  },
}));
