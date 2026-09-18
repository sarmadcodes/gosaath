import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing, useColors } from "@/theme";
import { useCommute, useMe } from "@/hooks/data";
import { areaName } from "@/data/areas";
import { campusById, institutionById } from "@/data/institutions";
import { describeSchedule } from "@/utils/schedule";

/**
 * The activation moment.
 *
 * Creating a commute is the first thing in this product that actually works,
 * and it is worth one screen of its own rather than dropping the user back
 * onto a dashboard to work out whether it saved. It states what was saved,
 * says what happens next, and offers exactly one way forward.
 */
export default function CommuteReady() {
  const styles = useStyles();
  const colors = useColors();
  const { data: commute } = useCommute();
  const { data: me } = useMe();

  const institution = me
    ? (institutionById(me.institutionId)?.shortName ?? "your campus")
    : "your campus";
  const origin = commute ? areaName(commute.originAreaId) : "";
  const campusName = commute
    ? (campusById(commute.campusId)?.name ?? "")
    : "";

  return (
    <Screen
      footer={
        <>
          <Button
            label="View matches"
            block
            onPress={() => router.replace("/matches")}
          />
          <Button
            label="Go to home"
            variant="tertiary"
            block
            onPress={() => router.replace("/(tabs)")}
          />
        </>
      }
      contentStyle={styles.content}
    >
      <View style={styles.mark}>
        <Feather name="check" size={26} color={colors.success} />
      </View>

      <Text variant="h1" style={styles.centred}>
        Your commute is ready
      </Text>
      <Text variant="bodyLarge" tone="secondary" style={styles.centred}>
        We are looking for {institution} students and faculty whose schedules
        overlap with yours.
      </Text>

      {commute ? (
        <Card padding="regular" style={styles.summary}>
          <View style={styles.row}>
            <Feather name="map-pin" size={14} color={colors.textTertiary} />
            <Text variant="bodySmall" tone="secondary" style={styles.flex}>
              {origin} to {campusName}
            </Text>
          </View>
          <View style={styles.row}>
            <Feather name="clock" size={14} color={colors.textTertiary} />
            <Text variant="bodySmall" tone="secondary" style={styles.flex}>
              {describeSchedule(commute.schedule)}
            </Text>
          </View>
        </Card>
      ) : null}

      <Text variant="bodySmall" tone="tertiary" style={styles.centred}>
        Matching keeps running in the background. We will let you know as soon
        as someone on your route appears.
      </Text>
    </Screen>
  );
}

const useStyles = makeStyles((c) => ({
  content: {
    gap: spacing.sm,
    paddingTop: spacing["2xl"],
    alignItems: "center",
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: c.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  centred: {
    textAlign: "center",
  },
  summary: {
    alignSelf: "stretch",
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
}));
