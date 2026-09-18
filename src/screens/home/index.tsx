import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { AlertBanner } from "@/components/alert-banner";
import { Card } from "@/components/card";
import { ErrorState } from "@/components/error-state";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { HomeSkeleton } from "@/components/skeleton";
import { StatusTag } from "@/components/status";
import { Text } from "@/components/text";
import { InstitutionLogo } from "@/components/institution-logo";
import {
  makeStyles,
  MIN_TOUCH_TARGET,
  radius,
  spacing,
  useColors,
} from "@/theme";
import { areaName } from "@/data/areas";
import {
  campusById,
  communityLabel,
  institutionLogo,
} from "@/data/institutions";
import {
  useCommute,
  useCommuteMembers,
  useCommuteWeek,
  useMatches,
  useMatchSummary,
  useMe,
  useNotifications,
} from "@/hooks/data";
import { describeSchedule, todaysSchedule } from "@/utils/schedule";
import { greetingFor } from "@/utils/greeting";
import { MatchCard } from "@/screens/home/match-card";
import { QuickActions } from "@/screens/home/quick-actions";
import { TodayCard } from "@/screens/home/today-card";
import { SetupCard } from "@/screens/home/setup-card";

export function Home() {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: me } = useMe();
  const {
    data: commute,
    loading: commuteLoading,
    error: commuteError,
    reload: reloadCommute,
  } = useCommute();
  const { data: week = [] } = useCommuteWeek(commute?.id);
  const { data: members = [] } = useCommuteMembers(commute?.id);
  const { data: summary } = useMatchSummary();
  const { data: matches = [] } = useMatches();
  const { data: notifications = [] } = useNotifications();

  const unread = notifications.filter((n) => n.unread).length;

  const community = me ? communityLabel(me.institutionId, me.campusId) : "";
  const campusName = me ? (campusById(me.campusId)?.name ?? "") : "";
  const hasWideLogo = me ? !!institutionLogo(me.institutionId, "wide") : false;
  const origin = commute ? areaName(commute.originAreaId) : "";

  const today = commute ? todaysSchedule(commute.schedule) : undefined;
  const driver = members.find((m) => m.role === "driver");
  // A day can only lose its driver if there was a group with one. Without
  // members this would announce the absence of somebody who never existed.
  const dayNeedingAction =
    members.length > 0 ? week.find((d) => d.status === "noDriver") : undefined;
  const companions = members.filter(
    (m) => m.role === "passenger" && m.travellingNext && m.user.id !== me?.id,
  ).length;

  return (
    <Screen contentStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text variant="body" tone="secondary">
            {greetingFor()}
          </Text>
          {/* Full name, not just the first. Kept small so a long one still
              fits on one line at 375pt beside the logo and bell. */}
          <Text variant="h3" numberOfLines={1}>
            {me?.name ?? " "}
          </Text>
          {/* When the header logo already spells out the university, the
              caption drops to the campus alone. */}
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            {hasWideLogo ? campusName : community}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <InstitutionLogo
            institutionId={me?.institutionId}
            size={34}
            variant="wide"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              unread ? `Notifications, ${unread} unread` : "Notifications"
            }
            onPress={() => router.push("/notifications")}
            style={({ pressed }) => [styles.bell, pressed && styles.pressed]}
          >
            <Feather name="bell" size={22} color={colors.textPrimary} />
            {unread > 0 ? <View style={styles.dot} /> : null}
          </Pressable>
        </View>
      </View>

      {commuteError ? (
        // Never the setup card on failure: telling someone with a commute to
        // create one is worse than saying nothing.
        <ErrorState onRetry={reloadCommute} />
      ) : commuteLoading ? (
        <HomeSkeleton />
      ) : (
        <>
          {/* Today leads. It is what the user opened the app to check. Only
              shown when they actually travel today: with per-day times a
              weekday is not automatically a commute day.

              With no commute at all, the same slot carries the setup card —
              for a new account that genuinely is the most important thing on
              the screen, and it keeps the hierarchy identical either way. */}
          {!commute ? (
            <SetupCard
              campusName={summary?.campusName || "your campus"}
              onSetUp={() => router.push("/commute/create")}
            />
          ) : today?.arriveBy ? (
            <TodayCard
              originArea={origin}
              destinationCampus={campusName}
              arriveBy={today.arriveBy}
              driverFirstName={driver?.user.firstName}
              companions={companions}
              onView={() =>
                router.push(driver ? "/active-ride" : "/matches")
              }
            />
          ) : null}

          {/* Without a commute this is an explainer, not a destination: the
              card above already owns the one action worth offering. */}
          {summary ? (
            <MatchCard
              summary={summary}
              people={matches
                .filter((m) => m.matchingDays.length > 0)
                .map((m) => m.user)}
              onPress={
                summary.state === "noCommute"
                  ? undefined
                  : () => router.push("/matches")
              }
            />
          ) : null}

          {dayNeedingAction ? (
            <AlertBanner
              title={`No driver for ${dayNeedingAction.day}`}
              body={`Your usual driver cannot make ${dayNeedingAction.date}. We found people from your campus on a similar route.`}
              actionLabel="Find cover"
              onAction={() => router.push("/driver/replacement")}
            />
          ) : null}

          {/* Finding a ride before there is a commute to match against would
              be a dead end, so a new account is only offered the one action
              that works without one. */}
          <QuickActions
            onFindRide={commute ? () => router.push("/ride/find") : undefined}
            onOfferSeats={() => router.push("/driver/offer")}
          />

          {commute ? (
            <View style={styles.section}>
              <SectionHeader
                title="Your commute"
                actionLabel="Manage"
                onAction={() => router.push("/(tabs)/commute")}
              />
              <Card onPress={() => router.push("/(tabs)/commute")}>
                <View style={styles.rowBetween}>
                  <Text variant="h4" style={styles.flex} numberOfLines={2}>
                    {origin} to {campusName}
                  </Text>
                  <StatusTag status="confirmed" />
                </View>
                <View style={styles.meta}>
                  <Feather name="repeat" size={13} color={colors.textTertiary} />
                  <Text variant="bodySmall" tone="secondary" style={styles.flex}>
                    {describeSchedule(commute.schedule)}
                  </Text>
                </View>
                <View style={styles.meta}>
                  <Feather name="users" size={13} color={colors.textTertiary} />
                  <Text variant="bodySmall" tone="secondary">
                    {members.length} people in this group
                  </Text>
                </View>
              </Card>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((c) => ({
  content: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  greeting: {
    flex: 1,
    gap: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  bell: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -spacing.sm,
  },
  pressed: {
    backgroundColor: c.surfaceSecondary,
  },
  dot: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: c.brand,
    borderWidth: 1.5,
    borderColor: c.background,
  },
  loading: {
    gap: spacing.md,
  },
  skeletonCard: {
    borderRadius: radius.lg,
  },
  section: {
    gap: spacing.md,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
}));
