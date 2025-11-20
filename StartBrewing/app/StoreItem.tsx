import React, { useState, useMemo, useEffect } from "react";
import { View, ScrollView, Image, Pressable, FlatList, Dimensions } from "react-native";
import { FAB } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useFonts } from "@/hooks/use-fonts";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { CirclePlus, CircleMinus } from "lucide-react-native";
import { supabase } from "../supabase";

const { width } = Dimensions.get("window");
const IMAGE_WIDTH = width - 20;
const IMAGE_HEIGHT = IMAGE_WIDTH * 0.75;

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

    try {
      // Get logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log("User:", user);
      if (userError || !user) {
        console.error("Error fetching user for brew:", userError?.message);
        return;
      }

      // Create a new order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{ user_id: user.id }])
        .select("id_order")
        .single();

      if (orderError || !orderData) {
        console.error("Error creating order:", orderError?.message);
        return;
      }

      const newOrderId = orderData.id_order;

      // Insert item into order_items
      const { error: orderItemError } = await supabase
        .from("order_items")
        .insert([
          {
            store_item_id: item.id,
            order_id: newOrderId,
            quantity,
          },
        ]);

      if (orderItemError) {
        console.error("Error inserting order item:", orderItemError.message);
        return;
      }

    console.log("order created, item added");

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
        const { data, error } = await supabase
          .from("store_items")
          .select("id_store_item, name, category_id, price")
          .eq("id_store_item", id)
          .single();

        if (error) {
          console.warn("Supabase fetch StoreItem error:", error.message);
          if (mounted) setItem(null);
        } else if (data) {
          if (mounted)
            setItem({
              id: data.id_store_item,
              name: data.name ?? "Untitled StoreItem",
              category: data.category_id ?? 4,
              description: data.description ?? "No description available.",
              price: data.price ?? 0,
              images: [
                {
                  id: "0",
                  source: exampleImages[data.category_id] 
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
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BASE_COLORS.LIGHT_BG }}>
        {/* Header */}
        <Header
          title={item?.name ?? (loading ? "Loading…" : "Item")}
          iconName="ArrowRight"
          onIconPress={() => router.push("/Store")}
          actionTestID="back-button"
        />

        {/* Scrollable Content */}
        <ScrollView 
          className="flex-1 mx-3" 
          showsVerticalScrollIndicator={false}
        >
          {/* Image Carousel */}
          <View>
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

            {/* Pagination Dots */}
            <View
              style={{
                position: "absolute",
                bottom: 8,
                left: 0,
                right: 0,
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {item?.images?.map((_, i: number) => (
                <View
                  key={i}
                  style={{
                    width: currentIndex === i ? 10 : 8,
                    height: currentIndex === i ? 10 : 8,
                    borderRadius: currentIndex === i ? 5 : 4,
                    backgroundColor:
                      currentIndex === i
                        ? BASE_COLORS.ACCENT_PRIMARY
                        : "rgba(255,255,255,0.65)",
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.12)",
                    marginHorizontal: 2,
                  }}
                />
              ))}
            </View>
          </View>
          
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
              <CircleMinus size={20} color={BASE_COLORS.STONE500} />
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
              <CirclePlus size={20} color={BASE_COLORS.STONE500} />
            </Pressable>
          </View>

          <FAB
            label="Add to order"
            mode="elevated"
            testID="fab-add-to-order"
            onPress={handleAddToOrder}
            style={{
              backgroundColor: BASE_COLORS.TEXT_DARK,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
            color={BASE_COLORS.WHITE}
            theme={{
              fonts: {
                labelLarge: { fontFamily: FontFamilies.BODY_BOLD, fontSize: 16 },
              },
            }}
          />
        </View>
      </SafeAreaView>
    );
}
