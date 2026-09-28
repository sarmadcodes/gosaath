import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/input";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import {
  makeStyles,
  MIN_TOUCH_TARGET,
  radius,
  spacing,
  useColors,
  useTheme,
} from "@/theme";
import { InstitutionLogo } from "@/components/institution-logo";
import { useCampuses, useInstitutionSearch } from "@/hooks/data";
import { ErrorState } from "@/components/error-state";
import { SkeletonCard } from "@/components/skeleton";
import { useSignup } from "@/state/signup";
import type { Institution } from "@/data/types";

export default function InstitutionScreen() {
  const { draft, update } = useSignup();
  const { setBrandColor } = useTheme();
  const [query, setQuery] = useState("");
  // The server decides which institutions exist and are open. Shipping that
  // list inside the app meant an institution activated by an admin stayed
  // invisible until the next release.
  const {
    data: institutions = [],
    loading,
    error,
    reload,
  } = useInstitutionSearch(query, draft.institutionType);
  const [chosen, setChosen] = useState<Institution | undefined>();
  const { data: chosenCampuses } = useCampuses(chosen?.id);

  function choose(institution: Institution) {
    // The app takes on the institution's colour from here on, so the rest of
    // registration already looks like the user's own campus.
    setBrandColor(institution.brandColor);

    // Its campuses decide the next screen, and they come from the server too.
    // Setting it here rather than navigating immediately lets the effect below
    // skip a campus screen that would only ever offer one option.
    update({ institutionId: institution.id, campusId: undefined });
    setChosen(institution);
  }

  useEffect(() => {
    if (!chosen || !chosenCampuses) return;
    // Asking someone to pick from a list of one is a tap that teaches nothing.
    // The campus is confirmed on the account summary instead.
    if (chosenCampuses.length === 1) {
      update({ institutionId: chosen.id, campusId: chosenCampuses[0]!.id });
      router.push("/(auth)/register");
    } else {
      router.push("/(auth)/campus");
    }
    setChosen(undefined);
  }, [chosen, chosenCampuses, update]);

  if (loading) {
    return (
      <>
        <AppBar title="Where do you study?" />
        <Screen>
          <SkeletonCard lines={2} />
        </Screen>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AppBar title="Where do you study?" />
        <Screen>
          <ErrorState onRetry={reload} />
        </Screen>
      </>
    );
  }

  // GoSaath launches at one institution. Asking someone to search a list of
  // one is friction that also makes the product look emptier than it is.
  if (institutions.length === 1 && query === "") {
    return <SingleInstitution institution={institutions[0]!} onChoose={choose} />;
  }

  return (
    <InstitutionSearch
      results={institutions}
      query={query}
      onQueryChange={setQuery}
      onChoose={choose}
    />
  );
}

/**
 * The launch experience: one institution, offered directly. Everything else is
 * framed as "not yet" rather than "not found", because that is what it is.
 */
function SingleInstitution({
  institution,
  onChoose,
}: {
  institution: Institution;
  onChoose: (institution: Institution) => void;
}) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <>
      <AppBar title="Where do you study?" />
      <Screen contentStyle={styles.content}>
        <Text variant="body" tone="secondary">
          GoSaath is currently available at {institution.shortName ?? institution.name}.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${institution.shortName ?? institution.name}. Verified institution.`}
          onPress={() => onChoose(institution)}
          style={({ pressed }) => [styles.hero, pressed && styles.pressed]}
        >
          <InstitutionLogo institutionId={institution.id} size={56} />
          <View style={styles.heroCopy}>
            <Text variant="h3" numberOfLines={2}>
              {institution.shortName ?? institution.name}
            </Text>
            <View style={styles.verifiedRow}>
              <Feather name="check-circle" size={13} color={colors.success} />
              <Text variant="bodySmall" tone="success">
                Verified institution
              </Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textTertiary} />
        </Pressable>

        <Card tone="inset">
          <Text variant="h4">Studying somewhere else?</Text>
          <Text variant="bodySmall" tone="secondary" style={styles.spacer}>
            We are onboarding universities one at a time so there are enough
            people on your route to match with. Tell us where you study and we
            will let you know when GoSaath reaches your campus.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(auth)/request-institution")}
            hitSlop={8}
            style={styles.link}
          >
            <Text variant="button" tone="brand">
              Tell us your university
            </Text>
            <Feather name="arrow-right" size={16} color={colors.brand} />
          </Pressable>
        </Card>
      </Screen>
    </>
  );
}

/**
 * The multi-institution experience. Unused at launch, kept because it becomes
 * the right screen the moment a second institution is activated.
 */
function InstitutionSearch({
  results,
  query,
  onQueryChange,
  onChoose,
}: {
  results: Institution[];
  query: string;
  onQueryChange: (next: string) => void;
  onChoose: (institution: Institution) => void;
}) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <>
      <AppBar title="Find your institution" />
      <Screen contentStyle={styles.content}>
        <Input
          label="Search"
          icon="search"
          placeholder="Search universities, colleges or schools"
          value={query}
          onChangeText={onQueryChange}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {results.length === 0 ? (
          <EmptyState
            icon="search"
            title="No match for that name"
            body="Check the spelling, or tell us where you study. We review every request before it appears."
            actionLabel="Tell us your institution"
            onAction={() => router.push("/(auth)/request-institution")}
          />
        ) : (
          <Card padding="none">
            {results.map((institution, index) => (
              <Pressable
                key={institution.id}
                accessibilityRole="button"
                accessibilityLabel={institution.name}
                onPress={() => onChoose(institution)}
                style={({ pressed }) => [
                  styles.row,
                  index !== results.length - 1 && styles.divider,
                  pressed && styles.pressed,
                ]}
              >
                <InstitutionLogo institutionId={institution.id} size={38} />
                <View style={styles.rowCopy}>
                  <Text variant="h4" numberOfLines={1}>
                    {institution.shortName ?? institution.name}
                  </Text>
                  {institution.shortName &&
                  institution.shortName !== institution.name ? (
                    <Text variant="bodySmall" tone="tertiary" numberOfLines={1}>
                      {institution.name}
                    </Text>
                  ) : null}
                </View>
                <Feather
                  name="chevron-right"
                  size={18}
                  color={colors.textTertiary}
                />
              </Pressable>
            ))}
          </Card>
        )}
      </Screen>
    </>
  );
}

const useStyles = makeStyles((c) => ({
  content: {
    gap: spacing.base,
    paddingTop: spacing.base,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: c.brand,
    backgroundColor: c.rideCard,
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm - 2,
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
    opacity: 0.92,
  },
  rowCopy: {
    flex: 1,
    gap: 1,
  },
  spacer: {
    marginTop: spacing.xs,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm - 2,
    marginTop: spacing.md,
    minHeight: 32,
  },
}));
