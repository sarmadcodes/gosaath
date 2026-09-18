import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/button";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing, useColors } from "@/theme";

export type EmptyStateProps = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** error tints the mark for failure states such as a lost connection. */
  tone?: "neutral" | "error";
};

/**
 * Empty and error states carry the same weight as the populated screen. Each
 * one names what happened and offers the next step, so the user is never left
 * on a dead end.
 */
export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  tone = "neutral",
}: EmptyStateProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.mark,
          {
            backgroundColor:
              tone === "error" ? colors.errorBg : colors.surfaceSecondary,
          },
        ]}
      >
        <Feather
          name={icon}
          size={24}
          color={tone === "error" ? colors.error : colors.textSecondary}
        />
      </View>
      <View style={styles.copy}>
        <Text variant="h3" style={styles.centred}>
          {title}
        </Text>
        <Text variant="body" tone="secondary" style={styles.centred}>
          {body}
        </Text>
      </View>
      {actionLabel && onAction ? (
        <View style={styles.actions}>
          <Button label={actionLabel} onPress={onAction} />
          {secondaryLabel && onSecondary ? (
            <Button
              label={secondaryLabel}
              onPress={onSecondary}
              variant="tertiary"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  wrap: {
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing["3xl"],
    paddingHorizontal: spacing.lg,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    gap: spacing.sm,
    maxWidth: 300,
  },
  centred: {
    textAlign: "center",
  },
  actions: {
    alignItems: "center",
    gap: spacing.xs,
  },
}));
