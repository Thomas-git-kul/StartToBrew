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
            tabBarStyle: { backgroundColor: BASE_COLORS.LIGHT_BG },
          }}
        >
          <Tabs.Screen
            name="HomePage"
            options={{
              tabBarIcon: () => <MaterialIcons size={28} name="home" color={BASE_COLORS.STONE300} />,
            }}
          />
          <Tabs.Screen
            name="Agenda"
            options={{
              tabBarIcon: () => <MaterialIcons size={28} name="calendar-month" color={BASE_COLORS.TEXT_DARK} />,
            }}
          />
          <Tabs.Screen
            name="Store"
            options={{
              tabBarIcon: () => <MaterialIcons size={28} name="shopping-cart" color={BASE_COLORS.TEXT_DARK} />,
            }}
          />
          <Tabs.Screen
            name="Recipes"
            options={{
              tabBarIcon: () => <MaterialIcons size={28} name="menu-book" color={BASE_COLORS.TEXT_DARK} />,
            }}
          />
          <Tabs.Screen
            name="Auth"
            options={{
              tabBarIcon: () => <MaterialIcons size={28} name="person" color={BASE_COLORS.TEXT_DARK} />,
            }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}
