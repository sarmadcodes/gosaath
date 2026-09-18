import { useEffect, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing, type } from "@/theme";
import { api } from "@/services";

const LENGTH = 6;
const RESEND_SECONDS = 45;

export default function Otp() {
  const styles = useStyles();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  async function verify() {
    if (!email) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.auth.verifyEmailOtp(email, code);
      // Account is live from here. The remaining two steps shape the commute
      // rather than the account, so they sit after verification.
      router.replace("/(auth)/intent");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "That code is not right. Check and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const complete = code.length === LENGTH;

  return (
    <>
      <AppBar title="Confirm your email" />
      <Screen
        footer={
          <Button
            label="Verify"
            block
            loading={submitting}
            disabled={!complete}
            onPress={verify}
          />
        }
        contentStyle={styles.content}
      >
        <Text variant="body" tone="secondary">
          We sent a six digit code to {email ?? "your institution email"}.
          Confirming it is what verifies you belong to your institution.
        </Text>

        {/* One hidden field drives six boxes. Typing, pasting and autofill all
            behave normally, which per-box inputs tend to break. */}
        <Pressable onPress={() => inputRef.current?.focus()} style={styles.boxes}>
          {Array.from({ length: LENGTH }).map((_, index) => {
            const char = code[index];
            const active = index === code.length;
            return (
              <View
                key={index}
                style={[
                  styles.box,
                  active && styles.boxActive,
                  error ? styles.boxError : null,
                ]}
              >
                <Text variant="h2">{char ?? ""}</Text>
              </View>
            );
          })}
        </Pressable>

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(next) => {
            setError(null);
            setCode(next.replace(/\D/g, "").slice(0, LENGTH));
          }}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          autoFocus
          maxLength={LENGTH}
          style={styles.hiddenInput}
          accessibilityLabel="Six digit confirmation code"
        />

        {error ? (
          <Text variant="bodySmall" tone="error">
            {error}
          </Text>
        ) : null}

        <View style={styles.resendRow}>
          {seconds > 0 ? (
            <Text variant="body" tone="tertiary">
              Resend code in {seconds}s
            </Text>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (email) api.auth.resendOtp(email);
                setSeconds(RESEND_SECONDS);
              }}
              hitSlop={8}
            >
              <Text variant="button" tone="brand">
                Resend code
              </Text>
            </Pressable>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.changeRow}
        >
          <Text variant="button" tone="brand">
            Use a different email
          </Text>
        </Pressable>
      </Screen>
    </>
  );
}

const useStyles = makeStyles((c) => ({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  boxes: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    aspectRatio: 0.82,
    maxHeight: 60,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  boxActive: {
    borderColor: c.brand,
    borderWidth: 1.5,
  },
  boxError: {
    borderColor: c.error,
    borderWidth: 1.5,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 1,
    width: 1,
    ...type.body,
  },
  resendRow: {
    alignItems: "center",
  },
  changeRow: {
    alignItems: "center",
  },
}));
