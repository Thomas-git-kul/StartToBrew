import "../../global.css";
import { Tabs, useRouter } from "expo-router";
import { analytics, logEvent } from "@/firebase/firebaseConfig";

import { HapticTab } from "@/components/haptic-tab";
import { useClickCounter } from "@/context/ClickCounterContext";
import { BASE_COLORS } from "@/constants/Colors";

import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Home, Calendar, Handbag, Beer, User } from "lucide-react-native";
import { supabase } from "@/supabase";

function TabLayout() {
  const router = useRouter();

  const createTabBarButton = (eventName: string, DefaultButton: any) => {
    const WrappedButton = (props: any) => {
      const { increment } = useClickCounter();

      const handlePress = async (event: any) => {
        try {
          // increment global click counter for analytics
          try {
            await increment("tab_press");
          } catch (e) {
            // ignore
          }

          if (analytics) {
            logEvent(analytics, eventName);
          }

          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            router.push("/Auth");
            return;
          }

          if (props.onPress) {
            props.onPress(event);
          }
        } catch (err: unknown) {
          console.warn("Tab auth check failed:", err);
          router.push("/Auth");
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
      <View className="flex-1">
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: BASE_COLORS.TEXT_DARK,
            tabBarInactiveTintColor: BASE_COLORS.STONE400,
            headerShown: false,
            tabBarShowLabel: true,
            tabBarStyle: {
              backgroundColor: BASE_COLORS.LIGHT_BG,
              borderTopWidth: 0,
              marginTop: 5,
            },
          }}
        >
          {/* HomePage: GEEN auth-guard, wel HapticTab */}
          <Tabs.Screen
            name="HomePage"
            options={{
              tabBarIcon: ({ color }) => <Home color={color} size={28} />,
              tabBarLabel: "Home",
              tabBarButton: (props) => <HapticTab {...props} />,
            }}
          />

          {/* Vanaf hier wél auth-guard */}
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

          {/* overige hidden routes ongewijzigd */}
          <Tabs.Screen
            name="progress"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="StoreItem"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="ShoppingCart"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="SpecificRecipe"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="ChatBot"
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
