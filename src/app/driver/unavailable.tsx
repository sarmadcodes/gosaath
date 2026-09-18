import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Text } from "@/components/text";
import { ToggleRow } from "@/components/toggle-row";
import { SkeletonRows, SkeletonText } from "@/components/skeleton";
import { makeStyles, spacing } from "@/theme";
import { statusLabel } from "@/components/status";
import { api } from "@/services";
import { useCommute, useCommuteWeek } from "@/hooks/data";
import type { Weekday } from "@/data/types";

export default function DriverUnavailable() {
  const styles = useStyles();
  const [selected, setSelected] = useState<Weekday[]>([]);
  const [findCover, setFindCover] = useState(true);
  const { data: commute } = useCommute();
  const { data: week = [], loading } = useCommuteWeek(commute?.id);

  function toggle(day: Weekday) {
    setSelected((s) =>
      s.includes(day) ? s.filter((d) => d !== day) : [...s, day],
    );
  }

  /**
   * The group is told before we navigate, so the days are already marked as
   * uncovered by the time the replacement screen looks for cover.
   */
  async function submit() {
    if (commute) await api.commuteWeek.setUnavailable(commute.id, selected);
    if (findCover) router.replace("/driver/replacement");
    else router.back();
  }

  if (loading) {
    return (
      <>
        <AppBar title="Days you cannot drive" />
        <Screen contentStyle={styles.content}>
          <SkeletonText lines={2} />
          <SkeletonRows rows={5} />
        </Screen>
      </>
    );
  }

  return (
    <>
      <AppBar title="Days you cannot drive" />
      <Screen
        footer={
          <Button
            label={findCover ? "Tell the group and find cover" : "Tell the group"}
            block
            disabled={selected.length === 0}
            onPress={submit}
          />
        }
        contentStyle={styles.content}
      >
        <Text variant="body" tone="secondary">
          Pick the days you are not driving. Everyone in the group is told
          straight away so nobody is left waiting at the pickup point.
        </Text>

        <View style={styles.section}>
          <SectionHeader title="This week" />
          <Card padding="none">
            {week.map((entry, index) => (
              <ToggleRow
                key={entry.day}
                label={`${entry.day} ${entry.date}`}
                caption={`Currently ${statusLabel(entry.status).toLowerCase()}`}
                icon="calendar"
                value={selected.includes(entry.day)}
                onChange={() => toggle(entry.day)}
                last={index === week.length - 1}
              />
            ))}
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title="What happens next" />
          <Card padding="none">
            <ToggleRow
              label="Find cover for these days"
              caption="We look for people from your campus on the same route"
              icon="user-plus"
              value={findCover}
              onChange={setFindCover}
              last
            />
          </Card>
        </View>

        <Card tone="inset">
          <Text variant="bodySmall" tone="secondary">
            Passengers keep their recurring seat for every other day. Telling
            people early is what keeps a commute group together.
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
}));
