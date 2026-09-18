import { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { AlertBanner } from "@/components/alert-banner";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { ListRow } from "@/components/list-row";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Sheet } from "@/components/sheet";
import { SkeletonBlock, SkeletonCard, SkeletonRows } from "@/components/skeleton";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing, useColors } from "@/theme";
import { areaName } from "@/data/areas";
import { campusById, communityLabel, institutionById } from "@/data/institutions";
import { api } from "@/services";
import {
  useCommute,
  useCommuteMembers,
  useCommuteWeek,
  useMe,
} from "@/hooks/data";
import { describeSchedule } from "@/utils/schedule";
import { WeekStrip } from "@/screens/commute/week-strip";
import type { CommuteDay } from "@/data/types";

export function MyCommute() {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: me } = useMe();
  const { data: commute, loading, error, reload } = useCommute();
  const { data: week = [], set: setWeek } = useCommuteWeek(commute?.id);
  const { data: members = [] } = useCommuteMembers(commute?.id);

  const [selectedDay, setSelectedDay] = useState<CommuteDay | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const needsDriver = week.find((d) => d.status === "noDriver");
  const origin = commute ? areaName(commute.originAreaId) : "";
  const campusName = commute ? (campusById(commute.campusId)?.name ?? "") : "";
  const driver = members.find((m) => m.role === "driver");

  async function skipDay(day: CommuteDay) {
    if (!commute) return;
    setSelectedDay(null);
    // Optimistic: the row updates immediately, then settles on the response.
    setWeek(week.map((d) => (d.day === day.day ? { ...d, status: "skipped" } : d)));
    const next = await api.commuteWeek.skipDay(commute.id, day.day);
    setWeek(next);
  }

  async function cancelCommute() {
    if (!commute) return;
    await api.commutes.cancel(commute.id);
    setConfirmCancel(false);
    router.replace("/(tabs)");
  }

  if (loading) {
    return (
      <Screen contentStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <SkeletonBlock width="55%" height={26} />
        <SkeletonCard lines={2} />
        <SkeletonRows rows={5} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen contentStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <Text variant="h1">Your commute</Text>
        <ErrorState onRetry={reload} />
      </Screen>
    );
  }

  if (!commute) {
    const institution = me
      ? (institutionById(me.institutionId)?.shortName ?? "your campus")
      : "your campus";

    return (
      <Screen contentStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.titleBlock}>
          <Text variant="h1">Your commute</Text>
          <Text variant="body" tone="secondary">
            Tell us about your weekly routine. Set it up once and we keep it
            running.
          </Text>
        </View>

        {/* Explaining the three questions up front means the setup flow is
            never a surprise, and it is short enough not to need reading. */}
        <Card padding="regular">
          <Text variant="h4">What we will ask</Text>
          <View style={styles.explainer}>
            {[
              {
                icon: "calendar" as const,
                title: "Which days you travel",
                body: `The days you normally go to ${institution}.`,
              },
              {
                icon: "clock" as const,
                title: "When you leave and return",
                body: "Times can be different on different days.",
              },
              {
                icon: "map-pin" as const,
                title: "Where you start from",
                body: "Your general area, never your address.",
              },
            ].map((step) => (
              <View key={step.title} style={styles.explainerRow}>
                <View style={styles.explainerMark}>
                  <Feather name={step.icon} size={15} color={colors.brand} />
                </View>
                <View style={styles.flex}>
                  <Text variant="h4">{step.title}</Text>
                  <Text variant="bodySmall" tone="secondary">
                    {step.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          <Button
            label="Set up commute"
            block
            style={styles.explainerCta}
            onPress={() => router.push("/commute/create")}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <>
      <Screen contentStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.titleBlock}>
          <Text variant="h1">Your commute</Text>
          <Text variant="body" tone="secondary">
            Set up once. We keep it running.
          </Text>
        </View>

        <Card padding="regular">
          <Text variant="h2" numberOfLines={2}>
            {origin} to {campusName}
          </Text>
          <View style={styles.metaList}>
            <View style={styles.metaRow}>
              <Feather name="repeat" size={15} color={colors.textTertiary} />
              <Text variant="body" tone="secondary" style={styles.flex}>
                {describeSchedule(commute.schedule)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Feather name="award" size={15} color={colors.textTertiary} />
              <Text variant="body" tone="secondary" numberOfLines={1}>
                {communityLabel(commute.institutionId, commute.campusId)}
              </Text>
            </View>
          </View>
        </Card>

        {needsDriver ? (
          <AlertBanner
            title={`${needsDriver.day} needs a driver`}
            body="Your usual driver is unavailable. People from your campus travel a similar route."
            actionLabel="See who is going"
            onAction={() => router.push("/driver/replacement")}
          />
        ) : null}

        <View style={styles.section}>
          <SectionHeader
            title="This week"
            caption="Tap a day to skip it or change your seat."
          />
          <WeekStrip week={week} onSelectDay={setSelectedDay} />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Your group"
            actionLabel="View all"
            onAction={() => router.push("/commute/group")}
          />
          <Card onPress={() => router.push("/commute/group")}>
            <View style={styles.faces}>
              {members.slice(0, 4).map((member) => (
                <Avatar
                  key={member.user.id}
                  name={member.user.firstName}
                  photoUrl={member.user.photoUrl}
                  size="sm"
                  highlighted={member.role === "driver"}
                />
              ))}
              <View style={styles.facesCopy}>
                <Text variant="h4">{members.length} people</Text>
                <Text variant="bodySmall" tone="secondary">
                  {driver
                    ? `${driver.user.firstName} drives this route`
                    : "No driver yet"}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Manage" />
          <Card padding="none">
            <ListRow
              label="Change schedule"
              icon="calendar"
              onPress={() => router.push("/commute/create")}
            />
            <ListRow
              label="Find cover for a day"
              icon="user-plus"
              onPress={() => router.push("/driver/replacement")}
            />
            <ListRow
              label="Offer to drive this week"
              icon="plus-circle"
              onPress={() => router.push("/driver/offer")}
            />
            <ListRow
              label="Days I cannot drive"
              icon="calendar"
              onPress={() => router.push("/driver/unavailable")}
            />
            <ListRow
              label="Cancel commute"
              icon="x-circle"
              destructive
              last
              onPress={() => setConfirmCancel(true)}
            />
          </Card>
        </View>
      </Screen>

      <Sheet
        visible={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? `${selectedDay.day} ${selectedDay.date}` : undefined}
      >
        <ListRow
          label="Skip this day"
          icon="minus-circle"
          onPress={() => selectedDay && skipDay(selectedDay)}
        />
        <ListRow
          label="Find another ride for this day"
          icon="search"
          last
          onPress={() => {
            setSelectedDay(null);
            router.push("/ride/find");
          }}
        />
      </Sheet>

      <Sheet
        visible={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel your commute?"
        caption="Your group is told you have left and you stop being matched. You can set a new one up at any time."
      >
        <View style={styles.sheetActions}>
          <ListRow
            label="Cancel my commute"
            icon="x-circle"
            destructive
            onPress={cancelCommute}
          />
          <ListRow
            label="Keep it"
            icon="check"
            last
            onPress={() => setConfirmCancel(false)}
          />
        </View>
      </Sheet>
    </>
  );
}

const useStyles = makeStyles((c) => ({
  content: {
    gap: spacing.lg,
  },
  titleBlock: {
    gap: 2,
  },
  metaList: {
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
  },
  section: {
    gap: spacing.md,
  },
  faces: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  facesCopy: {
    flex: 1,
    marginLeft: spacing.sm,
    gap: 1,
  },
  flex: {
    flex: 1,
  },
  explainer: {
    gap: spacing.base,
    marginTop: spacing.base,
  },
  explainerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  explainerMark: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: c.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  explainerCta: {
    marginTop: spacing.lg,
  },
  skeletonCard: {
    borderRadius: radius.lg,
  },
  sheetActions: {
    paddingBottom: spacing.sm,
  },
}));
