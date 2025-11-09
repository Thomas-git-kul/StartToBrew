import "../../global.css";
import { Tabs } from "expo-router";

import { HapticTab } from "@/components/haptic-tab";
import { BASE_COLORS } from "@/constants/Colors";

import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 👉 Lucide icons
import {
  Home,
  Calendar,
  ShoppingCart,
  Beer,
  User,
} from "lucide-react-native";

export default function TabLayout() {
  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
    >
      <View className="flex-1 mx-3">
        {/* Tabs wrapper */}
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: BASE_COLORS.TEXT_DARK,
            tabBarInactiveTintColor: BASE_COLORS.STONE400,
            headerShown: false,
            tabBarShowLabel: false,
            tabBarButton: HapticTab,
            tabBarStyle: {
              backgroundColor: BASE_COLORS.LIGHT_BG,
              borderTopWidth: 0,
            },
          }}
        >
          <Tabs.Screen
            name="HomePage"
            options={{
              tabBarIcon: ({ color }) => <Home color={color} size={28} />,
            }}
          />
          <Tabs.Screen
            name="Agenda"
            options={{
              tabBarIcon: ({ color }) => <Calendar color={color} size={28} />,
            }}
          />
          <Tabs.Screen
            name="Store"
            options={{
              tabBarIcon: ({ color }) => (
                <ShoppingCart color={color} size={28} />
              ),
            }}
          />
          <Tabs.Screen
            name="Recipes"
            options={{
              tabBarIcon: ({ color }) => <Beer color={color} size={28} />,
            }}
          />
          <Tabs.Screen
            name="Account"
            options={{
              tabBarIcon: ({ color }) => <User color={color} size={28} />,
            }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}
