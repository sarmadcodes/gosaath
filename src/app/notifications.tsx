import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing, useColors } from "@/theme";
import type { Palette } from "@/theme";
import { SkeletonPerson } from "@/components/skeleton";
import { api } from "@/services";
import { useNotifications } from "@/hooks/data";
import type { AppNotification, NotificationKind } from "@/data/types";

const marks: Record<
  NotificationKind,
  { icon: keyof typeof Feather.glyphMap; fg: keyof Palette; bg: keyof Palette }
> = {
  seatRequest: { icon: "user-plus", fg: "brand", bg: "brandSecondary" },
  requestAccepted: { icon: "check-circle", fg: "success", bg: "successBg" },
  requestDeclined: {
    icon: "x-circle",
    fg: "textSecondary",
    bg: "surfaceSecondary",
  },
  tomorrowCommute: { icon: "sunrise", fg: "brand", bg: "brandSecondary" },
  driverUnavailable: { icon: "alert-triangle", fg: "warning", bg: "warningBg" },
  replacementAvailable: { icon: "users", fg: "info", bg: "infoBg" },
  rideReminder: { icon: "clock", fg: "brand", bg: "brandSecondary" },
  cancellation: { icon: "x-octagon", fg: "error", bg: "errorBg" },
  badgeUpdate: { icon: "shield", fg: "success", bg: "successBg" },
  institutionApproved: { icon: "award", fg: "success", bg: "successBg" },
};

const destinations: Partial<Record<NotificationKind, string>> = {
  seatRequest: "/(tabs)/rides?tab=requests",
  driverUnavailable: "/driver/replacement",
  replacementAvailable: "/driver/replacement",
};

export default function Notifications() {
  const styles = useStyles();
  const { data: items = [], loading, error, reload, set } = useNotifications();

  function open(item: AppNotification, href?: string) {
    if (item.unread) {
      set(items.map((n) => (n.id === item.id ? { ...n, unread: false } : n)));
      api.notifications.markRead(item.id);
    }
    if (href) router.push(href as never);
  }

  return (
    <>
      <AppBar title="Notifications" />
      <Screen contentStyle={styles.content}>
        {error ? (
          <ErrorState onRetry={reload} />
        ) : loading ? (
          <View style={styles.list}>
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <SkeletonPerson size={36} />
              </Card>
            ))}
          </View>
        ) : items.length === 0 ? (
          <EmptyState
            icon="bell"
            title="You're all caught up"
            body="Ride updates and commute reminders will appear here."
          />
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <NotificationRow key={item.id} item={item} onOpen={open} />
            ))}
          </View>
        )}
      </Screen>
    </>
  );
}

function NotificationRow({
  item,
  onOpen,
}: {
  item: AppNotification;
  onOpen: (item: AppNotification, href?: string) => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const mark = marks[item.kind];
  const href = destinations[item.kind];

  return (
    <Card onPress={() => onOpen(item, href)}>
      <View style={styles.row}>
        <View style={[styles.mark, { backgroundColor: colors[mark.bg] }]}>
          <Feather name={mark.icon} size={16} color={colors[mark.fg]} />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text variant="h4" style={styles.flex}>
              {item.title}
            </Text>
            {item.unread ? <View style={styles.unread} /> : null}
          </View>
          <Text variant="bodySmall" tone="secondary">
            {item.body}
          </Text>
          <Text variant="caption" tone="tertiary">
            {item.time}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const useStyles = makeStyles((c) => ({
  content: {
    gap: spacing.md,
    paddingTop: spacing.base,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  mark: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  unread: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: c.brand,
  },
}));
