import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Card } from "@/components/card";
import { ChoiceCard } from "@/components/choice-card";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { makeStyles, spacing } from "@/theme";
import { useSignup } from "@/state/signup";
import type { CommuteIntent } from "@/data/types";

const OPTIONS: {
  value: CommuteIntent;
  icon: "search" | "plus-circle" | "repeat";
  label: string;
  caption: string;
}[] = [
  {
    value: "find",
    icon: "search",
    label: "Find a ride",
    caption: "I want a seat to and from my campus",
  },
  {
    value: "offer",
    icon: "plus-circle",
    label: "Offer seats",
    caption: "I have a car or bike with space to share",
  },
  {
    value: "both",
    icon: "repeat",
    label: "Both",
    caption: "I drive some days and ride on others",
  },
];

export default function Intent() {
  const styles = useStyles();
  const { draft, update } = useSignup();
  const [selected, setSelected] = useState<CommuteIntent | undefined>(
    draft.intent,
  );

  function choose(value: CommuteIntent) {
    setSelected(value);
    update({ intent: value });
    router.push("/(auth)/commute-setup");
  }

  return (
    <>
      <AppBar title="What are you looking for?" showBack={false} />
      <Screen contentStyle={styles.content}>
        <Text variant="body" tone="secondary">
          You can change this whenever you like. Picking one now does not lock
          you into it.
        </Text>

        <View style={styles.options}>
          {OPTIONS.map((option) => (
            <ChoiceCard
              key={option.value}
              icon={option.icon}
              label={option.label}
              caption={option.caption}
              selected={selected === option.value}
              onPress={() => choose(option.value)}
            />
          ))}
        </View>

        {/* Being a driver is not an identity in this product, it is just what
            you happen to be doing on a given day. */}
        <Card tone="inset">
          <Text variant="bodySmall" tone="secondary">
            Offering seats does not make you a driver account. The same profile
            finds rides and shares seats, whichever you need that week.
          </Text>
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
  options: {
    gap: spacing.md,
  },
}));
