import { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@/components/text";
import { makeStyles, MIN_TOUCH_TARGET, spacing, useColors } from "@/theme";

export type ListRowProps = {
  label: string;
  value?: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  /** Renders the label in the error tone for destructive settings entries. */
  destructive?: boolean;
  /** Replaces the chevron, for switches or custom trailing content. */
  trailing?: ReactNode;
  last?: boolean;
};

/**
 * Settings and menu rows. Grouped inside a Card, separated by hairlines
 * rather than each row being its own floating card.
 */
export function ListRow({
  label,
  value,
  icon,
  onPress,
  destructive,
  trailing,
  last,
}: ListRowProps) {
  const styles = useStyles();
  const colors = useColors();

  /**
   * A long value cannot share a line with the label at 375pt — both end up
   * ellipsised and neither is readable. Past roughly twenty characters the
   * value moves under the label instead, which is what platform settings
   * screens do with the same problem.
   */
  const stacked = !!value && value.length > 20;

  const body = (
    <View style={[styles.row, !last && styles.divider]}>
      {icon ? (
        <Feather
          name={icon}
          size={18}
          color={destructive ? colors.error : colors.textSecondary}
        />
      ) : null}

      <View style={styles.flex}>
        <Text
          variant="bodyLarge"
          tone={destructive ? "error" : "primary"}
          numberOfLines={1}
        >
          {label}
        </Text>
        {stacked ? (
          <Text variant="bodySmall" tone="secondary" numberOfLines={2}>
            {value}
          </Text>
        ) : null}
      </View>

      {value && !stacked ? (
        <Text variant="body" tone="secondary" numberOfLines={1}>
          {value}
        </Text>
      ) : null}

      {trailing ??
        (onPress ? (
          <Feather name="chevron-right" size={18} color={colors.textTertiary} />
        ) : null)}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}. ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      {body}
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  row: {
    minHeight: MIN_TOUCH_TARGET + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
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
