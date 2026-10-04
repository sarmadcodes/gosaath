import { useState } from "react";
import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Text } from "@/components/text";
import { makeStyles, MIN_TOUCH_TARGET, radius, spacing, useColors } from "@/theme";
import { api } from "@/services";
import { ApiError } from "@/services/http";

const REASONS = [
  {
    value: "unsafe-driving",
    label: "Unsafe driving",
    caption: "Speeding, using a phone, ignoring traffic rules",
  },
  {
    value: "behaviour",
    label: "Inappropriate behaviour",
    caption: "Comments or conduct that made you uncomfortable",
  },
  {
    value: "harassment",
    label: "Harassment",
    caption: "Unwanted contact, threats or intimidation",
  },
  {
    value: "fake-profile",
    label: "Not who they said they were",
    caption: "The person or vehicle did not match the listing",
  },
  {
    value: "route",
    label: "Route or pickup issue",
    caption: "Did not arrive, or changed the route without agreement",
  },
  { value: "other", label: "Something else", caption: "Tell us what happened" },
];

export default function Report() {
  const styles = useStyles();
  const colors = useColors();
  // Optional: the screen is also reachable from the tab bar with nobody in
  // particular to report, in which case the team triages from the detail.
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  async function send() {
    if (!reason) return;
    setSending(true);
    setFailed(null);
    try {
      await api.safety.report({
        reportedUserId: userId,
        category: reason,
        detail: detail.trim() || undefined,
      });
      setSent(true);
    } catch (error) {
      // Previously a bare try/finally with no catch: a failed report left the
      // spinner stopping and nothing else happening, so somebody who had just
      // described something that frightened them could not tell whether
      // anybody had received it. Of everything in this app, that is the worst
      // place to fail quietly.
      setFailed(
        (error instanceof ApiError ? error.fieldMessage : null) ??
          (error instanceof Error
            ? error.message
            : "We could not send that report."),
      );
    } finally {
      setSending(false);
    }
  }

  async function block() {
    if (userId) await api.safety.block(userId);
    router.dismissTo("/(tabs)");
  }

  if (sent) {
    return (
      <>
        <AppBar title="Report received" showBack={false} />
        <Screen
          footer={
            <Button label="Done" block onPress={() => router.dismissTo("/(tabs)")} />
          }
          contentStyle={styles.content}
        >
          <View style={styles.doneMark}>
            <Feather name="check" size={26} color={colors.success} />
          </View>
          <Text variant="h2" style={styles.centred}>
            Thank you for telling us
          </Text>
          <Text variant="bodyLarge" tone="secondary" style={styles.centred}>
            Our team reviews every report. We will not tell the other person
            that you reported them.
          </Text>
          <Card tone="inset" style={styles.blockCard}>
            <Text variant="h4">Block this person?</Text>
            <Text variant="bodySmall" tone="secondary" style={styles.spacer}>
              You will not be matched with them again.
            </Text>
            <Button
              label="Block"
              variant="secondary"
              size="compact"
              style={styles.blockButton}
              onPress={block}
            />
          </Card>
        </Screen>
      </>
    );
  }

  return (
    <>
      <AppBar title="Report a problem" />
      <Screen
        footer={
          <Button
            label="Send report"
            block
            disabled={!reason}
            loading={sending}
            onPress={send}
          />
        }
        contentStyle={styles.content}
      >
        {/* Calm and specific. Someone opening this screen may be shaken, so
            the copy stays plain and the categories are concrete. */}
        <Text variant="body" tone="secondary">
          Tell us what happened. Reports are confidential and reviewed by our
          team.
        </Text>

        {failed ? (
          <Text variant="body" tone="error">
            {failed} Nothing has been sent — please try again.
          </Text>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="What went wrong" />
          <Card padding="none">
            {REASONS.map((item, index) => {
              const selected = reason === item.value;
              return (
                <Pressable
                  key={item.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${item.label}. ${item.caption}`}
                  onPress={() => setReason(item.value)}
                  style={[
                    styles.reasonRow,
                    index !== REASONS.length - 1 && styles.divider,
                  ]}
                >
                  <View style={styles.reasonCopy}>
                    <Text variant="bodyLarge">{item.label}</Text>
                    <Text variant="bodySmall" tone="tertiary">
                      {item.caption}
                    </Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? (
                      <Feather name="check" size={13} color={colors.onBrand} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Details" />
          <Card padding="regular">
            <Input
              label="What happened"
              placeholder="Add anything that helps us understand"
              value={detail}
              onChangeText={setDetail}
              multiline
              numberOfLines={4}
              hint="Optional, but it helps us act faster."
            />
          </Card>
        </View>

        <Card tone="inset">
          <View style={styles.urgentRow}>
            <Feather name="phone-call" size={16} color={colors.error} />
            <Text variant="bodySmall" tone="secondary" style={styles.flex}>
              If you are in immediate danger, call 15 first.
            </Text>
          </View>
        </Card>
      </Screen>
    </>
  );
}

const useStyles = makeStyles((c) => ({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.base,
  },
  section: {
    gap: spacing.md,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    minHeight: MIN_TOUCH_TARGET + 14,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  reasonCopy: {
    flex: 1,
    gap: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    backgroundColor: c.brand,
    borderColor: c.brand,
  },
  urgentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  doneMark: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: c.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing["2xl"],
    marginBottom: spacing.sm,
  },
  centred: {
    textAlign: "center",
  },
  blockCard: {
    marginTop: spacing.lg,
  },
  spacer: {
    marginTop: spacing.xs,
  },
  blockButton: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
  },
}));
