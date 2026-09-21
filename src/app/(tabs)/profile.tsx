import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { ListRow } from "@/components/list-row";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Text } from "@/components/text";
import { SkeletonBlock } from "@/components/skeleton";
import { makeStyles, radius, spacing } from "@/theme";
import { areaName } from "@/data/areas";
import { communityLabel } from "@/data/institutions";
import { useMe } from "@/hooks/data";
import { api, usingServer } from "@/services";
import { releasePushToken } from "@/hooks/use-push-notifications";
import { bumpSessionEpoch } from "@/services/session-epoch";

/** Dev-only: the two seeded demo accounts (`npm run db:seed:demo`). */
const DEMO_ACCOUNTS = [
  { email: "ayesha.demo@szabist.pk", label: "Ayesha (finding a ride)" },
  { email: "bilal.demo@szabist.pk", label: "Bilal (offering seats)" },
] as const;
const DEMO_PASSWORD = "GoSaathDemo2026";

async function switchTo(email: string) {
  await releasePushToken();
  await api.auth.logout();
  await api.auth.login(email, DEMO_PASSWORD);
  // Unmount every screen and start again from the launch gate, so nothing
  // the previous account loaded survives the switch.
  bumpSessionEpoch();
  router.dismissAll();
  router.replace("/");
}

const badgeCopy: Record<string, string> = {
  none: "Not verified",
  pending: "In review",
  approved: "Verified",
  rejected: "Needs attention",
};

/**
 * Account information only. There is no public profile in this product, so
 * this screen shows nothing that would exist to impress another user: no
 * rating, no ride count, no join date.
 */
export default function ProfileRoute() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  const { data: me, loading, error, reload } = useMe();

  /**
   * Only the identity card needs the account. The menus below are static
   * navigation, so they keep working when the fetch fails — otherwise a bad
   * connection locks the user out of Settings, and out of logging out, which
   * is the one thing that would let them recover.
   */
  const community = me ? communityLabel(me.institutionId, me.campusId) : "";

  return (
    <Screen contentStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}>
      <Text variant="h1">Profile</Text>

      {error ? (
        <Card padding="regular">
          <View style={styles.identityError}>
            <Text variant="h4">We could not load your profile</Text>
            <Text variant="bodySmall" tone="secondary">
              Your account is fine. Check your connection and try again.
            </Text>
            <Button
              label="Try again"
              variant="secondary"
              size="compact"
              style={styles.retry}
              onPress={reload}
            />
          </View>
        </Card>
      ) : loading || !me ? (
        <SkeletonBlock height={132} style={styles.skeletonCard} />
      ) : (
      /* Carries the institution colour, the same surface the Today card
         owns on Home. Who you are and where you study is the one thing on
         this screen worth that weight. */
      <Card tone="brand" padding="regular">
        <View style={styles.identity}>
          <Avatar name={me.name} photoUrl={me.photoUrl} size="xl" onBrand />
          <View style={styles.identityCopy}>
            <Text variant="h2" tone="onBrand" numberOfLines={2}>
              {me.name}
            </Text>
            <Text
              variant="body"
              tone="onBrand"
              style={styles.identitySoft}
              numberOfLines={2}
            >
              {community}
            </Text>
            <Text
              variant="bodySmall"
              tone="onBrand"
              style={styles.identityFaint}
              numberOfLines={1}
            >
              {areaName(me.areaId)}
            </Text>
          </View>
        </View>

        {me.badgeStatus === "approved" ? (
          <View style={styles.badges}>
            <Badge kind="verified" onBrand />
          </View>
        ) : null}
      </Card>
      )}

      <View style={styles.section}>
        <SectionHeader title="Account" />
        <Card padding="none">
          <ListRow
            label="Edit profile"
            icon="user"
            onPress={() => router.push("/profile-edit")}
          />
          {/* The identity card above already states the community; repeating
              it here is the same sentence twice on one screen. */}
          <ListRow
            label="My institutions"
            icon="award"
            onPress={() => router.push("/institutions")}
          />
          <ListRow
            label="My vehicles"
            icon="truck"
            onPress={() => router.push("/vehicles")}
          />
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
        <SectionHeader title="Commute" />
        <Card padding="none">
          <ListRow
            label="My commute"
            icon="repeat"
            onPress={() => router.push("/(tabs)/commute")}
          />
          <ListRow
            label="Notifications"
            icon="bell"
            onPress={() => router.push("/notifications")}
          />
          <ListRow
            label="Settings"
            icon="settings"
            last
            onPress={() => router.push("/settings")}
          />
        </Card>
      </View>

      {__DEV__ && usingServer ? (
        <View style={styles.section}>
          <SectionHeader title="Demo accounts" />
          <Card padding="none">
            {DEMO_ACCOUNTS.map((account, i) => (
              <ListRow
                key={account.email}
                label={`Switch to ${account.label}`}
                value={me?.email === account.email ? "Current" : undefined}
                icon="refresh-cw"
                last={i === DEMO_ACCOUNTS.length - 1}
                onPress={
                  me?.email === account.email ? undefined : () => void switchTo(account.email)
                }
              />
            ))}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  content: {
    gap: spacing.lg,
  },
  skeletonCard: {
    borderRadius: radius.lg,
  },
  identityError: {
    gap: spacing.xs,
  },
  retry: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  identityCopy: {
    flex: 1,
    gap: 2,
  },
  identitySoft: {
    opacity: 0.88,
  },
  identityFaint: {
    opacity: 0.72,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  section: {
    gap: spacing.md,
  },
}));
