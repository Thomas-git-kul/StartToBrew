import "../../global.css";
import { Tabs } from "expo-router";
import { analytics, logEvent } from "@/firebase/firebaseConfig";

import { HapticTab } from "@/components/haptic-tab";
import { BASE_COLORS } from "@/constants/Colors";

import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 👉 Lucide icons
import { Home, Calendar, Handbag, Beer, User } from "lucide-react-native";

function TabLayout() {
  // Custom tabBarButton to log analytics event
  const createTabBarButton = (eventName: string, DefaultButton: any) => {
    const WrappedButton = (props: any) => {
      const handlePress = (event: any) => {
        if (analytics) {
          logEvent(analytics, eventName);
        }
        if (props.onPress) {
          props.onPress(event);
        }
      };
      return <DefaultButton {...props} onPress={handlePress} />;
    };

    WrappedButton.displayName = `${eventName}_TabButton`;
    return WrappedButton;
  };

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
            tabBarStyle: {
              backgroundColor: BASE_COLORS.LIGHT_BG,
              borderTopWidth: 0,
              marginTop: 5,
            },
          }}
        >
          <Tabs.Screen
            name="HomePage"
            options={{
              tabBarIcon: ({ color }) => <Home color={color} size={28} />,
              tabBarButton: createTabBarButton(
                "homepage_tab_pressed",
                HapticTab
              ),
            }}
          />
          <Tabs.Screen
            name="Agenda"
            options={{
              tabBarIcon: ({ color }) => <Calendar color={color} size={28} />,
              tabBarButton: createTabBarButton("agenda_tab_pressed", HapticTab),
            }}
          />
          <Tabs.Screen
            name="Store"
            options={{
              tabBarIcon: ({ color }) => <Handbag color={color} size={28} />,
              tabBarButton: createTabBarButton("store_tab_pressed", HapticTab),
            }}
          />
          <Tabs.Screen
            name="Recipes"
            options={{
              tabBarIcon: ({ color }) => <Beer color={color} size={28} />,
              tabBarButton: createTabBarButton(
                "recipes_tab_pressed",
                HapticTab
              ),
            }}
          />
          <Tabs.Screen
            name="Account"
            options={{
              tabBarIcon: ({ color }) => <User color={color} size={28} />,
              tabBarButton: createTabBarButton(
                "account_tab_pressed",
                HapticTab
              ),
            }}
          />
          <Tabs.Screen
            name="progress"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}

TabLayout.displayName = "TabLayout";

export default TabLayout;
