import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { makeStyles, useColors, useTheme } from "@/theme";
import { api } from "@/services";
import { hasSeenOnboarding } from "@/services/storage";
import { institutionById } from "@/data/institutions";

type Destination = "loading" | "onboarding" | "login" | "app";

/**
 * Entry gate. Three outcomes, in order of precedence:
 * a live session goes straight to the app, a returning user who has already
 * seen the intro goes to login, and everyone else gets the intro.
 */
export default function Index() {
  const styles = useStyles();
  const colors = useColors();
  const { setBrandColor } = useTheme();
  const [destination, setDestination] = useState<Destination>("loading");

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const [session, seen] = await Promise.all([
        api.auth.restore(),
        hasSeenOnboarding(),
      ]);
      if (cancelled) return;

      // Restore the institution accent before the first screen paints, so a
      // returning user never sees a flash of the default teal.
      if (session) {
        const institution = institutionById(session.user.institutionId);
        if (institution) setBrandColor(institution.brandColor);
      }

      setDestination(session ? "app" : seen ? "login" : "onboarding");
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [setBrandColor]);

  if (destination === "loading") {
    return (
      <View style={styles.root}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (destination === "app") return <Redirect href="/(tabs)" />;
  if (destination === "login") return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(auth)/onboarding" />;
}

const useStyles = makeStyles((c) => ({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.background,
  },
}));
