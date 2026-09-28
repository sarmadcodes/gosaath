import { useState } from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { WOMEN_ONLY_ENABLED } from "@/data/flags";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { OptionSheet } from "@/components/option-sheet";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Segmented } from "@/components/segmented";
import { Text } from "@/components/text";
import { ToggleRow } from "@/components/toggle-row";
import { RideCard } from "@/components/ride-card";
import { EmptyState } from "@/components/empty-state";
import { TimePicker } from "@/components/time-picker";
import { SkeletonForm } from "@/components/skeleton";
import { RoutePreviewCard } from "@/components/location";
import { useMe, useNearbyRides } from "@/hooks/data";
import { makeStyles, spacing, useColors } from "@/theme";
import { areas, areaName } from "@/data/areas";
import { campusById } from "@/data/institutions";
import { weekdayOf } from "@/utils/schedule";
import type { User, Weekday } from "@/data/types";

type Picker = "from" | "day" | null;

const DAY_LABELS: { value: Weekday; label: string }[] = [
  { value: "Mon", label: "Monday" },
  { value: "Tue", label: "Tuesday" },
  { value: "Wed", label: "Wednesday" },
  { value: "Thu", label: "Thursday" },
  { value: "Fri", label: "Friday" },
  { value: "Sat", label: "Saturday" },
  { value: "Sun", label: "Sunday" },
];

export default function FindRide() {
  const styles = useStyles();
  const { data: me } = useMe();

  if (!me) {
    return (
      <>
        <AppBar title="Find a ride" />
        <Screen contentStyle={styles.content}>
          <SkeletonForm />
        </Screen>
      </>
    );
  }

  return <FindRideForm me={me} />;
}

/**
 * Deliberately short.
 *
 * Institution and campus are hard matching constraints, not filters, so they
 * are stated rather than offered. The starting area comes from the account.
 * That leaves three questions worth asking — when, which direction, and any
 * narrowing — and everything else stays out of the way.
 */
