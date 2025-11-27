import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { BASE_COLORS } from "@/constants/Colors";

// React Navigation
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavLightTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";

import { FavoritesProvider } from "@/context/FavoritesContext";

// React Native Paper (MD3)
import {
  MD3DarkTheme as PaperDarkTheme,
  MD3LightTheme as PaperLightTheme,
  PaperProvider,
  adaptNavigationTheme,
} from "react-native-paper";

// Useful to merge Paper + Navigation themes
import merge from "deepmerge";

// (optional but recommended)
import { SafeAreaProvider } from "react-native-safe-area-context";

// NIEUW: user progress context + level up modal
import {
  UserProgressProvider,
  useUserProgressContext,
} from "@/context/UserProgressContext";
import { LevelUpModal } from "@/components/LevelUpModal";

// --- Bridge the two theme systems so colors match ---
const { LightTheme: NavAdaptedLight, DarkTheme: NavAdaptedDark } =
  adaptNavigationTheme({
    reactNavigationLight: NavLightTheme,
    reactNavigationDark: NavDarkTheme,
  });

const CombinedLightTheme = merge(PaperLightTheme, NavAdaptedLight);
const CombinedDarkTheme = merge(PaperDarkTheme, NavAdaptedDark);

// Inner component zodat we de context kunnen gebruiken
function RootInner() {
  const { levelUp, acknowledgeLevelUp } = useUserProgressContext();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>

      {levelUp && (
        <LevelUpModal
          visible
          from={levelUp.from}
          to={levelUp.to}
          onClose={acknowledgeLevelUp}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? CombinedDarkTheme : CombinedLightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationThemeProvider value={theme}>
          <UserProgressProvider>
            <FavoritesProvider>
              <RootInner />
            </FavoritesProvider>
          </UserProgressProvider>
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        </NavigationThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
