import { useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "@/theme";
import { useInstitutionTheme } from "@/hooks/use-institution-theme";
import { usePushNotifications } from "@/hooks/use-push-notifications";
// Imported for its side effect: the realtime client binds itself to the
// session and to app foreground/background here, so no screen has to start or
// stop it. Named explicitly rather than arriving indirectly through a data
// hook, so removing the last `useAsync` import would not silently take the
// live connection with it.
import "@/services/realtime";

SplashScreen.preventAutoHideAsync();

/**
 * How long the splash is guaranteed to stay up.
 *
 * Fonts load in well under this on a warm start, so without a floor the
 * splash appeared for a frame or two and the app looked like it had glitched
 * rather than launched. A second is long enough to register as deliberate and
 * short enough that nobody is waiting on it.
 */
const MIN_SPLASH_MS = 1000;
const launchedAt = Date.now();

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_600SemiBold,
    Manrope_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const onReady = useCallback(async () => {
    // Holding the native splash until the type ramp is available avoids a
    // flash of system font, which is the first thing that makes an app feel
    // unfinished.
    if (!fontsLoaded && !fontError) return;

    // Measured from launch rather than from here, so a slow start is not
    // punished with an extra second on top of the wait it already had.
    await sleep(Math.max(0, MIN_SPLASH_MS - (Date.now() - launchedAt)));
    await SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <Navigation />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

/**
 * Split out so it sits inside ThemeProvider and can colour the navigator and
 * the status bar from the active theme.
 */
function Navigation() {
  const { colors, scheme } = useTheme();
  useInstitutionTheme();
  usePushNotifications();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="active-ride"
          options={{ animation: "fade", gestureEnabled: false }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
