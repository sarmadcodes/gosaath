import { Pressable, View } from "react-native";
import { Text } from "@/components/text";
import { makeStyles, MIN_TOUCH_TARGET, radius, spacing } from "@/theme";
import { WEEKDAYS, type Weekday } from "@/data/types";

export type DayPickerProps = {
  value: Weekday[];
  onChange: (days: Weekday[]) => void;
};

/**
 * Seven round targets sized to stay tappable at 375pt. Selected state uses a
 * filled brand chip plus a weight change so it does not rely on colour alone.
 */
export function DayPicker({ value, onChange }: DayPickerProps) {
  const styles = useStyles();

  function toggle(day: Weekday) {
    onChange(
      value.includes(day) ? value.filter((d) => d !== day) : [...value, day],
    );
  }

  return (
    <View style={styles.row}>
      {WEEKDAYS.map((day) => {
        const selected = value.includes(day);
        return (
          <Pressable
            key={day}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={day}
            onPress={() => toggle(day)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text
              variant={selected ? "h4" : "body"}
              tone={selected ? "onBrand" : "secondary"}
            >
              {day.slice(0, 1)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const SIZE = 40;

const useStyles = makeStyles((c) => ({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.xs + 2,
  },
  chip: {
    flex: 1,
    height: SIZE,
    minWidth: SIZE - 8,
    minHeight: MIN_TOUCH_TARGET - 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: c.brand,
    borderColor: c.brand,
  },
}));
