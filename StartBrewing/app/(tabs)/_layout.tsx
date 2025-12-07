import "../../global.css";
import { Tabs, useRouter, useSegments } from "expo-router";
import { analytics, logEvent } from "@/firebase/firebaseConfig";

import { HapticTab } from "@/components/haptic-tab";
import { useClickCounter } from "@/context/ClickCounterContext";
import { BASE_COLORS } from "@/constants/Colors";

import { View } from "react-native";
import { Badge } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Home, Calendar, Handbag, Beer, User } from "lucide-react-native";
import { supabase } from "@/supabase";
import { useState, useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";

function TabLayout() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const segments = useSegments();
  const [cartCount, setCartCount] = useState(0);

  // Check if we're on a page that shows cart icon in header
  const currentRoute = segments[segments.length - 1];
  const isOnCartPage = currentRoute === "Store" || currentRoute === "StoreItem" || currentRoute === "ShoppingCart";

  useEffect(() => {
    if (isFocused) {
      const loadCartCount = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setCartCount(0);
            return;
          }

          const { data: cart, error: cartError } = await supabase
            .from("shopping_carts")
            .select("id_cart")
            .eq("user_id", user.id)
            .maybeSingle();

          if (cartError || !cart) {
            setCartCount(0);
            return;
          }

          const { data: items, error: countError } = await supabase
            .from("shopping_cart_items")
            .select("id_cart_item", { count: "exact" })
            .eq("cart_id", cart.id_cart);

          if (countError) {
            console.warn("Cart count error:", countError.message);
            return;
          }

          setCartCount(items?.length ?? 0);
        } catch (e: any) {
          console.warn("Cart count fetch exception:", e?.message ?? e);
        }
      };

      loadCartCount();
    }
  }, [isFocused, segments]);

  const createTabBarButton = (eventName: string, DefaultButton: any) => {
    const WrappedButton = (props: any) => {
      const { increment } = useClickCounter();

      const handlePress = async (event: any) => {
        try {
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
            name="Store"
            options={{
              tabBarIcon: ({ color }) => (
                <View>
                  <Handbag color={color} size={28} />
                  {cartCount > 0 && !isOnCartPage && (
                    <Badge
                      visible
                      size={18}
                      style={{
                        position: "absolute",
                        top: -3,
                        right: -8,
                        backgroundColor: BASE_COLORS.RED600,
                        color: "white",
                      }}
                    >{cartCount}</Badge>
                  )}
                </View>
              ),
              tabBarButton: createTabBarButton("store_tab_pressed", HapticTab),
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
