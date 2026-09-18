import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { ChoiceCard } from "@/components/choice-card";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { makeStyles, spacing } from "@/theme";
import { useSignup } from "@/state/signup";
import type { InstitutionType } from "@/data/types";

const OPTIONS: {
  value: InstitutionType;
  icon: "book" | "book-open" | "home";
  label: string;
  caption: string;
}[] = [
  {
    value: "university",
    icon: "book",
    label: "University",
    caption: "Degree awarding institution",
  },
  {
    value: "college",
    icon: "book-open",
    label: "College",
    caption: "Intermediate or professional college",
  },
  {
    value: "school",
    icon: "home",
    label: "School",
    caption: "Primary or secondary school",
  },
];

export default function InstitutionTypeScreen() {
  const styles = useStyles();
  const { draft, update } = useSignup();
  const [selected, setSelected] = useState<InstitutionType | undefined>(
    draft.institutionType,
  );

  function choose(value: InstitutionType) {
    setSelected(value);
    update({ institutionType: value });
    router.push("/(auth)/institution");
  }

  return (
    <>
      <AppBar title="Where do you study?" />
      <Screen contentStyle={styles.content}>
        <Text variant="body" tone="secondary">
          We use this to narrow down where to look for you.
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
