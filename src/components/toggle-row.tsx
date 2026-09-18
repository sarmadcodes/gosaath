import { Pressable, Switch, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@/components/text";
import { makeStyles, MIN_TOUCH_TARGET, radius, spacing, useColors } from "@/theme";

export type ToggleRowProps = {
  label: string;
  caption?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: keyof typeof Feather.glyphMap;
  /** Tints the icon for the women-only preference, which has its own token. */
  accent?: "brand" | "womenOnly";
  last?: boolean;
};

export function ToggleRow({
  label,
  caption,
  value,
  onChange,
  icon,
  accent = "brand",
  last,
}: ToggleRowProps) {
  const styles = useStyles();
  const colors = useColors();

  const accentColour = accent === "womenOnly" ? colors.womenOnly : colors.brand;
  const accentBg =
    accent === "womenOnly" ? colors.womenOnlyBg : colors.brandSecondary;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={caption ? `${label}. ${caption}` : label}
      onPress={() => onChange(!value)}
      style={[styles.row, !last && styles.divider]}
    >
      {icon ? (
        <View
          style={[
            styles.mark,
            { backgroundColor: value ? accentBg : colors.surfaceSecondary },
          ]}
        >
          <Feather
            name={icon}
            size={16}
            color={value ? accentColour : colors.textTertiary}
          />
        </View>
      ) : null}
      <View style={styles.copy}>
        <Text variant="bodyLarge">{label}</Text>
        {caption ? (
          <Text variant="bodySmall" tone="tertiary">
            {caption}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: accentColour, false: colors.border }}
        thumbColor={colors.surface}
      />
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    minHeight: MIN_TOUCH_TARGET + 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  mark: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 1,
  },
}));
