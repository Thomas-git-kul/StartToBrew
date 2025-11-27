import { useState, useMemo, useEffect } from "react";
import { View, ScrollView, Image, Pressable, FlatList, Dimensions } from "react-native";
import { Button } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useFonts } from "@/hooks/use-fonts";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { CirclePlus, CircleMinus } from "lucide-react-native";
import { supabase } from "../supabase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_WIDTH = SCREEN_WIDTH - 20;
const IMAGE_HEIGHT = IMAGE_WIDTH * 0.75;

const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

const exampleImages: Record<number, any> = {
  1: require("@/assets/images/malt.png"),
  2: require("@/assets/images/hop.png"),
  3: require("@/assets/images/yeast.png"),
  4: require("@/assets/images/starterkit2.png"),
  5: require("@/assets/images/Airlock.png"),
  6: require("@/assets/images/measurement.png"),
};

export default function StoreItem() {
  useFonts();

  const router = useRouter();
  const { id } = useLocalSearchParams() as { id?: number };
  const { categoryNumber } = useLocalSearchParams() as { categoryNumber?: number };
  const { cartCount } = useLocalSearchParams() as { cartCount?: number };
  // console.log("cartCount:", cartCount);

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<{
    id: string;
    name: string;
    category: number;
    description: string;
    price: number;
    images: { id: string; source: any }[];
  } | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Format price in Euro
  const formatter = useMemo(
    () => new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }),
    []
  );

  // Calculate total price dynamically
  const totalPrice = useMemo(
    () => (item?.price ?? 0) * quantity,
    [item?.price, quantity]
  );

  const handleAddToOrder = async () => {
    if (!item) return;

    const isStarterKit = Number(categoryNumber) === 4;

    try {
      // Get logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Error fetching user:", userError?.message);
        return;
      }
      const userId = user.id;
      console.log("userId:", userId);

      // Check if the item (store_item or starter_kit) already exists in the cart
      const { data: existingCart, error: existingError } = await supabase
        .from("shopping_cart")
        .select(`
          id_cart,
          quantity,
          user_shopping_cart!inner (
            user_id
          )
        `)
        .eq("store_item_id", item.id)
        .eq("starter_kit", isStarterKit)
        .eq("user_shopping_cart.user_id", userId)
        .maybeSingle();

      if (existingError && existingError.code !== "PGRST116") {
        console.error("Error checking existing cart:", existingError.message);
        return;
      }

      if (existingCart) {
        // Update quantity if already in cart
        const newQuantity = existingCart.quantity + quantity;
        const { error: updateError } = await supabase
          .from("shopping_cart")
          .update({ quantity: newQuantity })
          .eq("id_cart", existingCart.id_cart);
        if (updateError) {
          console.error("Error updating cart quantity:", updateError.message);
          return;
        }
      } else {
        // Insert new cart row
        const { data: cartData, error: insertCartError } = await supabase
          .from("shopping_cart")
          .insert([{
            store_item_id: item.id,
            quantity,
            starter_kit: isStarterKit
          }])
          .select()
          .single();

        if (insertCartError) {
          console.error("Error inserting into shopping_cart:", insertCartError.message);
          return;
        }

        // Map cart row to user
        const { error: mapError } = await supabase
          .from("user_shopping_cart")
          .insert([{ user_id: user.id, cart_id: cartData.id_cart }]);

        if (mapError) {
          console.error("Error mapping cart to user:", mapError.message);
          return;
        }
      }

      console.log("Item added to shopping cart successfully");
      router.push("/Store");

    } catch (err: any) {
      console.error("Unexpected order creation error:", err.message ?? err);
    }
  };
    
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        let data: any;
        let error: any;

        if (Number(categoryNumber) === 4) {
          // Starter kit
          ({ data, error } = await supabase
            .from("starter_kits")
            .select("id_starter_kit, name, description, price")
            .eq("id_starter_kit", id)
            .single());
            if (data) {
              data.id = data.id_starter_kit;
            }
        } else {
          // Regular store item
          ({ data, error } = await supabase
            .from("store_items")
            .select("id_store_item, name, category_id, price")
            .eq("id_store_item", id)
            .single());
            if (data) {
              data.id = data.id_store_item; // map to common field
            }
        }

        if (error) {
          console.warn("Supabase fetch item error:", error.message);
          if (mounted) setItem(null);
          return;
        }

        if (mounted && data) {
          setItem({
            id: data.id,
            name: data.name ?? "Untitled Item",
            category: categoryNumber ?? 0,
            description: data.description ?? "No description available.",
            price: data.price ?? 0,
            images: [
              {
                id: "0",
                source: exampleImages[Number(categoryNumber)] 
                  || require("@/assets/images/Premiumkit.png"),
              },
            ],
          });
        }
      } catch (e: any) {
        console.warn("Supabase fetch exception:", e?.message ?? e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id, categoryNumber, cartCount]);

  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BASE_COLORS.LIGHT_BG }}>
        {/* Header */}
        <Header
          title="Store"
          iconName="ShoppingCart"
          onIconPress={() => router.push("/ShoppingCart")}
          actionTestID="back-button"
          cartCount={cartCount}
        />

        {/* Scrollable Content */}
        <ScrollView 
          className="flex-1 mx-3" 
          showsVerticalScrollIndicator={false}
        >
          <ThemedText type="titleBlack">{item?.name ?? (loading ? "Loading…" : "Item")}</ThemedText>
          {/* Image Carousel */}
          <FlatList
            data={item?.images ?? []} // Ensure fallback is an empty array
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(image, index) => `${image.id ?? index}`} // Use index as fallback
            renderItem={({ item: image }) => {
              return (
                <View
                  style={{
                    width: IMAGE_WIDTH,
                    height: IMAGE_HEIGHT,
                    borderRadius: 20,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    source={image.source}
                    style={{
                      width: "100%",
                      height:"100%"
                    }}
                    resizeMode="cover"
                  />
                </View>
              );
            }}
            onMomentumScrollEnd={(ev) => {
              const index = Math.round(
                ev.nativeEvent.contentOffset.x / ev.nativeEvent.layoutMeasurement.width
              );
              setCurrentIndex(index);
            }}
          />
          
          {/* Product information */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              marginTop: 12,
            }}
          >
            <ThemedText
              type="titleBlack"
              style={{ color: BASE_COLORS.ACCENT_PRIMARY }}
            >
              {formatter.format(totalPrice)}
            </ThemedText>
          </View>

          <ThemedText type="defaultText" className="mb-3">
            {item?.description ?? (loading ? "Loading…" : "Item")}
          </ThemedText>
        </ScrollView>

        {/* Bottom Bar */}
        <View
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            right: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Quantity Selector */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              testID="quantity-minus"
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              hitSlop={8}
              style={{ justifyContent: "center", alignItems: "center", width: 40, height: 40 }}
            >
              <CircleMinus size={30} color={BASE_COLORS.STONE500} />
            </Pressable>

            <ThemedText type="numbers" style={{ marginHorizontal: 12 }}>
              {quantity}
            </ThemedText>

            <Pressable
              testID="quantity-plus"
              onPress={() => setQuantity(quantity + 1)}
              hitSlop={8}
              style={{ justifyContent: "center", alignItems: "center", width: 40, height: 40 }}
            >
              <CirclePlus size={30} color={BASE_COLORS.STONE500} />
            </Pressable>
          </View>

          <Button
            mode="contained"
            testID="fab-add-to-order"
            onPress={handleAddToOrder}
            labelStyle={{ 
              fontSize: Math.min(18 * scale, 24),
              color: BASE_COLORS.WHITE,
              fontFamily: FontFamilies.BODY,            
            }}
            style={{
              borderRadius: 30,
              backgroundColor: BASE_COLORS.TEXT_DARK,
              padding: 4,
            }}
            theme={{
              fonts: {
                labelLarge: {
                  fontSize: 16,
                  fontFamily: FontFamilies.BODY,
                },
              },
            }}
          >Add to order</Button>
        </View>
      </SafeAreaView>
    );
}
