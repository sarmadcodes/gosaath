import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { ChoiceCard } from "@/components/choice-card";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { makeStyles, spacing } from "@/theme";
import { useSignup } from "@/state/signup";
import type { UserType } from "@/data/types";

/**
 * Employees are a separate launch with different requirements — company
 * verification instead of institutional email, and no campus concept. The
 * option stays visible so people can see where the product is going, but it
 * is not selectable.
 */
const OPTIONS: {
  value: UserType;
  icon: "book-open" | "award" | "briefcase";
  label: string;
  caption: string;
  comingSoon?: boolean;
}[] = [
  {
    value: "student",
    icon: "book-open",
    label: "Student",
    caption: "You study at a university, college or school",
  },
  {
    value: "teacher",
    icon: "award",
    label: "Teacher or faculty",
    caption: "You teach or work at an institution",
  },
  {
    value: "employee",
    icon: "briefcase",
    label: "Employees & companies",
    caption: "Connect with coworkers who share your commute",
    comingSoon: true,
  },
];

export default function UserTypeScreen() {
  const styles = useStyles();
  const { draft, update } = useSignup();

  // Held only long enough to show the selection before the screen changes, so
  // the automatic move forward reads as a response to the tap rather than a
  // navigation that happened on its own.
  const [selected, setSelected] = useState<UserType | undefined>(
    draft.userType,
  );

  function choose(value: UserType) {
    setSelected(value);
    update({ userType: value });
    router.push("/(auth)/institution-type");
  }

  return (
    <>
      <AppBar title="Who are you?" />
      <Screen contentStyle={styles.content}>
        <Text variant="body" tone="secondary">
          This decides which community you are matched within.
        </Text>

        <View style={styles.options}>
          {OPTIONS.map((option) => (
            <ChoiceCard
              key={option.value}
              icon={option.icon}
              label={option.label}
              caption={option.caption}
              selected={selected === option.value}
              disabled={option.comingSoon}
              badge={option.comingSoon ? "Coming soon" : undefined}
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