function FindRideForm({ me }: { me: User }) {
  const styles = useStyles();
  const colors = useColors();

  const [from, setFrom] = useState(areaName(me.areaId));
  const [day, setDay] = useState<Weekday>(weekdayOf());
  const [time, setTime] = useState("8:00 AM");
  const [timeOpen, setTimeOpen] = useState(false);
  const [direction, setDirection] = useState<"going" | "returning">("going");
  const [picker, setPicker] = useState<Picker>(null);
  const [showMore, setShowMore] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);
  const [carsOnly, setCarsOnly] = useState(false);

  // Everyone at this campus offering seats on the chosen day, whatever time
  // they travel. Someone with no schedule-compatible match still wants to see
  // who is out there.
  const { data: nearby = [], loading: nearbyLoading } = useNearbyRides(day);

  const campusName = campusById(me.campusId)?.name ?? "";
  const dayLabel = DAY_LABELS.find((d) => d.value === day)?.label ?? "";

  function search() {
    router.push({
      pathname: "/ride/results",
      params: {
        day,
        time,
        direction,
        womenOnly: womenOnly ? "1" : "0",
        carsOnly: carsOnly ? "1" : "0",
      },
    });
  }

  return (
    <>
      <AppBar title="Find a ride" />
      <Screen
        footer={<Button label="Search matching rides" block onPress={search} />}
        contentStyle={styles.content}
      >
        {/* The route is a statement, not a form. Both ends are already known,
            and an editable-looking field for a value you cannot change is a
            question the user has to read before dismissing. */}
        <RoutePreviewCard
          originArea={direction === "going" ? from : campusName}
          destinationCampus={direction === "going" ? campusName : from}
        />

        <Segmented<"going" | "returning">
          value={direction}
          onChange={setDirection}
          options={[
            { value: "going", label: "To campus" },
            { value: "returning", label: "Heading home" },
          ]}
        />

        <Card padding="regular">
          <View style={styles.fields}>
            <Input
              label="Day"
              icon="calendar"
              value={dayLabel}
              onPressField={() => setPicker("day")}
            />
            <Input
              label={
                direction === "going" ? "Class starts at" : "Class ends at"
              }
              icon="clock"
              value={time}
              hint={
                direction === "going"
                  ? "The time you need to be on campus by."
                  : "When you are done and heading back."
              }
              onPressField={() => setTimeOpen(true)}
            />
            <Input
              label="Starting area"
              icon="map-pin"
              value={from}
              onPressField={() => setPicker("from")}
            />
          </View>
        </Card>

        {/* Folded away by default. Most searches never touch these, and two
            switches on arrival makes the screen look like configuration. */}
        {showMore ? (
          <View style={styles.section}>
            <SectionHeader title="Narrow it down" />
            <Card padding="none">
              {WOMEN_ONLY_ENABLED ? (
                <ToggleRow
                  label="Women only"
                  caption="Match with women drivers and passengers"
                  icon="users"
                  accent="womenOnly"
                  value={womenOnly}
                  onChange={setWomenOnly}
                />
              ) : null}
              <ToggleRow
                label="Cars only"
                caption="Hide bike offers"
                icon="truck"
                value={carsOnly}
                onChange={setCarsOnly}
                last
              />
            </Card>
          </View>
        ) : (
          <Button
            label="More options"
            variant="tertiary"
            size="compact"
            onPress={() => setShowMore(true)}
          />
        )}

        {/* Second section: everyone at this campus offering seats on the
            chosen day, whatever time they travel.

            The search above matches a schedule, which is the right default but
            returns nothing on a campus that is still filling up — and nothing
            is what makes a new user leave. This list only requires the same
            university and a nearby area, so there is always something to look
            at, and the timing is a conversation between two people rather than
            a filter. */}
        <View style={styles.section}>
          <SectionHeader
            title="Nearby rides"
            caption={`People near you at ${campusName} offering seats on ${dayLabel}, whatever time they travel.`}
          />

          {nearbyLoading ? (
            <View style={styles.list}>
              <SkeletonForm />
            </View>
          ) : nearby.length === 0 ? (
            <EmptyState
              icon="map-pin"
              title="Nobody nearby on that day"
              body="Nobody within a few kilometres of you is offering seats that day. Try another day, or set up your commute so we can tell you as soon as somebody on your route does."
            />
          ) : (
            <View style={styles.list}>
              {nearby.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  onPress={() => router.push(`/ride/${ride.id}`)}
                />
              ))}
            </View>
          )}
        </View>

        <Card tone="inset" padding="compact">
          <View style={styles.hintRow}>
            <Feather name="repeat" size={15} color={colors.textSecondary} />
            <Text variant="bodySmall" tone="secondary" style={styles.flex}>
              Travelling this route most days? Set up a commute and we keep
              matching you automatically.
            </Text>
          </View>
          <Button
            label="Set up commute"
            variant="tertiary"
            size="compact"
            style={styles.inlineCta}
            onPress={() => router.push("/commute/create")}
          />
        </Card>
      </Screen>

      <OptionSheet
        visible={picker === "from"}
        onClose={() => setPicker(null)}
        title="Starting area"
        options={areas.map((a) => a.name)}
        value={from}
        onSelect={setFrom}
      />
      <OptionSheet
        visible={picker === "day"}
        onClose={() => setPicker(null)}
        title="Which day"
        options={DAY_LABELS.map((d) => d.label)}
        value={dayLabel}
        onSelect={(label) => {
          const match = DAY_LABELS.find((d) => d.label === label);
          if (match) setDay(match.value);
        }}
      />
      <TimePicker
        visible={timeOpen}
        onClose={() => setTimeOpen(false)}
        title={direction === "going" ? "Class starts at" : "Class ends at"}
        caption={
          direction === "going"
            ? "The time you need to be on campus by. Drivers work backwards from this."
            : "When you are done on campus."
        }
        value={time}
        onSelect={setTime}
      />
    </>
  );
}

const useStyles = makeStyles(() => ({
  content: {
    gap: spacing.base,
    paddingTop: spacing.base,
  },
  section: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  fields: {
    gap: spacing.base,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  inlineCta: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
  },
}));
