import React, { useState, useMemo } from "react";
import { View, ScrollView } from "react-native";
import { Button, ActivityIndicator } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter, useLocalSearchParams } from "expo-router";
import OrderCard from "@/components/ui/OrderCard";
import { useFonts } from "@/hooks/use-fonts";
import Header from '@/components/header';
import TextInput from '@/components/textInput';
import { ThemedText } from "@/components/themed-text";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/supabase";
import { useFocusEffect } from "@react-navigation/native";

interface CartItem {
  store_item_id: number;
  image: any;
  title: string;
  quantity: number;
  price: string;
  starterkit: boolean;
  categoryId?: number | null;
}
interface StoreItem {
  id_store_item: number;
  name: string;
  price: number;
  starterkit: boolean;
  category_id: number;
}
interface StarterKit {
  id_starter_kit: number;
  name: string;
  price: number;
  category_id: number;
}

const exampleImages: Record<number, any> = {
  1: require("@/assets/images/malt.png"),
  2: require("@/assets/images/hop.png"),
  3: require("@/assets/images/yeast.png"),
  4: require("@/assets/images/starterkit2.png"),
  5: require("@/assets/images/Airlock.png"),
  6: require("@/assets/images/measurement.png"),
};

export default function ShoppingCart() {
  useFonts();
  const router = useRouter();

  const [orders, setOrders] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { from, id, categoryId } = useLocalSearchParams() as { from?: string, id?: number, categoryId?: number };
  

  // Format Euro prices
  const formatter = useMemo(
    () => new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }),
    []
  );

  // Total price
  const total = useMemo(
    () => orders.reduce((sum, o) => sum + parseFloat(o.price.replace(/[^0-9.,-]/g, "").replace(",", ".")) * o.quantity, 0),
    [orders]
  );

  const loadCart = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return console.error("Error fetching user:", userError?.message);
      const userId = user.id;

      // Get or create cart
      let { data: existingCart } = await supabase
        .from("shopping_carts")
        .select("*")
        .eq("user_id", userId)
        .single();

      let cartId = existingCart?.id_cart;
      if (!cartId) {
        const { data: newCart } = await supabase
          .from("shopping_carts")
          .insert({ user_id: userId })
          .select()
          .single();
        cartId = newCart.id_cart;
      }

      // Fetch all cart items
      const { data: cartItems } = await supabase
        .from("shopping_cart_items")
        .select("*")
        .eq("cart_id", cartId);

      if (!cartItems || cartItems.length === 0) {
        setOrders([]);
        return;
      }

      // Fetch store items and starter kits
      const { data: storeItems } = await supabase.from("store_items").select("*");
      const { data: starterKits } = await supabase.from("starter_kits").select("*");
      const mappedOrders: CartItem[] = (cartItems as any[]).map((item) => {
        if (item.starter_kit) {
          // Starter kit
          const kit = (starterKits as StarterKit[]).find(k => k.id_starter_kit === item.store_item_id);
          return {
            store_item_id: item.store_item_id,
            title: kit?.name || "Starter Kit",
            quantity: item.quantity,
            price: `€${kit?.price?.toFixed(2) ?? "0.00"}`,
            starterkit: true,
            image: exampleImages[4], // example image for starter kits
            categoryId: 4,

          };
        } else {
          // Regular store item
          const storeItem = (storeItems as StoreItem[]).find(s => s.id_store_item === item.store_item_id);
          return {
            store_item_id: item.store_item_id,
            title: storeItem?.name || "Item",
            quantity: item.quantity,
            price: `€${storeItem?.price?.toFixed(2) ?? "0.00"}`,
            starterkit: false,
            image: exampleImages[storeItem?.category_id ?? 1],
            categoryId: storeItem?.category_id ?? null,
          };
        }
      });

      mappedOrders.sort((a, b) => a.title.localeCompare(b.title));
      setOrders(mappedOrders);

    } catch (err: any) {
      console.error("Error loading cart:", err.message ?? err);
    } finally {
      setLoading(false);
    }
  };

  const updateCartQuantity = async (store_item_id: number, newQty: number, starter_kit: boolean) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error fetching user:", userError?.message);
          return;
        }
      const userId = user.id;

      // Get user's cart
      const { data: cart, error: cartError } = await supabase
        .from("shopping_carts")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (cartError || !cart) {
        console.error("No cart found:", cartError?.message);
        return;
      }

      const cartId = cart.id_cart;

      // Find the specific cart item
      const { data: item, error: itemError } = await supabase
        .from("shopping_cart_items")
        .select("*")
        .eq("cart_id", cartId)
        .eq("store_item_id", store_item_id)
        .eq("starter_kit", starter_kit)
        .single();

      if (itemError || !item) {
        console.error("Cart item not found:", itemError?.message);
        return;
      }

      // 3) If new quantity > 0 → update, else delete
      if (newQty > 0) {
        const { error: updateError } = await supabase
          .from("shopping_cart_items")
          .update({ quantity: newQty })
          .eq("id_cart_item", item.id_cart_item);

        if (updateError) {
          console.error("Error updating quantity:", updateError.message);
          return;
        }
      } else {
        const { error: deleteError } = await supabase
          .from("shopping_cart_items")
          .delete()
          .eq("id_cart_item", item.id_cart_item);

        if (deleteError) {
          console.error("Error deleting item:", deleteError.message);
          return;
        }
      }

      // Reload UI
      loadCart();

    } catch (err: any) {
      console.error("Error updating shopping cart:", err.message);
    }
  };

  useFocusEffect( React.useCallback(() => {
    loadCart();
  }, []));

  return (
    <SafeAreaView 
      className="flex-1" 
      style={{ backgroundColor: BASE_COLORS.LIGHT_BG 
    }}>

      <Header
        title='Shopping Cart'
        actionTestID="back-button"
        iconNameLeft="ArrowLeft"
        onIconPressLeft={() => {
          if (from === "storeitem") {
            router.push({
              pathname: "/StoreItem",
              params: {
                id: id,
                categoryNumber: categoryId,
              },
            });
          } else {
            router.push("/Store");
          }
        }}
      />
      {loading ? (
        <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
          <ActivityIndicator 
            animating size="large"
            color={BASE_COLORS.ACCENT_PRIMARY} 
          />
          <ThemedText type="defaultText" className="mt-3">
            Loading progress...
          </ThemedText>
        </SafeAreaView>
      ) : (
        <ScrollView 
          className="mx-3"
          showsHorizontalScrollIndicator={false}
        >
          <ThemedText type="title">Order Summary</ThemedText>

        {/* Order cards */}
        <View className="mx-1">
          {orders.map((order, index) => (
            <OrderCard
              key={index}
              {...order}
              starterkit={order.starterkit}
              onPress={() =>
                router.push({
                  pathname: "/StoreItem",
                  params: {
                    id: order.store_item_id,
                    categoryNumber: order.categoryId?.toString() ?? "",
                    from: "cart",
                  },
                } as any)
              }
              onQuantityChange={(newQty, starterkit) => updateCartQuantity(order.store_item_id, newQty, starterkit)}
            />
          ))}
        </View>

          {/* Subtotal */}
          <View className='mt-3 mr-2 items-end'>
            <ThemedText type="accentDark">Subtotal: {formatter.format(total)}</ThemedText>
          </View>

          {/* Shipping Info */}
          <View className="mt-7">
            <ThemedText type="title">Shipping Information</ThemedText>
            <TextInput 
              placeholder="Full Name"
            />
            <TextInput 
              placeholder="Street name and number"/>
            <View className="flex-row">
                <TextInput placeholder="City" />
              <View className="flex-1 ml-3">
                <TextInput placeholder="Zip code"/>
              </View>
            </View>
          </View>

          {/* Proceed */}
          <View className="mt-5">
            <Button
              mode="contained"
              onPress={() => router.push({
                pathname: "/Payment" as any,
                params: { amount: Math.round(total * 100) } // convert to cents
              } as any)}
              style={{
                backgroundColor: BASE_COLORS.TEXT_DARK,
                alignSelf: "flex-start",
                marginBottom: 10
              }}
              contentStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
              labelStyle={{ 
                fontSize: 15,
                color: BASE_COLORS.WHITE,
                fontFamily: FontFamilies.BODY
              }}
            >Proceed to payment</Button>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
