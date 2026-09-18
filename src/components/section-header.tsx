import { Pressable, View } from "react-native";
import { Text } from "@/components/text";
import { makeStyles, MIN_TOUCH_TARGET, spacing } from "@/theme";

export type SectionHeaderProps = {
  title: string;
  /** Optional supporting line. Kept to one short sentence. */
  caption?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({
  title,
  caption,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  const styles = useStyles();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text variant="h3" style={styles.flex}>
          {title}
        </Text>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            hitSlop={12}
            style={styles.action}
          >
            <Text variant="button" tone="brand">
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {caption ? (
        <Text variant="body" tone="secondary">
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  wrap: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: spacing.xl,
  },
  action: {
    minHeight: MIN_TOUCH_TARGET - 12,
    justifyContent: "center",
  },
  flex: {
    flex: 1,
  },
}));
