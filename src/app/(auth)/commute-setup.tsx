import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { ScheduleEditor } from "@/components/schedule-editor";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Segmented } from "@/components/segmented";
import { Text } from "@/components/text";
import { LocationSearch, SelectedLocation } from "@/components/location";
import { makeStyles, spacing } from "@/theme";
import { areas } from "@/data/areas";
import { campusById } from "@/data/institutions";
import { api } from "@/services";
import { useSignup } from "@/state/signup";
import { applyToAll, describeSchedule } from "@/utils/schedule";
import type {
  AreaSuggestion,
  CommuteDirection,
  DaySchedule,
} from "@/data/types";

export default function CommuteSetup() {
  const styles = useStyles();
  const { draft, update, reset } = useSignup();

  const [direction, setDirection] = useState<CommuteDirection>("both");
  const [schedule, setSchedule] = useState<DaySchedule[]>(() =>
    applyToAll(["Mon", "Tue", "Wed", "Thu", "Fri"], "7:30 AM", "5:30 PM"),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seeded from the area given at registration, but changeable here: where you
  // set off from is a commute question, and the account answer is only a
  // sensible default.
  const seedArea = areas.find((a) => a.id === draft.areaId);
  const [origin, setOrigin] = useState<AreaSuggestion | null>(
    seedArea
      ? { areaId: seedArea.id, name: seedArea.name, city: seedArea.city }
      : null,
  );

  const campusName = draft.campusId
    ? (campusById(draft.campusId)?.name ?? "your campus")
    : "your campus";

  // Offering needs a vehicle, a seat count and a contribution. Sign-up asks
  // for none of those, so creating the commute as "offer" here was refused by
  // the server every time — "Add a vehicle before offering seats" — and
  // because the failure was never caught, the button simply stopped spinning
  // and the person was stuck on this screen with no idea why.
  //
  // So it is created as "find", which is always valid, and anybody who chose
  // to offer goes straight to the screen that collects a car and switches the
  // mode. Abandoning there leaves a working commute rather than nothing.
  const wantsToOffer = draft.intent === "offer" || draft.intent === "both";

  async function finish() {
    setSubmitting(true);
    setError(null);
    try {
      update({ schedule });
      await api.commutes.create({
        intent: "find",
        institutionId: draft.institutionId!,
        campusId: draft.campusId!,
        originAreaId: origin?.areaId ?? draft.areaId!,
        schedule,
        direction,
        womenOnly: false,
      });
      reset();
      router.replace(wantsToOffer ? "/driver/offer" : "/commute/ready");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not save your commute. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AppBar title="Tell us about your commute" showBack={false} />
      <Screen
        footer={
          <>
            {error ? (
              <Text variant="bodySmall" tone="error" style={styles.error}>
                {error}
              </Text>
            ) : null}
            <Button
              label={wantsToOffer ? "Next: your car" : "Finish"}
              block
              loading={submitting}
              disabled={schedule.length === 0 || !origin}
              onPress={finish}
            />
            <Button
              label="Skip for now"
              variant="tertiary"
              block
              onPress={() => {
                reset();
                router.replace("/(tabs)");
              }}
            />
          </>
        }
        contentStyle={styles.content}
      >
        <View style={styles.section}>
          <SectionHeader
            title="Where do you start from?"
            caption="Your general area. We never ask for an address."
          />
          {origin ? (
            <SelectedLocation
              suggestion={origin}
              onChange={() => setOrigin(null)}
            />
          ) : (
            <LocationSearch
              label="Search for your area"
              onSelect={setOrigin}
            />
          )}
        </View>

        <Text variant="body" tone="secondary">
          This is what we match on. Set it once and we keep finding people from
          {" "}{campusName} who travel when you do.
        </Text>

        <View style={styles.section}>
          <SectionHeader
            title="Which legs"
            caption="Nobody is forced into a round trip."
          />
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

        <View style={styles.section}>
          <SectionHeader
            title="Days and times"
            caption={describeSchedule(schedule)}
          />
          <ScheduleEditor
            schedule={schedule}
            onChange={setSchedule}
            direction={direction}
          />
        </View>

        <Card tone="inset">
          <Text variant="bodySmall" tone="secondary">
            Timetables are rarely the same every day. If yours changes during
            the week, turn on different times per day above.
          </Text>
        </Card>
      </Screen>
    </>
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
  // Sits above the button in the footer, where the tap that caused it was.
  error: {
    marginBottom: spacing.sm,
  },
}));
