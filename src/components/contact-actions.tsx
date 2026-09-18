import { Alert, Linking, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Text } from "@/components/text";
import { makeStyles, spacing, useColors } from "@/theme";

export type ContactActionsProps = {
  /** First name, so the buttons name the person rather than "the driver". */
  firstName: string;
  /** Local format, e.g. "0300 1234567". Absent until you are matched. */
  phone?: string;
  /** Shown above the buttons where the screen needs to explain itself. */
  caption?: string;
};

/**
 * Pakistani mobile numbers to the international form WhatsApp expects.
 *
 * 0300 1234567 → 923001234567. Anything already carrying a country code is
 * passed through, so a number stored either way still works.
 */
export function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

async function open(url: string, fallback: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Cannot open", fallback);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert("Cannot open", fallback);
  }
}

/**
 * Call or WhatsApp a person you are matched with.
 *
 * There is no in-app messaging in GoSaath, so arranging the practical details
 * happens on the phone the user already has. WhatsApp is listed first because
 * in Karachi it is the one people actually answer.
 */
export function ContactActions({
  firstName,
  phone,
  caption,
}: ContactActionsProps) {
  const styles = useStyles();
  const colors = useColors();

  if (!phone) return null;

  return (
    <Card padding="regular">
      <View style={styles.headRow}>
        <Feather name="phone" size={16} color={colors.brand} />
        <View style={styles.flex}>
          <Text variant="h4">Contact {firstName}</Text>
          <Text variant="bodySmall" tone="secondary">
            {caption ?? "Sort out the pickup point and timing between you."}
          </Text>
        </View>
      </View>

      <Text variant="bodyLarge" style={styles.number}>
        {phone}
      </Text>

      <View style={styles.actions}>
        <Button
          label="WhatsApp"
          style={styles.flex}
          onPress={() =>
            open(
              `https://wa.me/${toWhatsAppNumber(phone)}`,
              "WhatsApp does not appear to be installed.",
            )
          }
        />
        <Button
          label="Call"
          variant="secondary"
          style={styles.flex}
          onPress={() =>
            open(
              `tel:${phone.replace(/\s/g, "")}`,
              "This device cannot place calls.",
            )
          }
        />
      </View>
    </Card>
  );
}

const useStyles = makeStyles(() => ({
  headRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  number: {
    marginTop: spacing.base,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
}));
