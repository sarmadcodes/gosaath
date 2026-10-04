import { useCallback, useState } from "react";
import { Share, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { SectionHeader } from "@/components/section-header";
import { Text } from "@/components/text";
import { makeStyles, spacing, useColors } from "@/theme";
import { api } from "@/services";
import { useAsync } from "@/hooks/use-async";

/**
 * Tell someone where you are going.
 *
 * The copy does the important work here. "Share my trip" sounds like live
 * location to anybody who has used a taxi app, and it is not — so the card
 * says what the link actually contains before offering to make one, and says
 * plainly that it does not include where you are. Somebody who sends this to
 * their mother should know exactly what their mother can see.
 *
 * The link is handed to the OS share sheet rather than shown as text to copy.
 * It is a bearer credential: the fewer places it is rendered, the fewer places
 * it is screenshotted or left on a clipboard.
 */
export function TripShare({ rideId }: { rideId: string }) {
  const styles = useStyles();
  const colors = useColors();
  const { data: status, loading, reload } = useAsync(
    () => api.tripShare.status(rideId),
    [rideId],
  );
  const [busy, setBusy] = useState(false);

  const create = useCallback(async () => {
    setBusy(true);
    try {
      const { url } = await api.tripShare.share(rideId);
      // Straight into the share sheet. The token is never rendered on screen
      // and is not returned again by any later request.
      await Share.share({
        message: `I am travelling with GoSaath. You can see this trip here: ${url}`,
      });
      reload();
    } finally {
      setBusy(false);
    }
  }, [rideId, reload]);

  const revoke = useCallback(async () => {
    setBusy(true);
    try {
      await api.tripShare.revoke(rideId);
      reload();
    } finally {
      setBusy(false);
    }
  }, [rideId, reload]);

  const active = status?.active === true;

  return (
    <View style={styles.section}>
      <SectionHeader title="Tell someone" />
      <Card padding="regular">
        {active ? (
          <>
            <View style={styles.row}>
              <Feather name="link" size={16} color={colors.success} />
              <Text variant="bodySmall" style={styles.flex}>
                A link to this trip is active.
              </Text>
            </View>

            <Text variant="caption" tone="tertiary" style={styles.detail}>
              {status!.viewCount === 0
                ? "Nobody has opened it yet."
                : status!.viewCount === 1
                  ? "Opened once."
                  : `Opened ${status!.viewCount} times.`}{" "}
              It stops working on its own after the journey.
            </Text>

            <Button
              label="Stop sharing"
              variant="secondary"
              size="compact"
              loading={busy}
              onPress={() => void revoke()}
              style={styles.action}
            />
          </>
        ) : (
          <>
            <Text variant="bodySmall" tone="secondary">
              Send someone a link showing the day, the times, your campus, the
              area you travel from, your driver's first name and their number
              plate — so they would notice if you had not arrived.
            </Text>

            <Text variant="caption" tone="tertiary" style={styles.detail}>
              It does not show where you are. GoSaath never tracks your
              location. The link expires after the journey, and you can stop it
              at any time.
            </Text>

            <Button
              label="Share this trip"
              variant="secondary"
              size="compact"
              loading={busy || loading}
              onPress={() => void create()}
              style={styles.action}
            />
          </>
        )}
      </Card>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  section: {
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
  detail: {
    marginTop: spacing.xs,
  },
  action: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
}));
