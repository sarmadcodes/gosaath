import { useEffect, useState } from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PersonRow } from "@/components/person-row";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { formatPkr } from "@/components/contribution";
import { ProximityIndicator } from "@/components/location";
import { describeDays, describeSchedule } from "@/utils/schedule";
import { makeStyles, spacing, useColors } from "@/theme";
import { RideCardSkeleton } from "@/components/skeleton";
import { communityLabel } from "@/data/institutions";
import { useMatches, useMatchSummary, useMe } from "@/hooks/data";
import { readAreaMatches, setAreaMatch } from "@/services/area-match";
import type { AreaMatchStatus, CommuteMatch, MatchSummary } from "@/data/types";

export default function Matches() {
  const styles = useStyles();
  const { data: matches = [], loading, error, reload } = useMatches();
  const { data: summary } = useMatchSummary();
  const { data: me } = useMe();
  const [decisions, setDecisions] = useState<Record<string, AreaMatchStatus>>({});

  // Decisions persist, so a rejected area stays rejected across launches
  // instead of being asked about again every time matches reload.
  useEffect(() => {
    let cancelled = false;
    readAreaMatches().then((stored) => {
      if (cancelled) return;
      setDecisions((current) => ({ ...current, ...stored }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const community = me ? communityLabel(me.institutionId, me.campusId) : "";

  // Rejected matches drop out of the list. The decision is remembered so the
  // same pairing is not put in front of the user again.
  const visible = matches.filter(
    (m) => (decisions[m.id] ?? m.areaMatch) !== "rejected",
  );

  function decide(id: string, status: AreaMatchStatus) {
    setDecisions((d) => ({ ...d, [id]: status }));
    setAreaMatch(id, status);
  }

  return (
    <>
      <AppBar title="Commute matches" subtitle={community} />
      <Screen contentStyle={styles.content}>
        {error ? (
          <ErrorState onRetry={reload} />
        ) : loading ? (
          <View style={styles.list}>
            <RideCardSkeleton />
            <RideCardSkeleton />
          </View>
        ) : visible.length === 0 ? (
          <MatchesEmpty summary={summary} />
        ) : (
          <>
            <Text variant="body" tone="secondary">
              These people share your campus and commute around the same time.
              Areas are approximate.
            </Text>

            <View style={styles.list}>
              {visible.map((match) => (
                <MatchRow
                  key={match.id}
                  match={match}
                  status={decisions[match.id] ?? "pending"}
                  onDecide={(status) => decide(match.id, status)}
                  onOpen={() => router.push(`/match/${match.id}`)}
                />
              ))}
            </View>
          </>
        )}
      </Screen>
    </>
  );
}

/**
 * Why the list is empty matters more than the fact that it is. The server
 * distinguishes "you have no commute" from "no overlapping days" from "nobody
 * here yet", and each needs a different next step from the user.
 */
function MatchesEmpty({ summary }: { summary?: MatchSummary }) {
  const campus = summary?.campusName || "your campus";

  if (summary?.state === "noCommute") {
    return (
      <EmptyState
        icon="repeat"
        title="Set up your commute first"
        body={`Tell us your travel days and times so we can find compatible people at ${campus}.`}
        actionLabel="Set up commute"
        onAction={() => router.push("/commute/create")}
      />
    );
  }

  if (summary?.state === "noDayMatch") {
    return (
      <EmptyState
        icon="calendar"
        title="Nobody on your days yet"
        body={`We found people travelling at ${campus}, but their commute days do not overlap with yours.`}
        actionLabel="Manage commute"
        onAction={() => router.push("/(tabs)/commute")}
      />
    );
  }

  if (summary?.state === "noTimeMatch") {
    return (
      <EmptyState
        icon="clock"
        title="Same days, different times"
        body="Your commute days overlap with other people, but the travel times are different."
        actionLabel="Manage commute"
        onAction={() => router.push("/(tabs)/commute")}
      />
    );
  }

  return (
    <EmptyState
      icon="users"
      title="You're early here"
      body={`There are not any compatible commuters yet. As more ${campus} students and faculty join, we keep looking for matches.`}
      actionLabel="Manage commute"
      onAction={() => router.push("/(tabs)/commute")}
    />
  );
}

function MatchRow({
  match,
  status,
  onDecide,
  onOpen,
}: {
  match: CommuteMatch;
  status: AreaMatchStatus;
  onDecide: (status: AreaMatchStatus) => void;
  onOpen: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const offering = match.intent === "offer" || match.intent === "both";

  const totalDays = match.schedule.length;
  const matched = match.matchingDays.length;
  const matchedLabel =
    matched === totalDays
      ? `Every day matches · ${describeDays(match.matchingDays)}`
      : `${matched} of ${totalDays} days match · ${describeDays(match.matchingDays)}`;

  return (
    <Card
      tone="ride"
      padding="regular"
      onPress={status === "pending" ? undefined : onOpen}
    >
      <PersonRow
        user={match.user}
        caption={offering ? "Offering seats" : "Looking for a ride"}
      />

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Feather name="map-pin" size={14} color={colors.textTertiary} />
          <Text variant="bodySmall" tone="secondary" style={styles.flex}>
            Travels from {match.area}
          </Text>
        </View>
        {/* Approximate, and phrased that way. Rendered only when the location
            service supplied it. */}
        {match.proximity ? (
          <View style={styles.detailRow}>
            <ProximityIndicator estimate={match.proximity} />
          </View>
        ) : null}
        {/* Times differ per day, so what matters is which days actually line
            up, not a single headline time. A partial match is a normal and
            useful outcome here. */}
        <View style={styles.detailRow}>
          <Feather name="calendar" size={14} color={colors.textTertiary} />
          <Text variant="bodySmall" tone="secondary" style={styles.flex}>
            {matchedLabel}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="clock" size={14} color={colors.textTertiary} />
          <Text variant="bodySmall" tone="secondary" style={styles.flex}>
            {describeSchedule(match.schedule)}
          </Text>
        </View>
        {offering && match.contribution ? (
          <View style={styles.detailRow}>
            <Feather name="users" size={14} color={colors.textTertiary} />
            <Text variant="bodySmall" tone="secondary" style={styles.flex}>
              {/* "joined", never "agreed": an accepted request is not proof
                  the two of them settled anything between themselves. */}
              {match.seatsTaken
                ? `${match.seatsTaken} joined · `
                : ""}
              {match.seatsAvailable}{" "}
              {match.seatsAvailable === 1 ? "seat" : "seats"} left ·{" "}
              {formatPkr(match.contribution)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Matching times does not mean the areas work. The user confirms the
          location themselves before this is treated as a usable match. */}
      {status === "pending" ? (
        <View style={styles.confirm}>
          <Text variant="h4">Does this area work for you?</Text>
          <Text variant="bodySmall" tone="secondary" style={styles.spacer}>
            {match.area} is on their route. Only you can judge whether that is
            a sensible pickup.
          </Text>
          <View style={styles.actions}>
            <Button
              label="Not for me"
              variant="tertiary"
              style={styles.flex}
              onPress={() => onDecide("rejected")}
            />
            <Button
              label="Works for me"
              style={styles.flex}
              onPress={() => onDecide("accepted")}
            />
          </View>
        </View>
      ) : (
        <View style={styles.accepted}>
          <Feather name="check-circle" size={15} color={colors.success} />
          <Text variant="bodySmall" tone="success" style={styles.flex}>
            Area confirmed. Tap to see how your weeks line up.
          </Text>
          <Feather
            name="chevron-right"
            size={18}
            color={colors.textTertiary}
          />
        </View>
      )}
    </Card>
  );
}

const useStyles = makeStyles((c) => ({
  content: {
    gap: spacing.base,
    paddingTop: spacing.base,
  },
  list: {
    gap: spacing.md,
  },
  details: {
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  confirm: {
    marginTop: spacing.base,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: c.rideCardBorder,
  },
  spacer: {
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  accepted: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.base,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: c.rideCardBorder,
  },
  flex: {
    flex: 1,
  },
}));
