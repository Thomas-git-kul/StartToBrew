import { Tabs } from "expo-router";
import "../../global.css";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BASE_COLORS } from "@/constants/Colors";

import { FontFamilies } from "@/constants/Fonts";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { View, ScrollView, ImageSourcePropType } from "react-native";
import { Text, Searchbar, Appbar } from "react-native-paper";

import { MaterialIcons } from "@expo/vector-icons";

import { useRouter, usePathname } from "expo-router";

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const getHeaderContent = () => {
    switch (pathname) {
      case "/HomePage":
        return {
          title: "StartToBrew",
          icon: null
        };
      case "/Store":
        return {
          title: "Store",
          icon: (
            <Appbar.Action
              icon={() => <MaterialCommunityIcons name="cart-outline" size={28} color={BASE_COLORS.TEXT_DARK} />}
              onPress={() => router.push("/cart" as any)}
            />
          ),
        };
      case "/Agenda":
        return {
          title: "Agenda",
          icon: (
            <Appbar.Action
              icon={() => <MaterialCommunityIcons name="tooltip-check-outline" size={28} color={BASE_COLORS.TEXT_DARK} />}
              onPress={() => router.push("/Agenda?goToToday=true")}
            />
          ),
        };
      default:
        return {
          title: pathname.replace("/", ""),
          icon: null,
        };
    }
  };

  const header = getHeaderContent();

  return (
    <View style={{ flex: 1, backgroundColor: BASE_COLORS.LIGHT_BG }}>
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: BASE_COLORS.LIGHT_BG, paddingTop: 8, paddingBottom: 8 }}>
        <Appbar.Content
          title={header.title}
          titleStyle={{ fontSize: 36, fontFamily: FontFamilies.HEADING, color: BASE_COLORS.TEXT_DARK }}
        />
        {header.icon}
      </Appbar.Header>

      {/* Tabs wrapper */}
      <View style={{ flex: 1, backgroundColor: BASE_COLORS.LIGHT_BG }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: "#78350F",
            headerShown: false,
            tabBarShowLabel: false,
            tabBarButton: HapticTab,
            tabBarStyle: { backgroundColor: BASE_COLORS.LIGHT_BG },
          }}
        >
          <Tabs.Screen
            name="HomePage"
            options={{
              tabBarIcon: () => <MaterialIcons size={28} name="home" color={BASE_COLORS.TEXT_DARK} />,
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
    </View>
  );
}
