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

SplashScreen.preventAutoHideAsync();

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
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
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
