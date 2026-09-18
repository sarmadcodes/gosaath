import { useState } from "react";
import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Text } from "@/components/text";
import { makeStyles, MIN_TOUCH_TARGET, radius, spacing, useColors } from "@/theme";
import { api } from "@/services";
import { useMe } from "@/hooks/data";

const CATEGORIES = [
  {
    value: "account",
    label: "My account",
    caption: "Sign-in, email, verification badge",
  },
  {
    value: "commute",
    label: "My commute or matches",
    caption: "Days, times, or who I am being shown",
  },
  {
    value: "ride",
    label: "A ride or a request",
    caption: "Something went wrong with a seat",
  },
  {
    value: "payment",
    label: "Shared cost",
    caption: "A disagreement about what was owed",
  },
  {
    value: "bug",
    label: "Something is broken",
    caption: "The app did not behave as expected",
  },
  {
    value: "other",
    label: "Something else",
    caption: "Anything not covered above",
  },
];

/**
 * Support, not safety.
 *
 * Anything about a *person* belongs in `safety/report`, which goes to
 * moderation and is handled differently. This screen is for the product, and
 * it says so — otherwise a genuine safety report arrives in the same queue as
 * "I forgot my password" and waits behind it.
 */
export default function Help() {
  const styles = useStyles();
  const colors = useColors();
  const { data: me } = useMe();

  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const valid = !!category && message.trim().length >= 10;

  async function submit() {
    if (!category) return;
    setSending(true);
    setError(null);
    try {
      const result = await api.support.submit({
        category,
        message: message.trim(),
        email: me?.email ?? "",
      });
      setReference(result.reference);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not send that. Try again.",
      );
    } finally {
      setSending(false);
    }
  }

  if (reference) {
    return (
      <>
        <AppBar title="Complaint received" showBack={false} />
        <Screen
          footer={
            <Button label="Done" block onPress={() => router.back()} />
          }
          contentStyle={styles.content}
        >
          <View style={styles.doneMark}>
            <Feather name="check" size={26} color={colors.success} />
          </View>
          <Text variant="h2" style={styles.centred}>
            Thanks, we have it
          </Text>
          <Text variant="bodyLarge" tone="secondary" style={styles.centred}>
            We reply by email, usually within two working days.
          </Text>

          <Card padding="regular" style={styles.referenceCard}>
            <Text variant="caption" tone="tertiary" uppercase>
              Your reference
            </Text>
            <Text variant="h2" style={styles.reference}>
              {reference}
            </Text>
            <Text variant="bodySmall" tone="secondary">
              Quote this if you write to us again about the same thing.
            </Text>
          </Card>
        </Screen>
      </>
    );
  }

  return (
    <>
      <AppBar title="Help and support" />
      <Screen
        footer={
          <>
            <Button
              label="Send complaint"
              block
              loading={sending}
              disabled={!valid}
              onPress={submit}
            />
            {error ? (
              <Text variant="bodySmall" tone="error" style={styles.centred}>
                {error}
              </Text>
            ) : (
              <Text variant="caption" tone="tertiary" style={styles.centred}>
                We reply to {me?.email ?? "your institution email"}.
              </Text>
            )}
          </>
        }
        contentStyle={styles.content}
      >
        <Text variant="body" tone="secondary">
          Tell us what went wrong and we will look into it.
        </Text>

        {/* Routed away deliberately: a report about a person needs moderation
            and a block, not a support reply. */}
        <Card tone="inset">
          <View style={styles.noteRow}>
            <Feather name="shield" size={16} color={colors.textSecondary} />
            <View style={styles.flex}>
              <Text variant="h4">Is this about a person?</Text>
              <Text variant="bodySmall" tone="secondary" style={styles.spacer}>
                If someone made you uncomfortable or behaved unsafely, report
                them instead. That goes straight to our safety team.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/safety/report")}
                hitSlop={8}
                style={styles.link}
              >
                <Text variant="button" tone="brand">
                  Report a person
                </Text>
                <Feather name="arrow-right" size={16} color={colors.brand} />
              </Pressable>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <SectionHeader title="What is this about?" />
          <Card padding="none">
            {CATEGORIES.map((item, index) => {
              const selected = category === item.value;
              return (
                <Pressable
                  key={item.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${item.label}. ${item.caption}`}
                  onPress={() => setCategory(item.value)}
                  style={[
                    styles.row,
                    index !== CATEGORIES.length - 1 && styles.divider,
                  ]}
                >
                  <View style={styles.flex}>
                    <Text variant="bodyLarge">{item.label}</Text>
                    <Text variant="bodySmall" tone="tertiary">
                      {item.caption}
                    </Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioOn]}>
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
          <SectionHeader title="What happened?" />
          <Card padding="regular">
            <Input
              label="Your complaint"
              placeholder="Tell us what happened, and what you expected instead"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              hint={
                message.trim().length > 0 && message.trim().length < 10
                  ? "A little more detail helps us act on it."
                  : "Include dates or days where it helps."
              }
            />
          </Card>
        </View>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    minHeight: MIN_TOUCH_TARGET + 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
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
  radioOn: {
    backgroundColor: c.brand,
    borderColor: c.brand,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  spacer: {
    marginTop: spacing.xs,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm - 2,
    marginTop: spacing.md,
    minHeight: 32,
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
  referenceCard: {
    alignSelf: "stretch",
    marginTop: spacing.lg,
  },
  reference: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
}));
