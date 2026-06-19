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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import colors from "@/constants/colors";
import { fonts } from "@/constants/theme";
import { AuthProvider } from "@/contexts/AuthContext";

SplashScreen.preventAutoHideAsync();

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

      {/* Auth (custom in-screen headers) */}
      <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />

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
      <Stack.Screen name="dashboard/usage" options={{ title: "Usage Statistics" }} />
      <Stack.Screen name="dashboard/api-setup" options={{ title: "API Setup" }} />
      <Stack.Screen name="dashboard/api-reference" options={{ title: "API Reference" }} />
      <Stack.Screen name="dashboard/manage-plans" options={{ title: "Manage Plans" }} />
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
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <RootLayoutNav />
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
