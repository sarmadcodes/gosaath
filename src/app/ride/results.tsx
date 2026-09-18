import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { EmptyState } from "@/components/empty-state";
import { RideCard } from "@/components/ride-card";
import { Screen } from "@/components/screen";
import { RideCardSkeleton } from "@/components/skeleton";
import { Text } from "@/components/text";
import { makeStyles, spacing } from "@/theme";
import { communityLabel } from "@/data/institutions";
import { useMe, useRideSearch } from "@/hooks/data";
import type { VehicleType, Weekday } from "@/data/types";

export default function Results() {
  const styles = useStyles();
  const params = useLocalSearchParams<{
    day?: string;
    womenOnly?: string;
    carsOnly?: string;
  }>();

  const { data: me } = useMe();

  const { data: rides = [], loading, error, reload } = useRideSearch({
    day: params.day as Weekday | undefined,
    womenOnly: params.womenOnly === "1" ? true : undefined,
    vehicleType: params.carsOnly === "1" ? ("car" as VehicleType) : undefined,
  });

  const community = me ? communityLabel(me.institutionId, me.campusId) : "";

  return (
    <>
      <AppBar title="Rides going your way" subtitle={community} />
      <Screen contentStyle={styles.content}>
        {error ? (
          // A failed request is not an empty result. Saying "no rides" here
          // would be a lie the user would act on.
          <EmptyState
            icon="wifi-off"
            tone="error"
            title="We could not load rides"
            body="Check your connection and try again."
            actionLabel="Try again"
            onAction={reload}
          />
        ) : loading ? (
          <>
            <Text variant="body" tone="secondary">
              Looking for people from your campus
            </Text>
            <View style={styles.list}>
              <RideCardSkeleton />
              <RideCardSkeleton />
            </View>
          </>
        ) : rides.length === 0 ? (
          <EmptyState
            icon="search"
            title="No rides yet"
            body="Nobody from your campus is travelling at that time. Set up a commute and we will match you as people join."
            actionLabel="Set up my commute"
            onAction={() => router.push("/commute/create")}
            secondaryLabel="Change search"
            onSecondary={() => router.back()}
          />
        ) : (
          <>
            <Text variant="body" tone="secondary">
              {rides.length} from your campus
            </Text>
            <View style={styles.list}>
              {rides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  onPress={() => router.push(`/ride/${ride.id}`)}
                />
              ))}
            </View>
          </>
        )}
      </Screen>
    </>
  );
}

const useStyles = makeStyles(() => ({
  content: {
    gap: spacing.base,
    paddingTop: spacing.base,
  },
  list: {
    gap: spacing.md,
  },
}));
