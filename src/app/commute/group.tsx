import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { PersonRow } from "@/components/person-row";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Text } from "@/components/text";
import { SkeletonCard, SkeletonText } from "@/components/skeleton";
import { makeStyles, spacing, useColors } from "@/theme";
import { areaName } from "@/data/areas";
import { campusById } from "@/data/institutions";
import { useCommute, useCommuteMembers, useMe } from "@/hooks/data";

export default function CommuteGroup() {
  const styles = useStyles();
  const colors = useColors();

  const { data: commute } = useCommute();
  const { data: members = [] } = useCommuteMembers(commute?.id);
  const { data: me } = useMe();

  if (!commute) {
    return (
      <>
        <AppBar title="Your commute group" />
        <Screen contentStyle={styles.content}>
          <SkeletonText lines={2} />
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
        </Screen>
      </>
    );
  }

  const driver = members.find((m) => m.role === "driver");
  const passengers = members.filter((m) => m.role === "passenger");
  const origin = areaName(commute.originAreaId);
  const campusName = campusById(commute.campusId)?.name ?? "";

  // A group forms once matches turn into a shared arrangement. Until then the
  // screen explains what will appear rather than rendering empty sections.
  if (members.length === 0) {
    return (
      <>
        <AppBar
          title="Your commute group"
          subtitle={`${origin} to ${campusName}`}
        />
        <Screen contentStyle={styles.content}>
          <EmptyState
            icon="users"
            title="Your commute group will appear here"
            body="Once you find compatible people at your campus and agree to travel together, everyone sharing your recurring route shows up on this screen."
            actionLabel="View matches"
            onAction={() => router.push("/matches")}
          />
        </Screen>
      </>
    );
  }

  return (
    <>
      <AppBar
        title="Your commute group"
        subtitle={`${origin} to ${campusName}`}
      />
      <Screen contentStyle={styles.content}>
        {/* This is a travel arrangement, not a social space. There are no
            posts, followers or profiles to open here by design. */}
        <Text variant="body" tone="secondary">
          The people you share this route with. Only a first name and general
          area are shared.
        </Text>

        <View style={styles.section}>
          <SectionHeader title="Driving" />
          {driver ? (
            <Card padding="regular">
              <PersonRow user={driver.user} role="Driver" size="lg" highlighted />
              <View style={styles.statusStrip}>
                <Feather
                  name={driver.travellingNext ? "check-circle" : "alert-circle"}
                  size={14}
                  color={driver.travellingNext ? colors.success : colors.warning}
                />
                <Text
                  variant="bodySmall"
                  tone={driver.travellingNext ? "success" : "warning"}
                >
                  {driver.travellingNext
                    ? "Driving the next run"
                    : "Unavailable for the next run"}
                </Text>
              </View>
            </Card>
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Passengers"
            caption={`${passengers.length} people share this route`}
          />
          <View style={styles.list}>
            {passengers.map((member) => {
              const isYou = member.user.id === me?.id;
              return (
                <Card key={member.user.id} padding="regular">
                  <PersonRow
                    user={member.user}
                    role={isYou ? "You" : undefined}
                  />
                  <View style={styles.statusStrip}>
                    <Feather
                      name={
                        member.travellingNext ? "check-circle" : "minus-circle"
                      }
                      size={14}
                      color={
                        member.travellingNext
                          ? colors.success
                          : colors.textTertiary
                      }
                    />
                    <Text
                      variant="bodySmall"
                      tone={member.travellingNext ? "success" : "tertiary"}
                    >
                      {member.travellingNext
                        ? "Travelling next run"
                        : "Skipping the next run"}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>
        </View>

        <Card tone="inset">
          <Text variant="h4">Free seat on some days?</Text>
          <Text variant="bodySmall" tone="secondary" style={styles.spacer}>
            If your driver cannot make a day, you can offer to drive and keep
            the group running.
          </Text>
          <Text
            variant="button"
            tone="brand"
            style={styles.link}
            onPress={() => router.push("/driver/offer")}
          >
            Offer to drive
          </Text>
        </Card>
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
  list: {
    gap: spacing.md,
  },
  statusStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  spacer: {
    marginTop: spacing.xs,
  },
  link: {
    marginTop: spacing.md,
  },
}));
