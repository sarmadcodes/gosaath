import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/card";
import { ListRow } from "@/components/list-row";
import { PersonRow } from "@/components/person-row";
import { RouteTimeline } from "@/components/route";
import { Screen } from "@/components/screen";
import { Sheet } from "@/components/sheet";
import { Text } from "@/components/text";
import { makeStyles, MIN_TOUCH_TARGET, radius, spacing, useColors } from "@/theme";
import { areaName } from "@/data/areas";
import { campusById } from "@/data/institutions";
import { useCommute, useCommuteMembers, useMe } from "@/hooks/data";
import { todaysSchedule } from "@/utils/schedule";

export default function ActiveRide() {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [actionsOpen, setActionsOpen] = useState(false);

  const { data: commute } = useCommute();
  const { data: members = [] } = useCommuteMembers(commute?.id);
  const { data: me } = useMe();

  const driver = members.find((m) => m.role === "driver");
  const passengers = members.filter(
    (m) => m.role === "passenger" && m.travellingNext,
  );
  const today = commute ? todaysSchedule(commute.schedule) : undefined;
  const origin = commute ? areaName(commute.originAreaId) : "";
  const campusName = commute
    ? (campusById(commute.campusId)?.name ?? "")
    : "";

  return (
    <>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close ride view"
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.iconButton}
        >
          <Feather name="chevron-down" size={24} color={colors.textPrimary} />
        </Pressable>
        {/* "Today", not "On the way": without live location the app cannot
            know whether anyone has actually set off. */}
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text variant="caption" tone="success">
            Today
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ride options"
          onPress={() => setActionsOpen(true)}
          hitSlop={8}
          style={styles.iconButton}
        >
          <Feather name="more-horizontal" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <Screen contentStyle={styles.content}>
        {/* The scheduled campus time, not a live ETA.
            This product has no live location by design, so a countdown "in
            current traffic" would be a number invented on the client and a
            promise it cannot keep. What is actually known is when everyone
            agreed to be on campus. */}
        <Card padding="regular">
          <Text variant="caption" tone="tertiary" uppercase>
            Due on campus
          </Text>
          <Text variant="display" style={styles.eta}>
            {today?.arriveBy ?? "—"}
          </Text>
          <Text variant="body" tone="secondary">
            {driver
              ? `${driver.user.firstName} is driving today`
              : "Your commute for today"}
          </Text>
        </Card>

        {/* A schematic route rather than a live map. The map layer is an
            implementation concern the hierarchy does not depend on. */}
        <Card padding="regular">
          <RouteTimeline
            stops={[
              {
                label: origin,
                detail: "Your pickup area",
              },
              {
                label: campusName,
                detail: "Drop off at the main gate",
                time: today?.arriveBy,
              },
            ]}
          />
        </Card>

        {driver ? (
          <Card padding="regular">
            <PersonRow
              user={driver.user}
              size="lg"
              role="Driver"
              highlighted
              trailing={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${driver.user.firstName}`}
                  style={styles.callButton}
                >
                  <Feather name="phone" size={18} color={colors.brand} />
                </Pressable>
              }
            />
          </Card>
        ) : null}

        <Card padding="regular">
          <Text variant="h4">Travelling with you</Text>
          <View style={styles.passengers}>
            {passengers.map((member) => (
              <View key={member.user.id} style={styles.passenger}>
                <Avatar
                  name={member.user.firstName}
                  photoUrl={member.user.photoUrl}
                  size="sm"
                />
                <Text variant="bodySmall" numberOfLines={1}>
                  {member.user.id === me?.id
                    ? "You"
                    : member.user.firstName}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </Screen>

      <Sheet
        visible={actionsOpen}
        onClose={() => setActionsOpen(false)}
        title="Ride options"
      >
        {driver?.contactPhone ? (
          <ListRow
            label={`Call ${driver.user.firstName}`}
            icon="phone"
            onPress={() => {
              setActionsOpen(false);
              Linking.openURL(`tel:${driver.contactPhone!.replace(/\s/g, "")}`);
            }}
          />
        ) : null}
        <ListRow
          label="Report a problem"
          icon="flag"
          destructive
          last
          onPress={() => {
            setActionsOpen(false);
            router.push(
              driver
                ? `/safety/report?userId=${driver.user.id}`
                : "/safety/report",
            );
          }}
        />
      </Sheet>
    </>
  );
}

const useStyles = makeStyles((c) => ({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    backgroundColor: c.background,
  },
  iconButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm - 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.full,
    backgroundColor: c.successBg,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: c.success,
  },
  content: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  eta: {
    marginVertical: spacing.xs,
  },
  callButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radius.full,
    backgroundColor: c.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  passengers: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  passenger: {
    alignItems: "center",
    gap: spacing.xs + 2,
    width: 56,
  },
}));
