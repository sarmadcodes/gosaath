import { useEffect } from "react";
import { useSessionEpoch } from "@/services/session-epoch";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import Constants from "expo-constants";
import { api } from "@/services";
import type { NotificationKind } from "@/data/types";

/**
 * Where each kind of notification should land when tapped.
 *
 * Kept next to the registration rather than in the notifications screen: a
 * push is opened from outside the app, so the screen that lists them is not
 * involved.
 */
const DESTINATIONS: Partial<Record<NotificationKind, string>> = {
  seatRequest: "/(tabs)/rides?tab=requests",
  requestAccepted: "/(tabs)/rides?tab=requests",
  requestDeclined: "/(tabs)/rides?tab=requests",
  driverUnavailable: "/driver/replacement",
  replacementAvailable: "/driver/replacement",
  tomorrowCommute: "/(tabs)/commute",
  rideReminder: "/(tabs)",
  cancellation: "/(tabs)/commute",
  badgeUpdate: "/verification",
  institutionApproved: "/institutions",
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

async function register() {
  // Simulators cannot receive push, and asking there trains developers to
  // ignore a permission prompt that can never succeed.
  if (!Device.isDevice) return null;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== "granted") {
    // Only ask once. Expo returns the existing answer on later calls, so a
    // user who declined is not prompted again on every launch.
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    // Without a channel, Android silently drops heads-up notifications.
    await Notifications.setNotificationChannelAsync("default", {
      name: "Commute updates",
      importance: Notifications.AndroidImportance.DEFAULT,
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  return token.data;
}

/**
 * The token this device registered, if any.
 *
 * Module scope rather than a ref, because logging out happens on a different
 * screen from the one that registered it and needs to reach the same value.
 */
let currentToken: string | null = null;

/**
 * Hands the token back before signing out.
 *
 * A phone gets passed around. Without this the previous account keeps
 * receiving notifications on a device that is no longer theirs — which is a
 * privacy problem, not just a stale badge.
 *
 * Never throws: failing to unregister must not block somebody from signing
 * out, which is the one action they may be trying urgently.
 */
export async function releasePushToken(): Promise<void> {
  if (!currentToken) return;
  const token = currentToken;
  currentToken = null;
  try {
    await api.notifications.unregisterPushToken(token);
  } catch {
    // The server will retire it on the next failed delivery anyway.
  }
}

/**
 * Registers this device for push and routes taps.
 *
 * Mounted once at the root. Delivery itself is a backend concern — this side
 * only hands over the token and decides where a tap goes.
 */
export function usePushNotifications() {
  // Re-registers for whoever is signed in after an account switch.
  const epoch = useSessionEpoch();
  useEffect(() => {
    let cancelled = false;

    register()
      .then(async (next) => {
        if (cancelled || !next) return;
        currentToken = next;
        await api.notifications.registerPushToken(
          next,
          Platform.OS === "ios" ? "ios" : "android",
        );
      })
      .catch(() => {
        // Push is an enhancement. Never let it block the app starting.
      });

    // Opened from a notification, whether the app was backgrounded or cold.
    const tapped = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data ?? {};

        // The server's destination wins. It sends one with every push, and
        // deciding here as well would be a second mapping free to drift from
        // it — a notification kind added on the server would then open
        // nothing, silently, on every phone until the app shipped again.
        //
        // The local table stays as a fallback, for a push queued by an older
        // build before `href` was sent.
        const sent = typeof data["href"] === "string" ? data["href"] : undefined;
        const kind = data["kind"] as NotificationKind | undefined;
        const href = sent ?? (kind ? DESTINATIONS[kind] : undefined);

        if (href) router.push(href as never);
      },
    );

    return () => {
      cancelled = true;
      tapped.remove();
    };
  }, [epoch]);
}
