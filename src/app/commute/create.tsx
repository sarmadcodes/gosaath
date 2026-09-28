import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { WOMEN_ONLY_ENABLED } from "@/data/flags";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { DayPicker } from "@/components/day-picker";
import { Input } from "@/components/input";
import { ScheduleEditor } from "@/components/schedule-editor";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Segmented } from "@/components/segmented";
import { Text } from "@/components/text";
import { ToggleRow } from "@/components/toggle-row";
import { SkeletonForm } from "@/components/skeleton";
import { LocationSearch } from "@/components/location";
import { SelectedLocation } from "@/components/location";
import { useMe } from "@/hooks/data";
import { makeStyles, radius, spacing, useColors } from "@/theme";
import { api } from "@/services";
import { areas } from "@/data/areas";
import { campusById, institutionById } from "@/data/institutions";
import {
  applyToAll,
  describeSchedule,
  syncScheduleToDays,
} from "@/utils/schedule";
import type {
  AreaSuggestion,
  CommuteDirection,
  DaySchedule,
  User,
  Weekday,
} from "@/data/types";

export default function CreateCommute() {
  const styles = useStyles();
  const { data: me } = useMe();

  if (!me) {
    return (
      <>
        <AppBar title="Your weekly commute" />
        <Screen contentStyle={styles.content}>
          <SkeletonForm />
        </Screen>
      </>
    );
  }

  return <CreateCommuteForm me={me} />;
}

/** Three questions, one per screen. The order they matter in. */
type Step = "where" | "days" | "times";

const STEPS: Step[] = ["where", "days", "times"];

const TITLES: Record<Step, string> = {
  where: "Where do you start from?",
  days: "Which days do you travel?",
  times: "What time do you travel?",
};

function CreateCommuteForm({ me }: { me: User }) {
  const styles = useStyles();
  const colors = useColors();

  const [step, setStep] = useState<Step>("where");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seedArea = areas.find((a) => a.id === me.areaId);
  const [origin, setOrigin] = useState<AreaSuggestion | null>(
    seedArea
      ? { areaId: seedArea.id, name: seedArea.name, city: seedArea.city }
      : null,
  );
  const [days, setDays] = useState<Weekday[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [direction, setDirection] = useState<CommuteDirection>("both");
  const [womenOnly, setWomenOnly] = useState(false);

  const campusName = campusById(me.campusId)?.name ?? "your campus";
  const institution =
    institutionById(me.institutionId)?.shortName ?? "your campus";

  const index = STEPS.indexOf(step);

  function back() {
    if (index === 0) {
      router.back();
      return;
    }
    setStep(STEPS[index - 1]!);
  }

  function toDays() {
    setStep("days");
  }

  function toTimes() {
    // Seed from the chosen days, keeping anything already set. The first pass
    // gets the common Karachi campus times so this step is a confirmation
    // rather than seven empty fields.
    setSchedule((current) =>
      current.length === 0
        ? applyToAll(days, "7:30 AM", "5:30 PM")
        : syncScheduleToDays(current, days),
    );
    setStep("times");
  }

  async function save() {
    if (!origin) return;
    setSaving(true);
    setError(null);
    try {
      await api.commutes.create({
        intent: "both",
        institutionId: me.institutionId,
        campusId: me.campusId,
        originAreaId: origin.areaId,
        schedule,
        direction,
        womenOnly,
      });
      router.replace("/commute/ready");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not save your commute. Try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppBar title={TITLES[step]} onBack={back} />

      {/* Three steps is short enough that a bar reads better than "2 of 3". */}
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressSegment,
              {
                backgroundColor:
                  i <= index ? colors.brand : colors.surfaceSecondary,
              },
            ]}
          />
        ))}
      </View>

      {step === "where" ? (
        <Screen
          footer={
            <Button
              label="Continue"
              block
              disabled={!origin}
              onPress={toDays}
            />
          }
          contentStyle={styles.content}
        >
          <Text variant="body" tone="secondary">
            The general area you set off from. We never ask for your address,
            and other commuters only ever see the area.
          </Text>

          {origin ? (
            <View style={styles.section}>
              <SectionHeader title="Starting area" />
              <SelectedLocation
                suggestion={origin}
                onChange={() => setOrigin(null)}
              />
            </View>
          ) : (
            <LocationSearch
              label="Search for your area"
              onSelect={setOrigin}
            />
          )}
        </Screen>
      ) : step === "days" ? (
        <Screen
          footer={
            <Button
              label="Continue"
              block
              disabled={days.length === 0}
              onPress={toTimes}
            />
          }
          contentStyle={styles.content}
        >
          <Text variant="body" tone="secondary">
            The days you normally travel to {institution}. You can change these
            whenever your timetable does.
          </Text>

          <Card padding="regular">
            <DayPicker value={days} onChange={setDays} />
          </Card>

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
        </Screen>
      ) : (
        <Screen
          footer={
            <>
              <Button
                label="Save commute"
                block
                loading={saving}
                disabled={schedule.length === 0}
                onPress={save}
              />
              <Text variant="caption" tone="tertiary" style={styles.centred}>
                You can change or pause this at any time.
              </Text>
            </>
          }
          contentStyle={styles.content}
        >
          <Text variant="body" tone="secondary">
            Times can be different on different days. Set one time for the week,
            or switch to per-day if your timetable varies.
          </Text>

          <View style={styles.section}>
            <SectionHeader caption={describeSchedule(schedule)} title="Times" />
            <ScheduleEditor
              schedule={schedule}
              onChange={setSchedule}
              direction={direction}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader title="Your route" />
            <Card padding="regular">
              <View style={styles.fields}>
                <Input
                  label="From"
                  icon="map-pin"
                  value={origin?.name ?? ""}
                  editable={false}
                />
                <Input
                  label="To"
                  icon="flag"
                  value={campusName}
                  editable={false}
                  hint="Your campus. Change it in Settings if you move."
                />
              </View>
            </Card>
          </View>

          {WOMEN_ONLY_ENABLED ? (
            <View style={styles.section}>
              <SectionHeader title="Preferences" />
              <Card padding="none">
                <ToggleRow
                  label="Women only"
                  caption="Match with women drivers and passengers"
                  icon="users"
                  accent="womenOnly"
                  value={womenOnly}
                  onChange={setWomenOnly}
                  last
                />
              </Card>
            </View>
          ) : null}

          {error ? (
            <Text variant="bodySmall" tone="error">
              {error}
            </Text>
          ) : null}
        </Screen>
      )}
    </>
  );
}

const useStyles = makeStyles(() => ({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.base,
  },
  progress: {
    flexDirection: "row",
    gap: spacing.sm - 2,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: radius.full,
  },
  section: {
    gap: spacing.md,
  },
  fields: {
    gap: spacing.base,
  },
  centred: {
    textAlign: "center",
  },
}));
