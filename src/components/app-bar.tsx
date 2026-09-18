import { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text } from "@/components/text";
import { makeStyles, MIN_TOUCH_TARGET, spacing, useColors } from "@/theme";

export type AppBarProps = {
  title?: string;
  /** Shown under the title for context, such as the route being edited. */
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  trailing?: ReactNode;
  /** Removes the hairline for screens that scroll content directly beneath. */
  borderless?: boolean;
};

export function AppBar({
  title,
  subtitle,
  onBack,
  showBack = true,
  trailing,
  borderless,
}: AppBarProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { paddingTop: insets.top + spacing.sm },
        !borderless && styles.bordered,
      ]}
    >
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack ?? (() => router.back())}
          hitSlop={8}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
      ) : null}

      <View style={styles.titles}>
        {title ? (
          <Text variant="h4" numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="bodySmall" tone="tertiary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing ?? <View style={styles.back} />}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    backgroundColor: c.background,
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  back: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  titles: {
    flex: 1,
    gap: 1,
  },
}));
