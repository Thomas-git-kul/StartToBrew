import React, { useState, useMemo, useEffect } from "react";
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
import Spinner from "@/components/spinner";
import PrimaryButton from "@/components/primaryButton"

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
  const { from, beforeFrom, id, categoryId } = useLocalSearchParams() as { from?: string, beforeFrom?: string, id?: number, categoryId?: number };
  
  //shipping info
  const [fullName, setFullName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const missingFields = () => {
    const fields: string[] = [];
    if (!fullName) fields.push("Full Name");
    if (!street) fields.push("Street");
    if (!city) fields.push("City");
    if (!zip) fields.push("Zip code");
    return fields;
  };
  const canProceed = orders.length > 0 && missingFields().length === 0;

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

  const loadShippingInfo = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 1. Try to load existing shipping info
  const { data: shipping, error } = await supabase
    .from("shipping_info")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // 2. If found → auto-fill
  if (shipping) {
    setFullName(shipping.full_name || "");
    setStreet(shipping.street || "");
    setCity(shipping.city || "");
    setZip(shipping.zip || "");
    
    // Auto-fill full_name ONLY if empty
    if (!shipping.full_name) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile?.full_name) setFullName(profile.full_name);
    }
    return;
  }

  // 3. If NOT found → load profile for first-time autofill
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  if (profile?.full_name) setFullName(profile.full_name);
};

const saveShippingInfo = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("shipping_info")
    .upsert({
      user_id: user.id,
      full_name: fullName,
      street,
      city,
      zip
    },
    { onConflict: ["user_id"] });

  if (error) console.error("Error saving shipping info:", error);
};

  useEffect(() => {
    loadShippingInfo();
  },[]);

  useFocusEffect( React.useCallback(() => {
    loadCart();
    //loadShippingInfo();
  }, []));

  const debounceTimers = React.useRef<Record<string, number>>({});

  const debouncedUpdateQuantity = (
    store_item_id: number,
    newQty: number,
    starterkit: boolean
  ) => {
    const key = `${store_item_id}-${starterkit}`;
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }
    debounceTimers.current[key] = setTimeout(() => {
      updateCartQuantity(store_item_id, newQty, starterkit);
    }, 800);
  };



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
                from: beforeFrom,
              },
            });
          } else {
            router.push("/Store");
          }
        }}
      />
      {loading ? (
        <Spinner 
          title="Loading shoppingcart..."
        />
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
                onQuantityChange={(newQty, starterkit) => 
                  debouncedUpdateQuantity(order.store_item_id, newQty, starterkit)}
              />
            ))}
          </View>

          {/* Subtotal */}
          <View className='mt-1 mr-2 items-end'>
            <ThemedText type="accentDark">Subtotal: {formatter.format(total)}</ThemedText>
          </View>

          {/* Shipping Info */}
          <View className="mt-7">
            <ThemedText type="title">Shipping Information</ThemedText>
            <TextInput 
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput 
              placeholder="Street name and number"
              value={street}
              onChangeText={setStreet}
            />
            <View className="flex-row">
              <TextInput 
                placeholder="City" 
                value={city}
                onChangeText={setCity}
              />
              <View className="flex-1 ml-3">
                <TextInput 
                  placeholder="Zip code"
                  value={zip}
                  onChangeText={setZip}
                />
              </View>
            </View>
          </View>


          {/* Proceed */}
          <View className="items-end mb-4">
            <PrimaryButton
              title="Proceed to payment"
              onPress={async () => {
                await saveShippingInfo(); 
                router.push({
                  pathname: "/Payment" as any,
                  params: { amount: Math.round(total * 100) }
                });
              }}
              testID="payment"
              disabled={!canProceed}
            />
            {!canProceed && (
              <ThemedText type="tips" style={{ marginTop: 4 }}>
                {orders.length === 0
                  ? "Your cart is empty."
                  : `Please fill in: ${missingFields().join(", ")}`}
              </ThemedText>
  )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
