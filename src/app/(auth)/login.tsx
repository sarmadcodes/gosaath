import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { Wordmark } from "@/components/wordmark";
import { makeStyles, spacing, useTheme } from "@/theme";
import { api } from "@/services";
import { institutionById, launchInstitution } from "@/data/institutions";

export default function Login() {
  const styles = useStyles();
  const { setBrandColor } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const valid = /^\S+@\S+\.\S+$/.test(email) && password.length > 0;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const session = await api.auth.login(email.trim(), password);
      const institution = institutionById(session.user.institutionId);
      if (institution) setBrandColor(institution.brandColor);
      router.replace("/(tabs)");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not sign you in. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPassword() {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter your email first and we will send a reset link.");
      return;
    }
    await api.auth.requestPasswordReset(email.trim());
    setResetSent(true);
  }

  return (
    <>
      <AppBar title="Log in" />
      <Screen
        footer={
          <>
            <Button
              label="Log in"
              block
              loading={submitting}
              disabled={!valid}
              onPress={submit}
            />
            <Button
              label="Create an account"
              variant="tertiary"
              block
              onPress={() => router.replace("/(auth)/user-type")}
            />
          </>
        }
        contentStyle={styles.content}
      >
        <View style={styles.brand}>
          <Wordmark size="sm" />
        </View>

        <Text variant="body" tone="secondary">
          Sign in with the institution email you registered with.
        </Text>

        <Card padding="regular">
          <View style={styles.fields}>
            <Input
              label="Institution email"
              icon="mail"
              placeholder={`you@${launchInstitution?.emailDomains[0] ?? "institution.edu.pk"}`}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Input
              label="Password"
              icon="lock"
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={resetPassword}
            hitSlop={8}
            style={styles.forgot}
          >
            <Text variant="button" tone="brand">
              Forgot your password?
            </Text>
          </Pressable>
        </Card>

        {resetSent ? (
          <Text variant="bodySmall" tone="success">
            If that email has an account, a reset link is on its way.
          </Text>
        ) : null}

        {error ? (
          <Text variant="bodySmall" tone="error">
            {error}
          </Text>
        ) : null}
      </Screen>
    </>
  );
}

const useStyles = makeStyles(() => ({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  brand: {
    alignItems: "flex-start",
  },
  fields: {
    gap: spacing.lg,
  },
  forgot: {
    marginTop: spacing.base,
    minHeight: 36,
    justifyContent: "center",
  },
}));
