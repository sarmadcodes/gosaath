import { Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Sheet } from "@/components/sheet";
import { Text } from "@/components/text";
import { makeStyles, MIN_TOUCH_TARGET, spacing, useColors } from "@/theme";

export type OptionSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  value?: string;
  onSelect: (value: string) => void;
};

/**
 * Single-select list used for areas, times and short pick lists. Areas rather
 * than exact addresses, which keeps home locations off the screen entirely.
 */
export function OptionSheet({
  visible,
  onClose,
  title,
  options,
  value,
  onSelect,
}: OptionSheetProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {options.map((option, index) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
              style={({ pressed }) => [
                styles.row,
                index !== options.length - 1 && styles.divider,
                pressed && styles.pressed,
              ]}
            >
              <Text
                variant="bodyLarge"
                tone={selected ? "brand" : "primary"}
                style={styles.flex}
              >
                {option}
              </Text>
              {selected ? (
                <Feather name="check" size={18} color={colors.brand} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}

const useStyles = makeStyles((c) => ({
  list: {
    maxHeight: 380,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET + 6,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  pressed: {
    backgroundColor: c.surfaceSecondary,
  },
  flex: {
    flex: 1,
  },
}));
