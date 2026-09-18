import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppBar } from "@/components/app-bar";
import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Text } from "@/components/text";
import { ChoiceCard } from "@/components/choice-card";
import { makeStyles, spacing, useColors, useTheme } from "@/theme";

export default function Appearance() {
  const styles = useStyles();
  const colors = useColors();
  const { mode, scheme, setMode } = useTheme();

  return (
    <>
      <AppBar title="Appearance" />
      <Screen contentStyle={styles.content}>
        <Text variant="body" tone="secondary">
          Matching your phone is the default, so the app follows whatever you
          already use at night.
        </Text>

        <View style={styles.section}>
          <SectionHeader title="Theme" />
          <View style={styles.options}>
            <ChoiceCard
              icon="smartphone"
              label="Match my phone"
              caption={`Currently ${scheme}`}
              selected={mode === "system"}
              onPress={() => setMode("system")}
            />
            <ChoiceCard
              icon="sun"
              label="Light"
              caption="Always light, whatever your phone does"
              selected={mode === "light"}
              onPress={() => setMode("light")}
            />
            <ChoiceCard
              icon="moon"
              label="Dark"
              caption="Always dark, whatever your phone does"
              selected={mode === "dark"}
              onPress={() => setMode("dark")}
            />
          </View>
        </View>

        <Card tone="inset">
          <View style={styles.noteRow}>
            <Feather name="eye" size={16} color={colors.textSecondary} />
            <Text variant="bodySmall" tone="secondary" style={styles.flex}>
              Dark mode keeps the same layout and colour meanings. Nothing moves
              or changes shape, so the app stays familiar either way.
            </Text>
          </View>
        </Card>
      </Screen>
    </>
  );
}

const useStyles = makeStyles(() => ({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.base,
  },
  section: {
    gap: spacing.md,
  },
  options: {
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
