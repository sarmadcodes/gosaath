import { useCallback, useState } from "react";
import { Image, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing, useColors } from "@/theme";
import { api } from "@/services";
import type { Vehicle, VehicleType } from "@/data/types";

export default function Vehicles() {
  const styles = useStyles();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Refetch on focus so returning from the edit screen shows the new vehicle
  // without a manual refresh.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      api.vehicles.list().then((list) => {
        if (cancelled) return;
        setVehicles(list);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const car = vehicles.find((v) => v.type === "car");
  const bike = vehicles.find((v) => v.type === "bike");

  return (
    <>
      <AppBar title="My vehicles" />
      <Screen contentStyle={styles.content}>
        {!loading && vehicles.length === 0 ? (
          <EmptyState
            icon="truck"
            title="No vehicles yet"
            body="Add your car or bike so you can offer seats. You only need one photo showing the front and the number plate."
            actionLabel="Add a car"
            onAction={() => router.push("/vehicles/edit?type=car")}
            secondaryLabel="Add a bike"
            onSecondary={() => router.push("/vehicles/edit?type=bike")}
          />
        ) : (
          <>
            <Text variant="body" tone="secondary">
              Only shown to people you share a ride with, and only after a seat
              is confirmed.
            </Text>

            <VehicleSlot type="car" vehicle={car} />
            <VehicleSlot type="bike" vehicle={bike} />
          </>
        )}
      </Screen>
    </>
  );
}

function VehicleSlot({
  type,
  vehicle,
}: {
  type: VehicleType;
  vehicle?: Vehicle;
}) {
  const styles = useStyles();
  const colors = useColors();
  const label = type === "car" ? "Car" : "Bike";

  return (
    <View style={styles.section}>
      <SectionHeader title={label} />
      {vehicle ? (
        <Card
          padding="none"
          onPress={() => router.push(`/vehicles/edit?type=${type}`)}
        >
          {vehicle.imageUrl ? (
            <Image
              source={{ uri: vehicle.imageUrl }}
              style={styles.photo}
              accessibilityIgnoresInvertColors
              accessibilityLabel={`${vehicle.model} photo`}
            />
          ) : null}
          <View style={styles.body}>
            <View style={styles.flex}>
              <Text variant="h4" numberOfLines={1}>
                {vehicle.model}
              </Text>
              <Text variant="bodySmall" tone="secondary">
                {vehicle.colour} · {vehicle.plate}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </View>
        </Card>
      ) : (
        <Card padding="regular">
          <Text variant="bodySmall" tone="secondary">
            No {label.toLowerCase()} added yet.
          </Text>
          <Button
            label={`Add a ${label.toLowerCase()}`}
            variant="secondary"
            size="compact"
            style={styles.addButton}
            onPress={() => router.push(`/vehicles/edit?type=${type}`)}
          />
        </Card>
      )}
    </View>
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
  photo: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.base,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  addButton: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
  },
}));
