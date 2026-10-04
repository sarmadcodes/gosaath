import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { makeStyles, MIN_TOUCH_TARGET, radius, spacing, useColors } from "@/theme";
import { api } from "@/services";
import { useAsync } from "@/hooks/use-async";

/**
 * Get help.
 *
 * The hardest part of this screen is not the code, it is refusing to overstate
 * what it does. Somebody opening it may be frightened, and a frightened person
 * reads an app generously — "help is on the way" when nothing is on the way is
 * the most dangerous sentence this product could print, because it might stop
 * them dialling 15.
 *
 * So the emergency numbers come first and are the largest thing on the screen.
 * Tapping one hands it to the phone's dialer; the operating system places the
 * call and GoSaath is not part of it. Only below that is the thing GoSaath can
 * actually do, described in the words it is true in: tell the people who run
 * your institution, now, and keep a record.
 *
 * The numbers are fetched rather than written here. A wrong emergency number
 * compiled into a build is wrong for as long as App Store review takes.
 */
export default function GetHelp() {
  const styles = useStyles();
  const colors = useColors();
  // Present when opened from a ride in progress, absent when opened from the
  // tab bar. Either is fine — the server ignores a ride that is not yours
  // rather than refusing the alert.
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();

  const contacts = useAsync(() => api.safety.emergencyContacts(), []);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [raised, setRaised] = useState<{ notified: number } | null>(null);
  const [failed, setFailed] = useState(false);

  async function call(number: string) {
    // The dialer, not an automatic call: nobody should be able to dial an
    // emergency service by brushing a screen in their pocket. The confirm step
    // is the phone's own.
    await Linking.openURL(`tel:${number}`);
  }

  async function raise(kind: "sos" | "feelingUnsafe") {
    setSending(true);
    setFailed(false);
    try {
      const result = await api.safety.raiseAlert({
        kind,
        ...(rideId ? { rideInstanceId: rideId } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setRaised({ notified: result.notified });
    } catch {
      // Said plainly, with the thing that still works repeated. An alert that
      // failed to send must not leave somebody believing it did.
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  const numbers = contacts.data ?? [];

  return (
    <Screen>
      <AppBar title="Get help" onBack={() => router.back()} />

      <View style={styles.body}>
        <Card style={styles.urgent}>
          <Text variant="h3">If you are in danger, call now</Text>
          <Text variant="body" tone="secondary" style={styles.urgentCaption}>
            Your phone makes the call. GoSaath cannot send anyone to you.
          </Text>

          <View style={styles.numbers}>
            {numbers.map((contact) => (
              <Pressable
                key={contact.number}
                onPress={() => void call(contact.number)}
                style={({ pressed }) => [styles.number, pressed && styles.numberPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Call ${contact.label} on ${contact.number}`}
              >
                <Feather name="phone-call" size={20} color={colors.surface} />
                <View style={styles.numberText}>
                  <Text variant="h3" style={{ color: colors.surface }}>
                    {contact.number}
                  </Text>
                  <Text variant="caption" style={{ color: colors.surface }}>
                    {contact.label}
                  </Text>
                </View>
              </Pressable>
            ))}

            {contacts.loading && numbers.length === 0 ? (
              <Text variant="caption" tone="secondary">
                Loading numbers…
              </Text>
            ) : null}

            {contacts.error && numbers.length === 0 ? (
              // The one place a failed fetch cannot simply show an error: the
              // numbers are the point of the screen. These are the national
              // ones and they do not change.
              <Text variant="body" tone="secondary">
                Could not load numbers. Police is 15, Rescue is 1122.
              </Text>
            ) : null}
          </View>
        </Card>

        {raised ? (
          <Card style={styles.done}>
            <Feather name="check-circle" size={22} color={colors.success} />
            <Text variant="h3" style={styles.doneTitle}>
              Your institution has been told
            </Text>
            <Text variant="body" tone="secondary">
              {raised.notified === 1
                ? "One administrator has been notified and can see this now."
                : `${raised.notified} administrators have been notified and can see this now.`}{" "}
              They may contact you. If you are in immediate danger, call the
              numbers above — that is faster than anyone reading this.
            </Text>
          </Card>
        ) : (
          <>
            <Text variant="h3" style={styles.sectionTitle}>
              Tell your institution
            </Text>
            <Text variant="body" tone="secondary" style={styles.sectionCaption}>
              This records what happened and notifies the administrators at your
              university straight away. It does not contact the police.
            </Text>

            <Input
              label="What is happening? (optional)"
              value={note}
              onChangeText={setNote}
              placeholder="Anything that would help them understand"
              multiline
              numberOfLines={3}
              maxLength={2000}
            />

            {failed ? (
              <Text variant="body" tone="error" style={styles.failed}>
                That did not send. Check your connection and try again — and if
                you are in danger, call 15 rather than waiting for this.
              </Text>
            ) : null}

            <Button
              label="I need help now"
              onPress={() => void raise("sos")}
              loading={sending}
              variant="destructive"
              style={styles.action}
            />

            <Button
              label="I feel unsafe"
              onPress={() => void raise("feelingUnsafe")}
              loading={sending}
              variant="secondary"
              style={styles.action}
            />
          </>
        )}

        <Pressable
          onPress={() => router.push("/safety/report")}
          style={styles.reportLink}
          accessibilityRole="button"
        >
          <Feather name="flag" size={16} color={colors.textSecondary} />
          <Text variant="body" tone="secondary">
            Report someone instead
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  urgent: {
    gap: spacing.xs,
  },
  urgentCaption: {
    marginBottom: spacing.sm,
  },
  numbers: {
    gap: spacing.sm,
  },
  number: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET + 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.error,
  },
  numberPressed: {
    opacity: 0.85,
  },
  numberText: {
    gap: 1,
  },
  sectionTitle: {
    marginTop: spacing.sm,
  },
  sectionCaption: {
    marginBottom: spacing.xs,
  },
  action: {
    marginTop: spacing.xs,
  },
  failed: {
    marginTop: spacing.xs,
  },
  done: {
    gap: spacing.xs,
  },
  doneTitle: {
    marginTop: spacing.xs,
  },
  reportLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    marginTop: spacing.sm,
  },
}));
