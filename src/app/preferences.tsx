import { useState } from "react";
import { View } from "react-native";
import { WOMEN_ONLY_ENABLED } from "@/data/flags";
import { AppBar } from "@/components/app-bar";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { OptionSheet } from "@/components/option-sheet";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Text } from "@/components/text";
import { ToggleRow } from "@/components/toggle-row";
import { SkeletonForm } from "@/components/skeleton";
import { makeStyles, spacing } from "@/theme";
import { api } from "@/services";
import type { MatchPreferences } from "@/services";
import { usePreferences } from "@/hooks/data";

const RADIUS_OPTIONS = [
  "Same area only",
  "Nearby areas",
  "Anywhere on my route",
];

const TIME_WINDOWS = [
  "Within 15 minutes",
  "Within 30 minutes",
  "Within 45 minutes",
  "Within an hour",
];

export default function Preferences() {
  const styles = useStyles();
  const { data: prefs, set } = usePreferences();
  const [picker, setPicker] = useState<"radius" | "window" | null>(null);

  /**
   * Written through on every toggle rather than behind a Save button. These
   * are reversible switches, so an explicit save step would be one more thing
   * to forget than it is worth.
   */
  function update(patch: Partial<MatchPreferences>) {
    if (!prefs) return;
    set({ ...prefs, ...patch });
    api.preferences.update(patch);
  }

  if (!prefs) {
    return (
      <>
        <AppBar title="Commute preferences" />
        <Screen contentStyle={styles.content}>
          <SkeletonForm />
        </Screen>
      </>
    );
  }

  return (
    <>
      <AppBar title="Commute preferences" />
      <Screen contentStyle={styles.content}>
        <Text variant="body" tone="secondary">
          These narrow who you are matched with. Loosening them usually finds
          more people.
        </Text>

        <View style={styles.section}>
          <SectionHeader title="Finding a ride" />
          <Card padding="none">
            {WOMEN_ONLY_ENABLED ? (
              <ToggleRow
                label="Women only"
                caption="Match with women drivers and passengers"
                icon="users"
                accent="womenOnly"
                value={prefs.womenOnly}
                onChange={(v) => update({ womenOnly: v })}
              />
            ) : null}
            <ToggleRow
              label="Verified commuters only"
              caption="Only people who uploaded ID for the badge"
              icon="shield"
              value={prefs.verifiedOnly}
              onChange={(v) => update({ verifiedOnly: v })}
            />
            <ToggleRow
              label="Cars only"
              caption="Hide bike offers"
              icon="truck"
              value={prefs.carsOnly}
              onChange={(v) => update({ carsOnly: v })}
              last
            />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="How far you will go"
            caption="How flexible you are about pickup and timing."
          />
          <Card padding="regular">
            <View style={styles.fields}>
              <Input
                label="Pickup distance"
                icon="map-pin"
                value={prefs.pickupRadius}
                onPressField={() => setPicker("radius")}
              />
              <Input
                label="Departure time window"
                icon="clock"
                value={prefs.timeWindow}
                hint="How far from your set time a match can still be useful."
                onPressField={() => setPicker("window")}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Offering seats" />
          <Card padding="none">
            {WOMEN_ONLY_ENABLED ? (
              <ToggleRow
                label="Women passengers only"
                caption="Only women can request a seat from you"
                icon="users"
                accent="womenOnly"
                value={prefs.womenOnly}
                onChange={(v) => update({ womenOnly: v })}
              />
            ) : null}
            <ToggleRow
              label="My campus only"
              caption="Hide requests from people at other institutions"
              icon="award"
              value={prefs.sameCampusOnly}
              onChange={(v) => update({ sameCampusOnly: v })}
            />
            <ToggleRow
              label="Accept verified commuters automatically"
              caption="Skip approving each request yourself"
              icon="check-circle"
              value={prefs.autoAcceptVerified}
              onChange={(v) => update({ autoAcceptVerified: v })}
              last
            />
          </Card>
        </View>

        <Card tone="inset">
          <Text variant="bodySmall" tone="secondary">
            Your institution and campus are always applied, whatever else you
            set here. That constraint is what the product is built on.
          </Text>
        </Card>
      </Screen>

      <OptionSheet
        visible={picker === "radius"}
        onClose={() => setPicker(null)}
        title="Pickup distance"
        options={RADIUS_OPTIONS}
        value={prefs.pickupRadius}
        onSelect={(v) => update({ pickupRadius: v })}
      />
      <OptionSheet
        visible={picker === "window"}
        onClose={() => setPicker(null)}
        title="Departure time window"
        options={TIME_WINDOWS}
        value={prefs.timeWindow}
        onSelect={(v) => update({ timeWindow: v })}
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
    gap: spacing.lg,
  },
}));
