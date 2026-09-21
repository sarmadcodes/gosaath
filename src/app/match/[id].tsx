import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { PersonRow } from "@/components/person-row";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { SkeletonBlock, SkeletonCard } from "@/components/skeleton";
import { Text } from "@/components/text";
import { formatPkr } from "@/components/contribution";
import { ProximityIndicator, RoutePreviewCard } from "@/components/location";
import { ContactActions } from "@/components/contact-actions";
import { makeStyles, radius, spacing, useColors } from "@/theme";
import { areaName } from "@/data/areas";
import { campusById } from "@/data/institutions";
import { useCommute, useMatches, useMe } from "@/hooks/data";
import { describeDayTimes, describeDays, sortSchedule } from "@/utils/schedule";
import { WEEKDAYS } from "@/data/types";
import type { CommuteMatch, Weekday } from "@/data/types";

/**
 * One match, in full.
 *
 * Everything here comes from `PublicUser` plus the match itself: a first name,
 * a photo, whether they hold the verified badge, and how the two commutes
 * overlap. There is no full name, no contact detail, and nothing resembling a
 * profile — those are not withheld pending some action, they simply do not
 * exist in this product.
 */
export default function MatchDetail() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: matches = [], loading } = useMatches();
  const { data: me } = useMe();

  const match = matches.find((m) => m.id === id);

  if (loading) {
    return (
      <>
        <AppBar title="Match" />
        <Screen contentStyle={styles.content}>
          <SkeletonCard lines={1} />
          <SkeletonBlock height={140} style={styles.skeletonCard} />
          <SkeletonBlock height={190} style={styles.skeletonCard} />
        </Screen>
      </>
    );
  }

  if (!match) {
    return (
      <>
        <AppBar title="Match" />
        <Screen contentStyle={styles.content}>
          <EmptyState
            icon="users"
            title="This match is no longer available"
            body="Their commute may have changed. Your other matches are unaffected."
            actionLabel="Back to matches"
            onAction={() => router.back()}
          />
        </Screen>
      </>
    );
  }

  return (
    <MatchBody
      match={match}
      myArea={me ? areaName(me.areaId) : ""}
      campusName={me ? (campusById(me.campusId)?.name ?? "") : ""}
    />
  );
}

