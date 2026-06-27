import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScreenLoader } from "@/components/Loader";
import colors from "@/constants/colors";
import { fonts } from "@/constants/theme";
import { AuthProvider } from "@/contexts/AuthContext";
import { initializeRevenueCat, SubscriptionProvider } from "@/lib/revenuecat";

SplashScreen.preventAutoHideAsync();

// Configure the in-app purchase SDK once at startup. In Expo Go / web the
// native module is absent, so this fails softly and purchases degrade to a
// "not available in this build" state rather than crashing the app.
try {
  initializeRevenueCat();
} catch (err) {
  console.warn(
    "[pdf-convert-mobile] RevenueCat unavailable:",
    err instanceof Error ? err.message : String(err),
  );
}

const queryClient = new QueryClient();
const C = colors.light;

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: C.background },
        headerTitleStyle: { fontFamily: fonts.headingSemibold, color: C.foreground, fontSize: 17 },
        headerTintColor: C.primary,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: C.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Tool flow + editors (custom in-screen headers) */}
      <Stack.Screen name="convert/[toolId]" options={{ headerShown: false }} />
      <Stack.Screen name="editor/pdf" options={{ headerShown: false }} />
      <Stack.Screen name="editor/image" options={{ headerShown: false }} />

      {/* History */}
      <Stack.Screen name="history" options={{ title: "History" }} />

      {/* Auth — popup over the current screen */}
      <Stack.Screen name="auth/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="auth/sign-in"
        options={{
          headerShown: false,
          presentation: "transparentModal",
          animation: "fade",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="auth/sign-up"
        options={{
          headerShown: false,
          presentation: "transparentModal",
          animation: "fade",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen name="auth/forgot-password" options={{ title: "Reset Password" }} />
      <Stack.Screen name="auth/reset-password" options={{ title: "Reset Password" }} />

      {/* Account */}
      <Stack.Screen name="account/profile" options={{ title: "Profile Settings" }} />

      {/* Marketing / legal */}
      <Stack.Screen name="marketing/pricing" options={{ title: "Pricing" }} />
      <Stack.Screen name="marketing/about" options={{ title: "About" }} />
      <Stack.Screen name="marketing/features" options={{ title: "Features" }} />
      <Stack.Screen name="marketing/learn-more" options={{ title: "How It Works" }} />
      <Stack.Screen name="marketing/support" options={{ title: "Support" }} />
      <Stack.Screen name="marketing/contact" options={{ title: "Contact" }} />
      <Stack.Screen name="marketing/terms" options={{ title: "Terms of Service" }} />
      <Stack.Screen name="marketing/privacy" options={{ title: "Privacy Policy" }} />

      {/* Dashboard suite */}
      <Stack.Screen name="dashboard/index" options={{ title: "Workspace" }} />
      <Stack.Screen name="dashboard/usage" options={{ title: "Usage Statistics" }} />
      <Stack.Screen name="dashboard/api-setup" options={{ title: "API Setup" }} />
      <Stack.Screen name="dashboard/api-reference" options={{ title: "API Reference" }} />
      <Stack.Screen name="dashboard/manage-plans" options={{ title: "Manage Plans" }} />
      <Stack.Screen name="dashboard/credits" options={{ title: "My Credits" }} />
      <Stack.Screen name="dashboard/live-tools" options={{ title: "Live Tools" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    // Icon glyph fonts. Loading them here (instead of relying on the lazy
    // self-load in @expo/vector-icons) guarantees the TTFs are ready before the
    // first render — otherwise Feather/Ionicons icons render as blank boxes on
    // Android while JS-driven Lottie animations are unaffected.
    ...Feather.font,
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <SafeAreaProvider>
        <ScreenLoader />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <SubscriptionProvider>
                  <RootLayoutNav />
                </SubscriptionProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
