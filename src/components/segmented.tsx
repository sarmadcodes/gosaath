import { Pressable, View } from "react-native";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing } from "@/theme";

export type SegmentedProps<T extends string> = {
  /**
   * `badge` marks a tab that needs attention. A dot rather than a number:
   * appending "(2)" to a label is what pushes the longest tab past the width
   * available on a 360pt Android screen.
   */
  options: { value: T; label: string; badge?: boolean }[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * Two or three mutually exclusive views. Selection is carried by a raised
 * surface pill on the inset track, which stays legible without relying on the
 * brand colour for every piece of state in the app.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  const styles = useStyles();

  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text
              variant="button"
              tone={selected ? "primary" : "secondary"}
              numberOfLines={1}
            >
              {option.label}
            </Text>
            {option.badge ? <View style={styles.badge} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  badge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: c.brand,
    marginLeft: 5,
  },
  track: {
    flexDirection: "row",
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  segmentSelected: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
}));
