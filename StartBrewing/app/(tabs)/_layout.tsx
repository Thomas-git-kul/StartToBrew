import { Tabs } from "expo-router";
import "../../global.css"; 

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { BASE_COLORS } from "@/constants/Colors"; 
import { useColorScheme } from "@/hooks/use-color-scheme";

import { useEffect } from "react";
import * as Font from "expo-font";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Preload Material Icons for web and Android
    Font.loadAsync(MaterialIcons.font);
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#78350F',
        //tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
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
            <MaterialIcons size={28} name="home" color={BASE_COLORS.TEXT_DARK} />
          ),
        }}
      />

      {/* Agenda Tab */}
      <Tabs.Screen
        name="Agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="calendar-month" color={BASE_COLORS.TEXT_DARK} />
          ),
        }}
      />

      {/* Store Tab */}
      <Tabs.Screen
        name="Store"
        options={{
          title: "Store",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="shopping-cart" color={BASE_COLORS.TEXT_DARK} />
          ),
        }}
      />

      {/* Recipes Tab */}
      <Tabs.Screen
        name="Recipes"
        options={{
          title: "Recipes",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="menu-book" color={BASE_COLORS.TEXT_DARK} />
          ),
        }}
      />
    {/* Auth Tab */}
      <Tabs.Screen
        name="Auth"
        options={{
          title: "Auth",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="person" color={BASE_COLORS.TEXT_DARK} />
          ),
        }}
      />
    </Tabs>
  );
}
