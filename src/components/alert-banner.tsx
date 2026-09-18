import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing, useColors } from "@/theme";
import type { Palette } from "@/theme";

type Tone = "warning" | "error" | "info" | "success";

const tones: Record<
  Tone,
  { bg: keyof Palette; fg: keyof Palette; icon: keyof typeof Feather.glyphMap }
> = {
  warning: { bg: "warningBg", fg: "warning", icon: "alert-triangle" },
  error: { bg: "errorBg", fg: "error", icon: "alert-circle" },
  info: { bg: "infoBg", fg: "info", icon: "info" },
  success: { bg: "successBg", fg: "success", icon: "check-circle" },
};

export type AlertBannerProps = {
  tone?: Tone;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * Used when something in the recurring routine needs attention, such as a
 * driver dropping out. It sits inline in the flow rather than as a toast,
 * because the user may open the app hours after the change happened.
 */
export function AlertBanner({
  tone = "warning",
  title,
  body,
  actionLabel,
  onAction,
}: AlertBannerProps) {
  const styles = useStyles();
  const colors = useColors();
  const spec = tones[tone];
  const fg = colors[spec.fg];

  return (
    <View style={[styles.wrap, { backgroundColor: colors[spec.bg] }]}>
      <Feather name={spec.icon} size={18} color={fg} style={styles.icon} />
      <View style={styles.body}>
        <Text variant="h4" style={{ color: fg }}>
          {title}
        </Text>
        {body ? (
          <Text variant="bodySmall" tone="secondary">
            {body}
          </Text>
        ) : null}
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            hitSlop={8}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Text variant="button" style={{ color: fg }}>
              {actionLabel}
            </Text>
            <Feather name="arrow-right" size={16} color={fg} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  wrap: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.lg,
  },
  icon: {
    marginTop: 1,
  },
  body: {
    flex: 1,
    gap: spacing.xs + 2,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm - 2,
    marginTop: spacing.xs,
    minHeight: 32,
  },
  pressed: {
    opacity: 0.6,
  },
}));
