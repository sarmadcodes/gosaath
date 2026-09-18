import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/button";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing, useColors } from "@/theme";

export type ErrorStateProps = {
  /** Defaults to a connection message, which is the common case. */
  title?: string;
  body?: string;
  onRetry?: () => void;
};

/**
 * Shown when a request failed, and deliberately distinct from an empty state.
 *
 * Collapsing the two is a real hazard here: an empty commute means "set one
 * up", while a failed commute fetch means "we could not check". Rendering the
 * empty state on failure would tell somebody who already has a commute to
 * create a second one.
 */
export function ErrorState({
  title = "We could not load this",
  body = "Check your connection and try again. Nothing has been lost.",
  onRetry,
}: ErrorStateProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View style={styles.wrap}>
      <View style={styles.mark}>
        <Feather name="cloud-off" size={22} color={colors.textSecondary} />
      </View>
      <Text variant="h3" style={styles.centred}>
        {title}
      </Text>
      <Text variant="body" tone="secondary" style={styles.centred}>
        {body}
      </Text>
      {onRetry ? (
        <Button
          label="Try again"
          variant="secondary"
          style={styles.action}
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: c.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  centred: {
    textAlign: "center",
  },
  action: {
    marginTop: spacing.base,
  },
}));
