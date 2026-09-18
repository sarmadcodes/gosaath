import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Text } from "@/components/text";
import { makeStyles, spacing, useColors } from "@/theme";

export type SetupCardProps = {
  /** The institution the user registered with, e.g. "SZABIST University". */
  campusName: string;
  onSetUp: () => void;
};

const STEPS = [
  { icon: "calendar" as const, label: "Choose the days you travel" },
  { icon: "clock" as const, label: "Set when you leave and head back" },
  { icon: "users" as const, label: "We find people on your route" },
];

/**
 * What a brand-new account sees where the day's ride would be.
 *
 * It takes the filled brand surface that the Today card normally owns, because
 * for someone with no commute this *is* the most important thing on the
 * screen. Three short steps rather than a paragraph: the goal is for the user
 * to understand the product without reading an explanation.
 */
export function SetupCard({ campusName, onSetUp }: SetupCardProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Card tone="brand" padding="regular">
      <Text variant="label" tone="onBrand" uppercase style={styles.eyebrow}>
        Today's commute
      </Text>

      <Text variant="h2" tone="onBrand" style={styles.title}>
        Set up your commute
      </Text>
      <Text variant="body" tone="onBrand" style={styles.body}>
        Tell us which days you travel to {campusName} and what time you usually
        leave. We use that to find people from your campus with a similar
        schedule.
      </Text>

      <View style={styles.steps}>
        {STEPS.map((step) => (
          <View key={step.label} style={styles.step}>
            <Feather name={step.icon} size={14} color={colors.onBrand} />
            <Text
              variant="bodySmall"
              tone="onBrand"
              style={styles.stepLabel}
              numberOfLines={2}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      <Button
        label="Set up commute"
        onPress={onSetUp}
        variant="secondary"
        block
        style={styles.cta}
      />
    </Card>
  );
}

const useStyles = makeStyles((c) => ({
  eyebrow: {
    opacity: 0.75,
  },
  title: {
    marginTop: spacing.md,
  },
  body: {
    marginTop: spacing.sm,
    opacity: 0.85,
  },
  steps: {
    gap: spacing.sm + 2,
    marginTop: spacing.base,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
  },
  stepLabel: {
    flex: 1,
    opacity: 0.9,
  },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: c.surface,
    borderWidth: 0,
  },
}));
