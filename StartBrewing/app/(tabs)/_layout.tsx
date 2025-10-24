import { Tabs } from "expo-router";
import "../../global.css"; 

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { BASE_COLORS } from "@/constants/Colors"; 
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: BASE_COLORS.LIGHT_BG,
        },
      }}
    >
      {/* Home Page Tab */}
      <Tabs.Screen
        name="HomePage"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={BASE_COLORS.TEXT_DARK} />
          ),
        }}
      />

      {/* Agenda Tab */}
      <Tabs.Screen
        name="Agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar" color={BASE_COLORS.TEXT_DARK} />
          ),
        }}
      />

      {/* Store Tab */}
      <Tabs.Screen
        name="Store"
        options={{
          title: "Store",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="cart.fill" color={BASE_COLORS.TEXT_DARK} />
          ),
        }}
      />

      {/* Recipes Tab */}
      <Tabs.Screen
        name="Recipes"
        options={{
          title: "Recipes",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="book.fill" color={BASE_COLORS.TEXT_DARK} />
          ),
        }}
      />
    {/* Auth Tab */}
      <Tabs.Screen
        name="Auth"
        options={{
          title: "Auth",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={BASE_COLORS.TEXT_DARK} />
          ),
        }}
      />
    </Tabs>
  );
}
