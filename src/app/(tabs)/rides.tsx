import { useState } from "react";
import { Alert, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { SectionHeader } from "@/components/section-header";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PersonRow } from "@/components/person-row";
import { Screen } from "@/components/screen";
import { Segmented } from "@/components/segmented";
import { Text } from "@/components/text";
import { formatPkr } from "@/components/contribution";
import { StatusTag } from "@/components/status";
import { RideCardSkeleton, SkeletonBlock } from "@/components/skeleton";
import { makeStyles, radius, spacing, useColors } from "@/theme";
import { areaName } from "@/data/areas";
import { campusById } from "@/data/institutions";
import {
  describeDayTimesCompact,
  describeSchedule,
  sortSchedule,
} from "@/utils/schedule";
import {
  useCommute,
  useCommuteMembers,
  useCommuteWeek,
  useIncomingRequests,
  useSentRequests,
} from "@/hooks/data";
import { api } from "@/services";
import type { SeatRequest } from "@/data/types";
import type { CommuteDay, DaySchedule } from "@/data/types";

type Tab = "upcoming" | "requests" | "past";

export default function RidesRoute() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  // A seat-request notification opens this tab directly on the request list.
  const { tab: initialTab } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(
    initialTab === "requests" || initialTab === "past"
      ? (initialTab as Tab)
      : "upcoming",
  );

  const { data: commute, loading, error, reload } = useCommute();
  const { data: week = [], reload: reloadWeek } = useCommuteWeek(commute?.id);
  const { data: members = [], reload: reloadMembers } = useCommuteMembers(commute?.id);
  // Two directions, kept apart on purpose: what people are asking of you is a
  // to-do list, what you have asked of them is a waiting list.
  const {
    data: incoming = [],
    set: setIncoming,
    reload: reloadIncoming,
  } = useIncomingRequests();
  const { data: sent = [] } = useSentRequests();
  // One answer per request in flight: a second tap while the first is on its
  // way is what produced "already answered".
  const [answering, setAnswering] = useState<string | null>(null);

  async function respond(request: SeatRequest, action: "accept" | "decline") {
    // Removed straight away so the tap feels immediate, then put back if the
    // server refuses. Accepting can genuinely fail — somebody else may have
    // taken the last seat, or the request may already have been answered on
    // another device — and a row that vanishes while nothing happened is
    // worse than a slower one.
    if (answering) return;
    setAnswering(request.id);
    const before = incoming;
    // Accepted stays on the list, marked as such; declined goes away.
    setIncoming(
      action === "accept"
        ? incoming.map((r) => (r.id === request.id ? { ...r, status: "accepted" } : r))
        : incoming.filter((r) => r.id !== request.id),
    );

    try {
      await api.rides.respondToRequest(request.id, action);
      // Seats taken and who is riding changed; show the server's truth.
      reloadWeek();
      reloadMembers();
      reloadIncoming();
    } catch (err) {
      setIncoming(before);
      // Most likely answered elsewhere; either way, re-sync with the server.
      reloadIncoming();
      Alert.alert(
        action === "accept" ? "Could not accept" : "Could not decline",
        err instanceof Error
          ? err.message
          : "Something went wrong. Try again.",
      );
    } finally {
      setAnswering(null);
    }
  }

  if (loading) {
    return (
      <Screen
        contentStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      >
        <Text variant="h1">Rides</Text>
        <SkeletonBlock height={40} style={styles.skeletonSegment} />
        <RideCardSkeleton />
        <RideCardSkeleton />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen
        contentStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      >
        <Text variant="h1">Rides</Text>
        <ErrorState onRetry={reload} />
      </Screen>
    );
  }

  /**
   * No commute means no ride instances to expand, so the tabs would all be
   * empty. Showing the one action that changes that is more use than three
   * empty lists.
   */
  if (!commute) {
    return (
      <Screen
        contentStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      >
        <Text variant="h1">Rides</Text>
        <Text variant="body" tone="secondary">
          Rides are the individual days you travel. Your weekly commute creates
          them.
        </Text>
        <EmptyState
          icon="calendar"
          title="No upcoming rides"
          body="Set up your weekly commute and the days you travel will appear here, ready to share with people going your way."
          actionLabel="Set up commute"
          onAction={() => router.push("/commute/create")}
        />
      </Screen>
    );
  }

  const origin = areaName(commute.originAreaId);
  const campusName = campusById(commute.campusId)?.name ?? "";
  const driver = members.find((m) => m.role === "driver");

  // Upcoming is the recurring commute expanded into this week's days, not a
  // list of one-off bookings. That is the product's whole model.
  const upcoming = week.filter(
    (day) => day.status !== "cancelled" && day.status !== "skipped",
  );
  const past = week.filter((day) => day.status === "confirmed").slice(0, 3);

  return (
    <Screen contentStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}>
      <Text variant="h1">Rides</Text>
      <Text variant="body" tone="secondary">
        The individual days from your weekly commute.
      </Text>

      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: "upcoming", label: "This week" },
          { value: "requests", label: "Requests", badge: incoming.length > 0 },
          { value: "past", label: "Past" },
        ]}
      />

      {tab === "upcoming" ? (
        upcoming.length === 0 ? (
          <EmptyState
            icon="check-circle"
            title="Your commute is ready"
            body="We are looking for people at your campus travelling on the same days. Your rides appear here as they are confirmed."
            actionLabel="View matches"
            onAction={() => router.push("/matches")}
          />
        ) : (
          <View style={styles.list}>
            <Card padding="regular">
              <Text variant="caption" tone="tertiary" uppercase>
                Your commute
              </Text>
              <Text variant="h3" style={styles.routeHeading} numberOfLines={2}>
                {origin} to {campusName}
              </Text>
            </Card>

            {upcoming.map((day) => (
              <DayRideCard
                key={day.day}
                day={day}
                schedule={commute.schedule}
                contribution={commute.contribution}
                driverName={driver?.user.firstName}
              />
            ))}
          </View>
        )
      ) : tab === "requests" ? (
        incoming.length === 0 && sent.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="No requests yet"
            body="Requests people send you for your offered seats appear here, along with any seats you have asked for."
            actionLabel="Find a ride"
            onAction={() => router.push("/ride/find")}
          />
        ) : (
          <View style={styles.list}>
            {/* Incoming leads: these are waiting on the user to act. */}
            {incoming.length > 0 ? (
              <>
                <SectionHeader
                  title="Asked to join your ride"
                  caption="People asking for a seat in your car."
                />
                {incoming.map((request) => (
                  <Card key={request.id} tone="ride" padding="regular">
                    <PersonRow
                      user={request.user}
                      caption={`${request.originArea} · ${request.seats} ${
                        request.seats === 1 ? "seat" : "seats"
                      }`}
                    />
                    <View style={styles.requestMeta}>
                      <Text variant="bodySmall" tone="secondary">
                        {describeSchedule(request.schedule)}
                        {request.contribution
                          ? ` · ${formatPkr(request.contribution)}`
                          : ""}
                      </Text>
                    </View>
                    {request.status === "pending" ? (
                      <View style={styles.requestActions}>
                        <Button
                          label="Decline"
                          variant="tertiary"
                          style={styles.flex}
                          disabled={answering !== null}
                          onPress={() => respond(request, "decline")}
                        />
                        <Button
                          label="Accept"
                          style={styles.flex}
                          loading={answering === request.id}
                          disabled={answering !== null && answering !== request.id}
                          onPress={() => respond(request, "accept")}
                        />
                      </View>
                    ) : (
                      <View style={styles.requestMeta}>
                        <Badge kind="verified" label="Accepted" />
                      </View>
                    )}
                  </Card>
                ))}
              </>
            ) : null}

            {sent.length > 0 ? (
              <>
                <SectionHeader
                  title="Your requests"
                  caption="Seats you have asked for."
                />
                {sent.map((request) => (
                  <Card key={request.id} padding="regular">
                    <PersonRow
                      user={request.user}
                      caption={request.destinationCampus}
                      trailing={
                        request.status === "accepted" ? (
                          <Badge kind="verified" label="Accepted" />
                        ) : request.status === "declined" ? (
                          <Badge kind="pending" label="Declined" />
                        ) : (
                          <Badge kind="pending" label="Waiting" />
                        )
                      }
                    />
                    <View style={styles.requestMeta}>
                      <Text variant="bodySmall" tone="secondary">
                        {request.status === "accepted"
                          ? "Confirmed. You are riding with them."
                          : request.status === "declined"
                            ? "They could not take you this time."
                            : "You asked for a seat. Nothing is confirmed until they accept."}
                      </Text>
                    </View>
                  </Card>
                ))}
              </>
            ) : null}
          </View>
        )
      ) : past.length === 0 ? (
        <EmptyState
          icon="clock"
          title="No past rides yet"
          body="Rides you have already taken will be listed here."
        />
      ) : (
        <View style={styles.list}>
          {past.map((day) => (
            <DayRideCard
              key={`past-${day.day}`}
              day={{ ...day, status: "confirmed" }}
              schedule={commute.schedule}
              contribution={commute.contribution}
              driverName={driver?.user.firstName}
              past
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function DayRideCard({
  day,
  schedule,
  contribution,
  driverName,
  past,
}: {
  day: CommuteDay;
  schedule: DaySchedule[];
  /** Absent when nothing has been agreed yet — then no figure is shown. */
  contribution?: number;
  driverName?: string;
  past?: boolean;
}) {
  const styles = useStyles();
  const colors = useColors();

  const entry = sortSchedule(schedule).find((s) => s.day === day.day);
  const needsAction = day.status === "noDriver";

  return (
    <Card
      tone={needsAction ? "default" : "ride"}
      padding="regular"
      onPress={
        needsAction ? () => router.push("/driver/replacement") : undefined
      }
    >
      {/* The route is identical on every row of your own commute, so it sits
          in the header above rather than truncating on each card. */}
      <View style={styles.dayHeader}>
        <View style={styles.dayBadge}>
          <Text variant="caption" tone="brand">
            {day.day}
          </Text>
          <Text variant="h4">{day.date.split(" ")[0]}</Text>
        </View>
        <View style={styles.flex}>
          <Text variant="h4" numberOfLines={1}>
            {entry ? describeDayTimesCompact(entry) : "Not travelling"}
          </Text>
        </View>
      </View>

      {/* Status sits in the footer rather than beside the times. On a 375pt
          screen it otherwise squeezes a late start like "10:00 AM to 6:00 PM"
          into an ellipsis. */}
      <View style={styles.dayFooter}>
        {!past ? <StatusTag status={day.status} /> : null}
        <View style={styles.footerItem}>
          <Feather name="user" size={13} color={colors.textTertiary} />
          <Text variant="bodySmall" tone="secondary" numberOfLines={1}>
            {needsAction ? "No driver" : driverName}
          </Text>
        </View>
        {contribution ? (
          <Text variant="bodySmall" tone="secondary" style={styles.price}>
            {formatPkr(contribution)}
          </Text>
        ) : null}
      </View>

      {needsAction ? (
        <View style={styles.actionRow}>
          <Text variant="button" tone="brand">
            Find cover
          </Text>
          <Feather name="arrow-right" size={16} color={colors.brand} />
        </View>
      ) : null}
    </Card>
  );
}

const useStyles = makeStyles((c) => ({
  content: {
    gap: spacing.lg,
  },
  skeletonSegment: {
    borderRadius: radius.md,
  },
  list: {
    gap: spacing.md,
  },
  routeHeading: {
    marginTop: spacing.xs,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dayBadge: {
    width: 46,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: c.surface,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  dayFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: c.rideCardBorder,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 1,
  },
  price: {
    marginLeft: "auto",
  },
  requestActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  requestMeta: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: c.rideCardBorder,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm - 2,
    marginTop: spacing.md,
  },
}));
