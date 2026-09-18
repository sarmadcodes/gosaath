import { useState } from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Card } from "@/components/card";
import { ChoiceCard } from "@/components/choice-card";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { makeStyles, spacing, useColors } from "@/theme";
import { SCENARIOS, scenarioId, setScenario } from "@/services/scenarios";
import type { ScenarioId } from "@/services/scenarios";

/**
 * Development-only mock scenario switcher.
 *
 * Reaching every empty, partial and error state by hand is slow and easy to
 * skip, which is how "looks fine" screens ship broken for a new account. This
 * makes each state one tap away. It is never linked in a production build.
 */
export default function DevScenarios() {
  const styles = useStyles();
  const colors = useColors();
  const [active, setActive] = useState<ScenarioId>(scenarioId());

  async function choose(id: ScenarioId) {
    setActive(id);
    // Awaited: the switch writes the onboarding flag and session before we
    // navigate, so the launch gate reads the new state rather than the old.
    await setScenario(id);
    // Back to the launch route so the whole app re-resolves against the new
    // scenario, exactly as a cold start would.
    router.replace("/");
  }

  return (
    <>
      <AppBar title="Mock scenarios" />
      <Screen contentStyle={styles.content}>
        <Card tone="inset">
          <View style={styles.noteRow}>
            <Feather name="tool" size={16} color={colors.textSecondary} />
            <Text variant="bodySmall" tone="secondary" style={styles.flex}>
              Development only. Switching rebuilds the mock backend, resets the
              session where the scenario calls for it, and returns you to the
              launch screen.
            </Text>
          </View>
        </Card>

        <View style={styles.list}>
          {SCENARIOS.map((item) => (
            <ChoiceCard
              key={item.id}
              icon={active === item.id ? "check-circle" : "circle"}
              label={item.label}
              caption={item.description}
              selected={active === item.id}
              onPress={() => choose(item.id)}
            />
          ))}
        </View>
      </Screen>
    </>
  );
}

const useStyles = makeStyles(() => ({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.base,
  },
  list: {
    gap: spacing.md,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
}));
