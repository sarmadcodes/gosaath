import { Stack } from "expo-router";
import { SignupProvider } from "@/state/signup";
import { useColors } from "@/theme";

export default function AuthLayout() {
  const colors = useColors();

  return (
    <SignupProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      />
    </SignupProvider>
  );
}
