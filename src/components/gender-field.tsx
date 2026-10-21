import { View } from "react-native";
import { Segmented } from "@/components/segmented";
import { Text } from "@/components/text";
import type { Gender } from "@/data/types";
import { makeStyles, spacing } from "@/theme";

const OPTIONS: { value: Gender; label: string }[] = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "undisclosed", label: "Not saying" },
];

/**
 * Optional and self-declared. Laid out like an Input so it sits in the same
 * form card, with the reason it is asked for always visible: a question about
 * gender with no stated purpose reads as data collection for its own sake.
 */
export function GenderField({
  value,
  onChange,
}: {
  value: Gender;
  onChange: (value: Gender) => void;
}) {
  const styles = useStyles();

  return (
    <View style={styles.wrap}>
      <Text variant="caption" tone="secondary">
        Gender (optional)
      </Text>
      <Segmented<Gender> options={OPTIONS} value={value} onChange={onChange} />
      <Text variant="bodySmall" tone="tertiary">
        Used only for women-only rides. Other members never see it.
      </Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  wrap: {
    gap: spacing.sm,
  },
}));
