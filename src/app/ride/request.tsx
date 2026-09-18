import { useState } from "react";
import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { PersonRow } from "@/components/person-row";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Segmented } from "@/components/segmented";
import { Text } from "@/components/text";
import { formatPkr } from "@/components/contribution";
import { makeStyles, MIN_TOUCH_TARGET, radius, spacing, useColors } from "@/theme";
import { api } from "@/services";
import { useRide } from "@/hooks/data";
import { describeDayTimes, sortSchedule } from "@/utils/schedule";
import { SkeletonCard, SkeletonRows } from "@/components/skeleton";
import type { CommuteDirection, RideListing, Weekday } from "@/data/types";

/**
 * The form seeds its day selection from the ride, so it is only mounted once
 * the ride has loaded. Seeding from an absent ride would start every request
 * with zero days selected and the "choose at least one day" error already
 * showing, on a screen the user has not touched yet.
 */
export default function RequestSeat() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: ride, loading } = useRide(id);

  if (loading) {
    return (
      <>
        <AppBar title="Request a seat" />
        <Screen contentStyle={styles.content}>
          <SkeletonCard lines={1} />
          <SkeletonRows rows={4} />
        </Screen>
      </>
    );
  }

  if (!ride) {
    return (
      <>
        <AppBar title="Request a seat" />
        <Screen>
          <EmptyState
            icon="alert-circle"
            title="This ride is no longer listed"
            body="The person may have changed their commute or filled the last seat."
            actionLabel="Find another ride"
            onAction={() => router.replace("/ride/find")}
          />
        </Screen>
      </>
    );
  }

  return <RequestForm ride={ride} />;
}

function RequestForm({ ride }: { ride: RideListing }) {
  const styles = useStyles();
  const colors = useColors();

  const [days, setDays] = useState<Weekday[]>(() =>
    ride.schedule.map((entry) => entry.day),
  );
  const [direction, setDirection] = useState<CommuteDirection>(ride.direction);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-day schedules mean a rider may only want some of the offered days.
  // Asking up front avoids a request that gets declined for the wrong reason.
  function toggleDay(day: Weekday) {
    setDays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day],
    );
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.rides.requestSeat(ride.id, 1);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not send your request. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <>
        <AppBar title="Request sent" showBack={false} />
        <Screen
          footer={
            <>
              <Button
                label="Back to home"
                block
                onPress={() => router.dismissTo("/(tabs)")}
              />
              <Button
                label="See other rides"
                variant="tertiary"
                block
                onPress={() => router.dismissTo("/ride/results")}
              />
            </>
          }
          contentStyle={styles.content}
        >
          {/* Quiet confirmation. The outcome is stated plainly and the next
              step is named, with no celebration graphics. */}
          <View style={styles.successMark}>
            <Feather name="check" size={26} color={colors.success} />
          </View>
          <Text variant="h2" style={styles.centred}>
            Request sent to {ride.driver.firstName}
          </Text>
          <Text variant="bodyLarge" tone="secondary" style={styles.centred}>
            Most people reply within a few hours. We will notify you as soon as
            your seat is confirmed.
          </Text>

          <Card padding="regular" style={styles.summaryCard}>
            <SummaryRow label="From" value={ride.originArea} />
            <SummaryRow label="To" value={ride.destinationCampus} />
            <SummaryRow label="Days" value={days.join(" · ")} />
            <SummaryRow
              label="Contribution"
              value={`${formatPkr(ride.contribution)} each way`}
              last
            />
          </Card>
        </Screen>
      </>
    );
  }

  return (
    <>
      <AppBar title="Request a seat" />
      <Screen
        footer={
          <>
            <Button
              label="Send request"
              block
              loading={submitting}
              disabled={days.length === 0}
              onPress={submit}
            />
            {error ? (
              <Text variant="bodySmall" tone="error" style={styles.centred}>
                {error}
              </Text>
            ) : (
              <Text variant="caption" tone="tertiary" style={styles.centred}>
                Nothing is confirmed until {ride.driver.firstName} accepts.
              </Text>
            )}
          </>
        }
        contentStyle={styles.content}
      >
        <Card tone="ride" padding="regular">
          <PersonRow
            user={ride.driver}
            caption={`${ride.originArea} · ${ride.vehicleType === "car" ? "Car" : "Bike"}`}
          />
        </Card>

        <View style={styles.section}>
          <SectionHeader
            title="Which days do you need?"
            caption="Pick only the days you actually travel. You can change this later."
          />
          <Card padding="none">
            {sortSchedule(ride.schedule).map((entry, index) => {
              const selected = days.includes(entry.day);
              return (
                <Pressable
                  key={entry.day}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${entry.day}. ${describeDayTimes(entry)}`}
                  onPress={() => toggleDay(entry.day)}
                  style={({ pressed }) => [
                    styles.dayRow,
                    index !== ride.schedule.length - 1 && styles.divider,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.check, selected && styles.checkOn]}>
                    {selected ? (
                      <Feather name="check" size={13} color={colors.onBrand} />
                    ) : null}
                  </View>
                  <Text variant="h4" style={styles.dayLabel}>
                    {entry.day}
                  </Text>
                  <Text
                    variant="body"
                    tone="secondary"
                    style={styles.flex}
                    numberOfLines={1}
                  >
                    {describeDayTimes(entry)}
                  </Text>
                </Pressable>
              );
            })}
          </Card>
          {days.length === 0 ? (
            <Text variant="bodySmall" tone="error">
              Choose at least one day.
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Which legs" />
          <Segmented<CommuteDirection>
            value={direction}
            onChange={setDirection}
            options={[
              { value: "going", label: "Going" },
              { value: "returning", label: "Return" },
              { value: "both", label: "Both" },
            ]}
          />
        </View>

        <Card padding="regular">
          <View style={styles.costRow}>
            <View style={styles.flex}>
              <Text variant="h4">Your contribution</Text>
              <Text variant="bodySmall" tone="tertiary">
                Paid directly, each way you travel
              </Text>
            </View>
            <Text variant="h2">{formatPkr(ride.contribution)}</Text>
          </View>
        </Card>
      </Screen>
    </>
  );
}

function SummaryRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.summaryRow, !last && styles.divider]}>
      <Text variant="body" tone="secondary">
        {label}
      </Text>
      <Text variant="h4" style={styles.summaryValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
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
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    minHeight: MIN_TOUCH_TARGET + 6,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  pressed: {
    backgroundColor: c.surfaceSecondary,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: {
    backgroundColor: c.brand,
    borderColor: c.brand,
  },
  dayLabel: {
    width: 40,
  },
  flex: {
    flex: 1,
  },
  costRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  successMark: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: c.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing["2xl"],
    marginBottom: spacing.sm,
  },
  centred: {
    textAlign: "center",
  },
  summaryCard: {
    marginTop: spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.base,
    paddingVertical: spacing.md,
  },
  summaryValue: {
    flex: 1,
    textAlign: "right",
  },
}));
