import "../../global.css";
import { Tabs } from "expo-router";

import { HapticTab } from "@/components/haptic-tab";
import { BASE_COLORS } from "@/constants/Colors";

import { View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabLayout() {
  return (
    <SafeAreaView className="flex-1"
      style={{backgroundColor: BASE_COLORS.LIGHT_BG}}
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
              tabBarIcon: ({ color }) => (
                <MaterialIcons name="home" size={28} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="Agenda"
            options={{
              tabBarIcon: ({ color }) => (
                <MaterialIcons name="calendar-month" size={28} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="Store"
            options={{
              tabBarIcon: ({ color }) => (
                <MaterialIcons name="shopping-cart" size={28} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="Recipes"
            options={{
              tabBarIcon: ({ color }) => (
                <MaterialIcons name="sports-bar" size={28} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="Account"
            options={{
              tabBarIcon: ({ color }) => (
                <MaterialIcons name="person" size={28} color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}