function MatchBody({
  match,
  myArea,
  campusName,
}: {
  match: CommuteMatch;
  myArea: string;
  campusName: string;
}) {
  const styles = useStyles();
  const colors = useColors();

  const { data: myCommute } = useCommute();
  const offering = match.intent === "offer" || match.intent === "both";
  // Already offering seats on every day you match: they can request from
  // their side, and sending you to re-enter your commute would be busywork.
  const iOffer =
    (myCommute?.intent === "offer" || myCommute?.intent === "both") &&
    match.matchingDays.length > 0 &&
    match.matchingDays.every((d) => myCommute.schedule.some((s) => s.day === d));
  const matching = new Set<Weekday>(match.matchingDays);
  const theirDays = new Set<Weekday>(match.schedule.map((s) => s.day));
  const total = match.schedule.length;

  return (
    <>
      <AppBar title={match.user.firstName} />
      <Screen
        footer={
          offering && match.rideId ? (
            <>
              <Button
                label={`Ask ${match.user.firstName} for a seat`}
                block
                onPress={() => router.push(`/ride/request?id=${match.rideId}`)}
              />
              <Text variant="caption" tone="tertiary" style={styles.footNote}>
                You pick which days you need on the next screen.
              </Text>
            </>
          ) : offering ? (
            // Offering, but their listing is gone — a filled last seat, or a
            // commute they have since changed.
            <>
              <Button
                label="See other rides"
                variant="secondary"
                block
                onPress={() => router.push("/ride/find")}
              />
              <Text variant="caption" tone="tertiary" style={styles.footNote}>
                {match.user.firstName} has no seats listed right now.
              </Text>
            </>
          ) : iOffer ? (
            <>
              <Button
                label="View my commute"
                variant="secondary"
                block
                onPress={() => router.push("/(tabs)/commute")}
              />
              <Text variant="caption" tone="tertiary" style={styles.footNote}>
                You already offer seats on {describeDays(match.matchingDays)}.{" "}
                {match.user.firstName} can request one from their matches.
              </Text>
            </>
          ) : (
            // They want a seat, not to give one. There is no invite in this
            // product, so the honest action is to offer seats on your own
            // commute and let the match surface you to them.
            <>
              <Button
                label="Offer seats on your commute"
                block
                onPress={() => router.push(`/driver/offer?match=${match.id}`)}
              />
              <Text variant="caption" tone="tertiary" style={styles.footNote}>
                {match.user.firstName} is looking for a ride. Offer seats and
                you will show up in their matches.
              </Text>
            </>
          )
        }
        contentStyle={styles.content}
      >
        <Card padding="regular">
          <PersonRow
            user={match.user}
            size="lg"
            caption={offering ? "Offering seats" : "Looking for a ride"}
            highlighted
          />

          <View style={styles.compatRow}>
            <View style={styles.compat}>
              <Text variant="h2">
                {match.matchingDays.length}
                <Text variant="body" tone="secondary">
                  {" "}
                  of {total}
                </Text>
              </Text>
              <Text variant="bodySmall" tone="secondary">
                days match
              </Text>
            </View>
            {match.proximity ? (
              <View style={styles.compatRight}>
                <ProximityIndicator estimate={match.proximity} />
              </View>
            ) : null}
          </View>
        </Card>

        {/* Reachable because you are matched. There is no in-app messaging,
            so this is how the practical details actually get sorted. */}
        <ContactActions
          firstName={match.user.firstName}
          phone={match.contactPhone}
        />

        {/* Area to campus, never a pin on a home. The route says whether the
            commute is compatible, which is all either side needs. */}
        <View style={styles.section}>
          <SectionHeader title="Their route" />
          <RoutePreviewCard
            originArea={match.area}
            destinationCampus={campusName || match.campusName}
            via={match.proximity?.overlapHint}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Which days line up"
            caption="Only the days you both travel are shown as matching."
          />
          <Card padding="regular">
            <View style={styles.dayGrid}>
              {WEEKDAYS.filter((d) => d !== "Sat" && d !== "Sun").map((day) => {
                const isMatch = matching.has(day);
                const theyTravel = theirDays.has(day);
                return (
                  <View
                    key={day}
                    style={[
                      styles.dayChip,
                      isMatch && styles.dayChipMatch,
                      !theyTravel && styles.dayChipOff,
                    ]}
                  >
                    <Text
                      variant="caption"
                      tone={isMatch ? "onBrand" : "tertiary"}
                    >
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.times}>
              {sortSchedule(match.schedule).map((entry) => (
                <View key={entry.day} style={styles.timeRow}>
                  <Feather
                    name={matching.has(entry.day) ? "check" : "minus"}
                    size={13}
                    color={
                      matching.has(entry.day)
                        ? colors.success
                        : colors.textTertiary
                    }
                  />
                  <Text
                    variant="bodySmall"
                    tone={matching.has(entry.day) ? "secondary" : "tertiary"}
                    style={styles.flex}
                    numberOfLines={1}
                  >
                    {describeDayTimes(entry)}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title="How this would work" />
          <Card padding="regular">
            <View style={styles.factRow}>
              <Feather name="map-pin" size={14} color={colors.textTertiary} />
              <Text variant="bodySmall" tone="secondary" style={styles.flex}>
                They set off from {match.area}. You set off from{" "}
                {myArea || "your area"}.
              </Text>
            </View>
            {offering && match.seatsAvailable ? (
              <View style={styles.factRow}>
                <Feather name="users" size={14} color={colors.textTertiary} />
                <Text variant="bodySmall" tone="secondary" style={styles.flex}>
                  {match.seatsTaken
                    ? `${match.seatsTaken} ${
                        match.seatsTaken === 1 ? "person has" : "people have"
                      } joined · `
                    : ""}
                  {match.seatsAvailable}{" "}
                  {match.seatsAvailable === 1 ? "seat" : "seats"} left
                  {match.contribution
                    ? ` · ${formatPkr(match.contribution)} shared cost`
                    : ""}
                </Text>
              </View>
            ) : null}
            <View style={styles.factRow}>
              <Feather name="phone" size={14} color={colors.textTertiary} />
              <Text variant="bodySmall" tone="secondary" style={styles.flex}>
                Phone numbers are shared only once a seat is accepted.
              </Text>
            </View>
          </Card>
        </View>

        <Card tone="inset">
          <View style={styles.factRow}>
            <Feather name="lock" size={15} color={colors.textSecondary} />
            <Text variant="bodySmall" tone="secondary" style={styles.flex}>
              You see a first name, a photo and their general area. They see
              exactly the same about you.
            </Text>
          </View>
        </Card>

        <Button
          label="Report or block"
          variant="tertiary"
          size="compact"
          style={styles.report}
          onPress={() =>
            router.push(`/safety/report?userId=${match.user.id}`)
          }
        />
      </Screen>
    </>
  );
}

const useStyles = makeStyles((c) => ({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.base,
  },
  section: {
    gap: spacing.md,
  },
  compatRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: c.rideCardBorder,
  },
  compat: {
    gap: 1,
  },
  compatRight: {
    alignItems: "flex-end",
  },
  dayGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dayChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
    backgroundColor: c.surfaceSecondary,
  },
  dayChipMatch: {
    backgroundColor: c.brand,
  },
  dayChipOff: {
    opacity: 0.45,
  },
  times: {
    gap: spacing.sm,
    marginTop: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  factRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  report: {
    alignSelf: "center",
  },
  footNote: {
    textAlign: "center",
  },
  skeletonCard: {
    borderRadius: radius.lg,
  },
}));
