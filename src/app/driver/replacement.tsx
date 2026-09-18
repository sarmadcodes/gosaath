import { View } from "react-native";
import { router } from "expo-router";
import { AlertBanner } from "@/components/alert-banner";
import { AppBar } from "@/components/app-bar";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { RideCard } from "@/components/ride-card";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Text } from "@/components/text";
import { RideCardSkeleton, SkeletonText } from "@/components/skeleton";
import { makeStyles, spacing } from "@/theme";
import { useCommute, useCommuteWeek, useReplacements } from "@/hooks/data";

export default function Replacement() {
  const styles = useStyles();
  const { data: commute } = useCommute();
  const { data: week = [] } = useCommuteWeek(commute?.id);

  // Cover is looked up for the specific uncovered day, not the week as a
  // whole: who is driving on Tuesday says nothing about Thursday.
  const day = week.find((d) => d.status === "noDriver");
  const { data: options = [], loading } = useReplacements(commute?.id, day?.day);

  if (loading) {
    return (
      <>
        <AppBar title="Find cover" />
        <Screen contentStyle={styles.content}>
          <SkeletonText lines={2} />
          <RideCardSkeleton />
          <RideCardSkeleton />
        </Screen>
      </>
    );
  }

  return (
    <>
      <AppBar
        title="Find cover"
        subtitle={day ? `${day.day} ${day.date}` : undefined}
      />
      <Screen contentStyle={styles.content}>
        {/* Framed as solved rather than broken. The user arrives here because
            something went wrong, so the screen leads with the answer. */}
        <AlertBanner
          tone="info"
          title="Your usual driver is unavailable"
          body={`Your seat is held for every other day. Here is who else from your campus is going on ${day ? day.date : "that day"}.`}
        />

        {options.length === 0 ? (
          <EmptyState
            icon="users"
            title="Nobody from your campus yet"
            body="No one is covering this route at that time. We will notify you as soon as someone is."
            actionLabel="Skip this day"
            onAction={() => router.back()}
            secondaryLabel="Search all rides"
            onSecondary={() => router.push("/ride/find")}
          />
        ) : (
          <>
            <View style={styles.section}>
              <SectionHeader
                title={`${options.length} going your way`}
                caption="From your campus, on a similar route."
              />
              <View style={styles.list}>
                {options.map((ride) => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                    onPress={() => router.push(`/ride/${ride.id}`)}
                  />
                ))}
              </View>
            </View>

            <Card tone="inset">
              <Text variant="h4">None of these work?</Text>
              <Text variant="bodySmall" tone="secondary" style={styles.spacer}>
                You can skip this day entirely. Your recurring seat stays booked
                for the rest of the week.
              </Text>
              <Text
                variant="button"
                tone="brand"
                style={styles.link}
                onPress={() => router.back()}
              >
                Skip this day
              </Text>
            </Card>
          </>
        )}
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
  list: {
    gap: spacing.md,
  },
  spacer: {
    marginTop: spacing.xs,
  },
  link: {
    marginTop: spacing.md,
  },
}));
