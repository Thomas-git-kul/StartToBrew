import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

// React Navigation
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavLightTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";

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

// --- Bridge the two theme systems so colors match ---
const { LightTheme: NavAdaptedLight, DarkTheme: NavAdaptedDark } =
  adaptNavigationTheme({
    reactNavigationLight: NavLightTheme,
    reactNavigationDark: NavDarkTheme,
  });

const CombinedLightTheme = merge(PaperLightTheme, NavAdaptedLight);
const CombinedDarkTheme = merge(PaperDarkTheme, NavAdaptedDark);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? CombinedDarkTheme : CombinedLightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationThemeProvider value={theme}>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Start with the tabs folder, which contains HomePage.tsx */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {/* Modal screen */}
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        </NavigationThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
