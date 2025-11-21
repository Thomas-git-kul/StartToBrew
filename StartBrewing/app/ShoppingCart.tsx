import { useState, useMemo, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { Button } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter } from "expo-router";
import OrderCard from "@/components/ui/OrderCard";
import { useFonts } from "@/hooks/use-fonts";
import Header from '@/components/header';
import TextInput from '@/components/textInput';
import { ThemedText } from "@/components/themed-text";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../supabase";

interface OrderItem {
  store_item_id: number;
  image: any;
  title: string;
  quantity: number;
  price: string;
  starterkit: boolean;
}

interface StoreItem {
  id_store_item: number;
  name: string;
  price: number;
  starter_kit: boolean;
}

interface StarterKit {
  id_starter_kit: number;
  name: string;
  price: number;
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

  const [orders, setOrders] = useState<OrderItem[]>([]);

  const parsePrice = (priceStr: string) => {
    if (!priceStr) return 0;
    let s = priceStr.replace(/[^0-9.,-]/g, '');
    if (s.indexOf('.') > -1 && s.indexOf(',') > -1) {
      s = s.replace(/\./g, '');
      s = s.replace(/,/g, '.');
    } else if (s.indexOf(',') > -1 && s.indexOf('.') === -1) {
      s = s.replace(/,/g, '.');
    }
    const n = parseFloat(s);
    return Number.isNaN(n) ? 0 : n;
  };

  const total = useMemo(() => {
    return orders.reduce((sum, o) => sum + parsePrice(o.price) * o.quantity, 0);
  }, [orders]);

  const formatter = useMemo(() => new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }), []);

  let mounted = true;
  const loadCart = async () => {
    try {
      // Get logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Error fetching user:", userError?.message);
        return;
      }
      const userId = user.id;
      console.log("userId:", userId);

      // Fetch shopping cart items for this user
      const { data: cartItems, error: cartError } = await supabase
        .from("shopping_cart")
        .select(`
          id_cart,
          store_item_id,
          quantity,
          starter_kit,
          user_shopping_cart:user_shopping_cart!inner(user_id)
        `)
        .eq("user_shopping_cart.user_id", userId);
      if (cartError) {
        console.error("Error fetching shopping cart:", cartError.message);
        return;
      }
      console.log("cartItems:", cartItems);

      // Fetch all store items
      const { data: storeItems, error: storeError } = await supabase
        .from("store_items")
        .select("id_store_item, name, price, category_id");

      if (storeError) {
        console.error("Error fetching store items:", storeError.message);
        return;
      }

      // Fetch all starter kits
      const { data: starterKits, error: starterError } = await supabase
        .from("starter_kits")
        .select("id_starter_kit, name, price");

      if (starterError) {
        console.error("Error fetching starter kits:", starterError.message);
        return;
      }

      // Map cart items to Order[]
      const mappedOrders: OrderItem[] = (cartItems ?? []).map((item: any) => {
        if (item.starter_kit) {
          const kit = (starterKits ?? []).find((k: StarterKit) => k.id_starter_kit === item.store_item_id);
          return {
            store_item_id: item.store_item_id,
            image: exampleImages[item.category_id] || require("@/assets/images/Premiumkit.png"),
            title: kit?.name || "Starter Kit",
            quantity: item.quantity,
            price: `€${kit?.price?.toFixed(2) || "0.00"}`,
            starterkit: true,
          };
        } else {
          const storeItem = (storeItems ?? []).find((s: StoreItem) => s.id_store_item === item.store_item_id);
          return {
            store_item_id: item.store_item_id,
            image: exampleImages[storeItem?.category_id] || require("@/assets/images/Premiumkit.png"),
            title: storeItem?.name || "Item",
            quantity: item.quantity,
            price: `€${storeItem?.price?.toFixed(2) || "0.00"}`,
            starterkit: false,
          };
        }
      });

      if (mounted) setOrders(mappedOrders);

    } catch (err: any) {
      console.error("Error loading shopping cart:", err.message ?? err);
    }
  };

  const updateCartQuantity = async (store_item_id: number, newQty: number) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error fetching user:", userError?.message);
          return;
        }
      const userId = user.id;
      // Find the cart item id
      const { data: cartItems, error: cartError } = await supabase
        .from('shopping_cart')
        .select('id_cart')
        .eq('store_item_id', store_item_id)
        .limit(1);

      if (cartError) {
        console.error("Error fetching cart item:", cartError.message);
        return;
      }

      const cartItemId = cartItems?.[0]?.id_cart;
      if (!cartItemId) return;

      // Update the quantity in the shopping_cart table
      if (newQty > 0) {
        const { error: updateError } = await supabase
          .from('shopping_cart')
          .update({ quantity: newQty })
          .eq('id_cart', cartItemId);
          if (updateError) console.error("Error updating quantity:", updateError.message);
      } else {
        const { error: deleteUserCartError } = await supabase
          .from("user_shopping_cart")
          .delete()
          .eq("cart_id", cartItemId)
          .eq("user_id", userId);
        if (deleteUserCartError) console.error("Error deleting from user_shopping_cart:", deleteUserCartError.message);

        const { error: deleteCartError } = await supabase
          .from("shopping_cart")
          .delete()
          .eq("id_cart", cartItemId);
          loadCart();
        if (deleteCartError) console.error("Error deleting from shopping_cart:", deleteCartError.message);
      }

    } catch (err: any) {
      console.error("Error updating shopping cart:", err.message ?? err);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  return (
    <SafeAreaView 
      className="flex-1" 
      style={{ backgroundColor: BASE_COLORS.LIGHT_BG 
    }}>

      <Header
        title='Shopping Cart'
        iconName="ArrowRight"
        onIconPress={() => router.push("/Store" as any)}
        actionTestID="store-button"
      />

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
            onQuantityChange={(newQty) => updateCartQuantity(order.store_item_id, newQty)}
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
            label="Full Name"/>
          <TextInput 
            label="Street name and number"/>
          <View className="flex-row">
              <TextInput label="City" />
            <View className="flex-1 ml-3">
              <TextInput label="Zip code"/>
            </View>
          </View>
        </View>

        {/* Proceed */}
        <View className="mt-5">
          <Button
            mode="contained"
            onPress={() => router.push("../Payment")}
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
    </SafeAreaView>
  );
}
