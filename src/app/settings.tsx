import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { ListRow } from "@/components/list-row";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Sheet } from "@/components/sheet";
import { ToggleRow } from "@/components/toggle-row";
import { useMe } from "@/hooks/data";
import { makeStyles, spacing, useTheme } from "@/theme";
import { api } from "@/services";
import { releasePushToken } from "@/hooks/use-push-notifications";
import { areaName } from "@/data/areas";
import { communityLabel } from "@/data/institutions";

const badgeCopy: Record<string, string> = {
  none: "Not verified",
  pending: "In review",
  approved: "Verified",
  rejected: "Needs attention",
};

const themeCopy = {
  system: "Match my phone",
  light: "Light",
  dark: "Dark",
} as const;

export default function Settings() {
  const styles = useStyles();
  const { mode } = useTheme();
  const { data: me } = useMe();

  const [rideReminders, setRideReminders] = useState(true);
  const [commuteChanges, setCommuteChanges] = useState(true);
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [hideArea, setHideArea] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function logout() {
    // Hand the push token back first. A phone gets passed around, and leaving
    // it registered means the previous account keeps being notified on a
    // device that is no longer theirs.
    await releasePushToken();

    // Clears the session and anything cached against it. The onboarding flag
    // deliberately survives: the intro is about the product, not the account.
    await api.auth.logout();
    setConfirmLogout(false);
    router.replace("/(auth)/login");
  }

  return (
    <>
      <AppBar title="Settings" />
      <Screen contentStyle={styles.content}>
        <View style={styles.section}>
          <SectionHeader title="Account" />
          <Card padding="none">
            <ListRow
              label="Edit profile"
              value={me?.name}
              icon="user"
              onPress={() => router.push("/profile-edit")}
            />
            <ListRow
              label="My institutions"
              value={
                me ? communityLabel(me.institutionId, me.campusId) : undefined
              }
              icon="award"
              onPress={() => router.push("/institutions")}
            />
            <ListRow
              label="Where you live"
              value={me ? areaName(me.areaId) : undefined}
              icon="map-pin"
              last
              onPress={() => router.push("/profile-edit")}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Commute" />
          <Card padding="none">
            <ListRow
              label="My commute"
              icon="repeat"
              onPress={() => router.push("/(tabs)/commute")}
            />
            <ListRow
              label="Days and times"
              icon="clock"
              onPress={() => router.push("/commute/create")}
            />
            <ListRow
              label="Offer seats"
              icon="plus-circle"
              onPress={() => router.push("/driver/offer")}
            />
            <ListRow
              label="Matching preferences"
              icon="sliders"
              last
              onPress={() => router.push("/preferences")}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Vehicles" />
          <Card padding="none">
            <ListRow
              label="My vehicles"
              icon="truck"
              last
              onPress={() => router.push("/vehicles")}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Verification"
            caption="Optional. Your institution email already verified your account."
          />
          <Card padding="none">
            <ListRow
              label="Verified badge"
              value={me ? badgeCopy[me.badgeStatus] : undefined}
              icon="shield"
              last
              onPress={() => router.push("/verification")}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Notifications" />
          <Card padding="none">
            <ToggleRow
              label="Ride reminders"
              caption="Twenty minutes before each departure"
              icon="clock"
              value={rideReminders}
              onChange={setRideReminders}
            />
            <ToggleRow
              label="Changes to my commute"
              caption="Driver cancellations and replacement matches"
              icon="repeat"
              value={commuteChanges}
              onChange={setCommuteChanges}
            />
            <ToggleRow
              label="New matches"
              caption="When someone from your campus matches your commute"
              icon="users"
              value={matchAlerts}
              onChange={setMatchAlerts}
              last
            />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Appearance" />
          <Card padding="none">
            <ListRow
              label="Theme"
              value={themeCopy[mode]}
              icon="moon"
              last
              onPress={() => router.push("/appearance")}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Privacy"
            caption="Your exact address is never collected or shown."
          />
          <Card padding="none">
            <ToggleRow
              label="Hide my area until booking"
              caption="Show only the general district before a seat is confirmed"
              icon="eye-off"
              value={hideArea}
              onChange={setHideArea}
            />
            <ListRow
              label="Blocked people"
              icon="slash"
              last
              onPress={() => router.push("/blocked")}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Help" />
          <Card padding="none">
            <ListRow
              label="Request an institution"
              icon="plus-square"
              onPress={() => router.push("/(auth)/request-institution")}
            />
            <ListRow
              label="Help and support"
              icon="help-circle"
              onPress={() => router.push("/help")}
            />
            <ListRow
              label="Terms of service"
              icon="file-text"
              onPress={() => router.push("/legal/terms")}
            />
            <ListRow
              label="Privacy policy"
              icon="lock"
              last
              onPress={() => router.push("/legal/privacy")}
            />
          </Card>
        </View>

        {/* Development only: never rendered in a production build. */}
        {__DEV__ ? (
          <View style={styles.section}>
            <SectionHeader title="Development" />
            <Card padding="none">
              <ListRow
                label="Mock scenarios"
                icon="tool"
                last
                onPress={() => router.push("/dev-scenarios")}
              />
            </Card>
          </View>
        ) : null}

        <Card padding="none">
          <ListRow
            label="Log out"
            icon="log-out"
            onPress={() => setConfirmLogout(true)}
          />
          <ListRow
            label="Delete account"
            icon="trash-2"
            destructive
            last
            onPress={() => setConfirmDelete(true)}
          />
        </Card>
      </Screen>

      <Sheet
        visible={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Log out?"
        caption="Your commute and matches stay exactly as they are. You will need your password to sign back in."
      >
        <View style={styles.sheetActions}>
          <Button label="Log out" variant="destructive" block onPress={logout} />
          <Button
            label="Stay signed in"
            variant="tertiary"
            block
            onPress={() => setConfirmLogout(false)}
          />
        </View>
      </Sheet>

      <Sheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete your account?"
        caption="Your commute group will be told you have left. This cannot be undone."
      >
        <View style={styles.sheetActions}>
          <Button
            label="Delete my account"
            variant="destructive"
            block
            onPress={() => setConfirmDelete(false)}
          />
          <Button
            label="Keep my account"
            variant="tertiary"
            block
            onPress={() => setConfirmDelete(false)}
          />
        </View>
      </Sheet>
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
  sheetActions: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
}));
