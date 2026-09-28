import { useState } from "react";
import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { AlertBanner } from "@/components/alert-banner";
import { AppBar } from "@/components/app-bar";
import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { makeStyles, MIN_TOUCH_TARGET, radius, spacing, useColors } from "@/theme";
import { institutionById, NEEDS_REAL_CAMPUS_DATA } from "@/data/institutions";
import { useCampuses } from "@/hooks/data";
import { ErrorState } from "@/components/error-state";
import { SkeletonCard } from "@/components/skeleton";
import { useSignup } from "@/state/signup";

export default function CampusScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { draft, update } = useSignup();

  const institution = draft.institutionId
    ? institutionById(draft.institutionId)
    : undefined;
  // From the server: a campus an admin adds has to appear here without an app
  // release. The local registry is kept for the logo and accent only.
  const {
    data: campuses = [],
    loading,
    error,
    reload,
  } = useCampuses(draft.institutionId);
  const [selected, setSelected] = useState<string | undefined>(draft.campusId);

  function choose(campusId: string) {
    setSelected(campusId);
    update({ campusId });
    router.push("/(auth)/register");
  }

  // Only SZABIST has confirmed campus data. Everything else carries a single
  // placeholder, so the screen says so rather than presenting it as real.
  const placeholderOnly =
    NEEDS_REAL_CAMPUS_DATA &&
    campuses.length === 1 &&
    campuses[0]?.name === "Main Campus";

  if (loading || error) {
    return (
      <>
        <AppBar
          title="Select your campus"
          subtitle={institution?.shortName ?? institution?.name}
        />
        <Screen>{error ? <ErrorState onRetry={reload} /> : <SkeletonCard lines={3} />}</Screen>
      </>
    );
  }

  return (
    <>
      <AppBar
        title="Select your campus"
        subtitle={institution?.shortName ?? institution?.name}
      />
      <Screen contentStyle={styles.content}>
        <Text variant="body" tone="secondary">
          Your campus is the main thing we match on, so pick the one you travel
          to most.
        </Text>

        {placeholderOnly ? (
          <AlertBanner
            tone="info"
            title="Campus list still being added"
            body="We are still loading the full campus list for this institution. Pick Main Campus for now and you can change it in Settings."
          />
        ) : null}

        <Card padding="none">
          {campuses.map((campus, index) => {
            const isSelected = selected === campus.id;
            return (
              <Pressable
                key={campus.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={campus.name}
                onPress={() => choose(campus.id)}
                style={({ pressed }) => [
                  styles.row,
                  index !== campuses.length - 1 && styles.divider,
                  pressed && styles.pressed,
                ]}
              >
                <Text variant="bodyLarge" style={styles.flex}>
                  {campus.name}
                </Text>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected ? (
                    <Feather name="check" size={13} color={colors.onBrand} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </Card>
      </Screen>
    </>
  );
}

const useStyles = makeStyles((c) => ({
  content: {
    gap: spacing.base,
    paddingTop: spacing.base,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    minHeight: MIN_TOUCH_TARGET + 8,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  pressed: {
    backgroundColor: c.surfaceSecondary,
  },
  flex: {
    flex: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    backgroundColor: c.brand,
    borderColor: c.brand,
  },
}));
