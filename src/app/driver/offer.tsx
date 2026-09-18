import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { OptionSheet } from "@/components/option-sheet";
import { ScheduleEditor } from "@/components/schedule-editor";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Segmented } from "@/components/segmented";
import { Text } from "@/components/text";
import { ToggleRow } from "@/components/toggle-row";
import { SkeletonForm } from "@/components/skeleton";
import { useCommute, useMe } from "@/hooks/data";
import { api } from "@/services";
import type { User } from "@/data/types";
import { makeStyles, spacing } from "@/theme";
import { areas } from "@/data/areas";
import { campusById, communityLabel } from "@/data/institutions";
import { applyToAll, describeSchedule } from "@/utils/schedule";
import type { CommuteDirection, DaySchedule, VehicleType } from "@/data/types";

/** Cars seat up to 7. A bike carries one pillion passenger. */
const CAR_SEATS = ["1", "2", "3", "4", "5", "6", "7"];
/**
 * Guidance, not a limit.
 *
 * What a fair share costs depends on how far the driver is coming from, and a
 * hard range would block the honest cases at both ends — a short hop across
 * one area, or somebody driving in from Malir. The typical band is shown so
 * people have a reference, and anything is accepted.
 */
const TYPICAL_CONTRIBUTION = { car: [200, 600], bike: [100, 300] };

type Picker = "from" | "departure" | "seats" | null;

export default function OfferSeats() {
  const styles = useStyles();
  const { data: me } = useMe();

  if (!me) {
    return (
      <>
        <AppBar title="Offer seats" />
        <Screen contentStyle={styles.content}>
          <SkeletonForm />
        </Screen>
      </>
    );
  }

  return <OfferSeatsForm me={me} />;
}

function OfferSeatsForm({ me }: { me: User }) {
  const styles = useStyles();

  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const [from, setFrom] = useState(
    areas.find((a) => a.id === me.areaId)?.name ?? "",
  );
  const [direction, setDirection] = useState<CommuteDirection>("both");
  const [schedule, setSchedule] = useState<DaySchedule[]>(() =>
    applyToAll(["Mon", "Tue", "Wed", "Thu", "Fri"], "7:30 AM", "5:30 PM"),
  );
  const [seats, setSeats] = useState("2");
  const [contribution, setContribution] = useState("250");
  const [womenOnly, setWomenOnly] = useState(false);
  const [picker, setPicker] = useState<Picker>(null);

  const { data: commute } = useCommute();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const campusName = campusById(me.campusId)?.name ?? "";
  const community = communityLabel(
    me.institutionId,
    me.campusId,
  );

  const [typicalLow, typicalHigh] = TYPICAL_CONTRIBUTION[vehicleType];
  const amount = Number(contribution);
  // Only genuinely invalid input is rejected. The amount itself is the
  // driver's call.
  const contributionError =
    contribution.length > 0 && (Number.isNaN(amount) || amount < 0)
      ? "Enter an amount, or 0 if you are not asking for anything."
      : undefined;

  const valid = schedule.length > 0 && from.length > 0 && !contributionError;

  /**
   * Offering seats is a property of the recurring commute, not a separate
   * listing: the same person rides some days and drives others, and forcing
   * them to maintain two records would be the first thing to drift apart.
   */
  async function save() {
    setSaving(true);
    setSaveError(null);
    const originAreaId =
      areas.find((a) => a.name === from)?.id ?? me.areaId;
    const offer = {
      intent: "offer" as const,
      originAreaId,
      schedule,
      direction,
      seatsOffered: Number(seats) || 1,
      contribution: Number(contribution) || 0,
      womenOnly,
    };

    try {
      if (commute) {
        await api.commutes.update(commute.id, offer);
      } else {
        await api.commutes.create({
          ...offer,
          institutionId: me.institutionId,
          campusId: me.campusId,
        });
      }
      router.dismissTo("/(tabs)/commute");
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "We could not save this. Try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppBar title="Offer seats" subtitle={community} />
      <Screen
        footer={
          <Button
            label="Offer seats"
            block
            loading={saving}
            disabled={!valid}
            onPress={save}
          />
        }
        contentStyle={styles.content}
      >
        {/* Language treats the user as a commuter with spare seats, not as a
            driver running a service. */}
        <Text variant="body" tone="secondary">
          Share the seats you already have free and split the running cost with
          people from your campus.
        </Text>

        <View style={styles.section}>
          <SectionHeader title="What are you driving" />
          <Segmented<VehicleType>
            value={vehicleType}
            onChange={(next) => {
              setVehicleType(next);
              if (next === "bike") setSeats("1");
            }}
            options={[
              { value: "car", label: "Car" },
              { value: "bike", label: "Bike" },
            ]}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Your route" />
          <Card padding="regular">
            <View style={styles.fields}>
              <Input
                label="From"
                icon="map-pin"
                value={from}
                onPressField={() => setPicker("from")}
              />
              <Input
                label="To"
                icon="flag"
                value={campusName}
                editable={false}
              />
            </View>
          </Card>
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

        <View style={styles.section}>
          <SectionHeader
            title="Days and times you drive"
            caption={describeSchedule(schedule)}
          />
          <ScheduleEditor
            schedule={schedule}
            onChange={setSchedule}
            direction={direction}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Seats and shared cost"
            caption="Covering fuel, not charging a fare."
          />
          <Card padding="regular">
            <View style={styles.fields}>
              {vehicleType === "car" ? (
                <Input
                  label="Seats available"
                  icon="users"
                  value={seats}
                  onPressField={() => setPicker("seats")}
                />
              ) : (
                <Input
                  label="Seats available"
                  icon="users"
                  value="1"
                  editable={false}
                  hint="A bike carries one passenger."
                />
              )}
              <Input
                label="Shared cost per passenger, one way"
                icon="dollar-sign"
                value={contribution}
                onChangeText={setContribution}
                keyboardType="number-pad"
                suffix="PKR"
                error={contributionError}
                hint={
                  contributionError
                    ? undefined
                    : `Most people ask Rs. ${typicalLow} to Rs. ${typicalHigh}, depending on how far you are coming from. Set whatever is fair for your route.`
                }
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Who can join" />
          <Card padding="none">
            <ToggleRow
              label="Women only"
              caption="Only women can request a seat"
              icon="users"
              accent="womenOnly"
              value={womenOnly}
              onChange={setWomenOnly}
              last
            />
          </Card>
        </View>

        <Card tone="inset">
          <Text variant="bodySmall" tone="secondary">
            GoSaath is for genuine cost sharing between commuters. Offers that
            operate as a commercial service are removed.
          </Text>
        </Card>

        {saveError ? (
          <Text variant="bodySmall" tone="error">
            {saveError}
          </Text>
        ) : null}
      </Screen>

      <OptionSheet
        visible={picker === "from"}
        onClose={() => setPicker(null)}
        title="Starting from"
        options={areas.map((a) => a.name)}
        value={from}
        onSelect={setFrom}
      />
      <OptionSheet
        visible={picker === "seats"}
        onClose={() => setPicker(null)}
        title="Seats available"
        options={CAR_SEATS}
        value={seats}
        onSelect={setSeats}
      />
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
  fields: {
    gap: spacing.base,
  },
}));
