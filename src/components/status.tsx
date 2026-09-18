import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@/components/text";
import { makeStyles, spacing, useColors } from "@/theme";
import type { Palette } from "@/theme";
import type { AttendanceStatus } from "@/data/types";

type Spec = {
  label: string;
  fg: keyof Palette;
  icon: keyof typeof Feather.glyphMap;
};

const specs: Record<AttendanceStatus, Spec> = {
  confirmed: { label: "Confirmed", fg: "success", icon: "check" },
  pending: { label: "Pending", fg: "warning", icon: "clock" },
  skipped: { label: "You skipped", fg: "textTertiary", icon: "minus" },
  cancelled: { label: "Cancelled", fg: "error", icon: "x" },
  noDriver: { label: "No driver", fg: "error", icon: "alert-triangle" },
};

export function statusLabel(status: AttendanceStatus) {
  return specs[status].label;
}

/**
 * Attendance status always pairs an icon and a word with the colour, so the
 * week view is readable for colour-blind users and in bright sunlight.
 */
export function StatusTag({ status }: { status: AttendanceStatus }) {
  const styles = useStyles();
  const colors = useColors();
  const spec = specs[status];

  return (
    <View style={styles.row} accessible accessibilityLabel={spec.label}>
      <Feather name={spec.icon} size={13} color={colors[spec.fg]} />
      <Text variant="caption" style={{ color: colors[spec.fg] }}>
        {spec.label}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 1,
  },
}));
