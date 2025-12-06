import { Appbar, Badge } from "react-native-paper";
import * as Icons from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { View } from "react-native";
import { useState, useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import { supabase } from "@/supabase";
import { useAppRefresh } from "@/context/AppRefreshContext";

const iconMap: Record<string, LucideIcon> = {
  ShoppingCart: Icons.ShoppingCart,
  Calendar1: Icons.Calendar1,
  ArrowRight: Icons.ArrowRight,
  ArrowLeft: Icons.ArrowLeft,
  House: Icons.House,
  HeartPlus: Icons.HeartPlus,
  Heart: Icons.Heart,
  Trash: Icons.Trash,
  Settings: Icons.Settings,
  LogOut: Icons.LogOut,
  UserCog: Icons.UserCog
};

interface HeaderBarProps {
  title: string;
  iconName?: keyof typeof iconMap;
  onIconPress?: () => void;
  actionTestID?: string;
  filled?: boolean;
  showCartCount?: boolean;
  iconNameLeft?: keyof typeof iconMap;
  onIconPressLeft?: () => void;
  actionTestIDLeft?: string;
}

export default function HeaderBar({
  title,
  iconName,
  onIconPress,
  actionTestID,
  filled=false,
  showCartCount = false,
  iconNameLeft,
  onIconPressLeft,
  actionTestIDLeft,
}: HeaderBarProps) {
  const IconComponent = iconName ? iconMap[iconName] : undefined;
  const IconComponentLeft = iconNameLeft ? iconMap[iconNameLeft] : undefined;
  const isFocused = useIsFocused();
  const { refreshKey } = useAppRefresh();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (isFocused && showCartCount) {
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
  }, [isFocused, showCartCount, refreshKey]);

  return (
    <Appbar.Header style={{ backgroundColor: BASE_COLORS.LIGHT_BG, }} mode="center-aligned">
      {IconComponentLeft && onIconPressLeft && (
          <Appbar.Action
            icon={() => (
              <View style={{ marginLeft: -8 }}>
                <IconComponentLeft
                  size={28}
                  strokeWidth={2}
                  stroke={BASE_COLORS.TEXT_DARK}
                />
              </View>
            )}
            onPress={onIconPressLeft}
            testID={actionTestIDLeft}
          />
      )}
      <Appbar.Content
        title={title}
        titleStyle={{ fontFamily: FontFamilies.BODY_BOLD, color: BASE_COLORS.TEXT_DARK, }}
      />

      {IconComponent && onIconPress && (
        <View>
          <Appbar.Action
            icon={() => (
              <View style={{ marginRight: -8 }}>
                <IconComponent
                  size={28}
                  stroke={filled ? BASE_COLORS.ACCENT_PRIMARY : BASE_COLORS.TEXT_DARK}
                  strokeWidth={2}
                  fill={filled ? BASE_COLORS.ACCENT_PRIMARY : "transparent"}
                />
                {cartCount > 0 && (
                  <Badge
                    visible
                    size={18}
                    style={{
                      position: "absolute",
                      top: -3,
                      right: 2,
                      backgroundColor: BASE_COLORS.RED600,
                      color: "white",
                    }}
                  >{cartCount}</Badge>
                )}
              </View>
            )}
            onPress={onIconPress}
            testID={actionTestID}
          />
        </View>
      )}
    </Appbar.Header>
  );
}
