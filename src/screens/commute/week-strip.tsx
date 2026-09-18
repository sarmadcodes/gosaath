import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "@/components/card";
import { StatusTag } from "@/components/status";
import { Text } from "@/components/text";
import { makeStyles, spacing, useColors } from "@/theme";
import type { CommuteDay } from "@/data/types";

export type WeekStripProps = {
  week: CommuteDay[];
  onSelectDay: (day: CommuteDay) => void;
};

/**
 * The week reads as a list rather than a calendar grid. Each row has to carry
 * a status and an action, and seven tiny squares cannot do that legibly at
 * 375pt without becoming a colour code.
 */
export function WeekStrip({ week, onSelectDay }: WeekStripProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Card padding="none">
      {week.map((entry, index) => {
        const needsAction =
          entry.status === "noDriver" || entry.status === "pending";
        return (
          <Pressable
            key={entry.day}
            accessibilityRole="button"
            accessibilityLabel={`${entry.day} ${entry.date}. ${entry.status}`}
            onPress={() => onSelectDay(entry)}
            style={({ pressed }) => [
              styles.row,
              index !== week.length - 1 && styles.divider,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.dayCell}>
              <Text variant="h4">{entry.day}</Text>
              <Text variant="caption" tone="tertiary">
                {entry.date}
              </Text>
            </View>

            <View style={styles.statusCell}>
              <StatusTag status={entry.status} />
            </View>

            {needsAction ? (
              <Feather
                name="chevron-right"
                size={18}
                color={colors.textTertiary}
              />
            ) : (
              <View style={styles.spacer} />
            )}
          </Pressable>
        );
      })}
    </Card>
  );
}

const useStyles = makeStyles((c) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    minHeight: 60,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  pressed: {
    backgroundColor: c.surfaceSecondary,
  },
  dayCell: {
    width: 56,
    gap: 1,
  },
  statusCell: {
    flex: 1,
  },
  spacer: {
    width: 18,
  },
}));
