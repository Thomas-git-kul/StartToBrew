import { useState, useMemo, useEffect } from "react";
import { View, ScrollView, Image, Pressable, Dimensions, Text, TextInput } from "react-native";
import { Button, Snackbar, ActivityIndicator } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useFonts } from "@/hooks/use-fonts";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { CirclePlus, CircleMinus } from "lucide-react-native";
import { supabase } from "@/supabase";
import Spinner from "@/components/spinner";
import { useAppRefresh } from "@/context/AppRefreshContext";
import PrimaryButton from "@/components/primaryButton";
import SecondaryButton from "@/components/secondaryButton";

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
  5: require("@/assets/images/equipment.png"),
  6: require("@/assets/images/measurement.png"),
};

export default function StoreItem() {
  useFonts();

  const router = useRouter();
  const { triggerRefresh } = useAppRefresh();
  const { id, categoryNumber, from, recipe_slug } = useLocalSearchParams() as { id?: string, categoryNumber?: number, from?: string, recipe_slug?: string };
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState("1");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Format price in Euro
  const formatter = useMemo(
    () => new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }),
    []
  );

  // Calculate total price dynamically
  const totalPrice = useMemo(
    () => (item?.price ?? 0) * parseInt(quantity),
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
      let { data: cart, error: cartError } = await supabase
        .from("shopping_carts")
        .select("id_cart")
        .eq("user_id", userId)
        .maybeSingle();

      if (cartError) {
        console.error("Error fetching shopping cart:", cartError.message);
        return;
      }

      if (!cart) {
        const { data: newCart, error: createError } = await supabase
          .from("shopping_carts")
          .insert({ user_id: userId })
          .select()
          .single();

        if (createError) {
          console.error("Error creating shopping cart:", createError.message);
          return;
        }

        cart = newCart;
      }

      const cartId = cart.id_cart;
      const { data: existingItem, error: existingError } = await supabase
        .from("shopping_cart_items")
        .select("id_cart_item, quantity")
        .eq("cart_id", cartId)
        .eq("store_item_id", item.id)
        .eq("starter_kit", isStarterKit)
        .maybeSingle();

      if (existingError && existingError.code !== "PGRST116") {
        console.error("Error checking existing cart item:", existingError.message);
        return;
      }

      if (existingItem) {
        const newQuantity = existingItem.quantity + parseInt(quantity);

        console.log("DEBUG update values:", {
          existingItem,
          existingItemId: existingItem?.id,
          existingQuantity: existingItem?.quantity,
          incomingQuantity: quantity,
          parsedIncoming: Number(quantity),
          newQuantity:
            Number(existingItem?.quantity) + Number(quantity || 0),
        });

        const { error: updateError } = await supabase
          .from("shopping_cart_items")
          .update({ quantity: newQuantity })
          .eq("id_cart_item", existingItem.id_cart_item);

        if (updateError) {
          console.error("Error updating cart quantity:", updateError.message);
          return;
        }
      }
      else {
        const { error: insertError } = await supabase
          .from("shopping_cart_items")
          .insert({
            cart_id: cartId,
            store_item_id: item.id,
            quantity: parseInt(quantity),
            starter_kit: isStarterKit
          });

        if (insertError) {
          console.error("Error inserting cart item:", insertError.message);
          return;
        }
      }

      // UI updates
      setQuantity("1");
      setSnackbarVisible(true);
      triggerRefresh();

    } catch (err: any) {
      console.error("Unexpected order creation error:", err.message ?? err);
    }
  };
    
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setItem(null);
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
  }, [id, categoryNumber]);

  if (loading || !item) {
    return (
      <Spinner 
        title="Loading product..."
      />
    );
  }

  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BASE_COLORS.LIGHT_BG }}>
        {/* Header */}
        <Header
          title="Store"
          iconName="ShoppingCart"
          onIconPress={() =>
            router.push({
              pathname: "/ShoppingCart",
              params: {
                from: "storeitem",
                beforeFrom: from,
                id: id,
                categoryId: categoryNumber,
              },
            })
          }
          actionTestID="cart-button"
          showCartCount={true}
          iconNameLeft="ArrowLeft"
          actionTestIDLeft="back-button"
          onIconPressLeft={() => {
            if (from === "cart") {
              router.push("/ShoppingCart");
            } else if (from === "specificrecipe") {
              router.push({
                pathname: "/SpecificRecipe",
                params: { recipe_slug: recipe_slug }
              });
            } else {
              router.push("/Store");
            }
          }}
        />

        {/* Scrollable Content */}
        <ScrollView 
          className="flex-1 mx-3" 
          showsVerticalScrollIndicator={false}
        >
          <ThemedText type="titleBlack">{item?.name ?? (loading ? "Loading…" : "Item")}</ThemedText>
          <View
            style={{
              height: IMAGE_HEIGHT,
              borderRadius: 20,
              overflow: "hidden",
              shadowColor: BASE_COLORS.STONE700,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
            }}
          >
            <Image
              source={item?.images && item.images.length > 0 ? item.images[0].source : require("@/assets/images/Premiumkit.png")}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </View>
          
          {/* Product information */}
          <ThemedText
            type="titleBlack"
            style={{ 
              color: BASE_COLORS.ACCENT_PRIMARY, 
              marginBottom: 8,
            }}
          >
            {formatter.format(totalPrice)}
          </ThemedText>
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
          <View className="flex-row justify-between">
            <Pressable
              testID="quantity-minus"
              onPress={() => {
                const newQuantity = Math.max(1, parseInt(quantity) - 1);
                setQuantity(newQuantity.toString());
              }}
              hitSlop={8}
              style={{ justifyContent: "center", alignItems: "center"}}
            >
              <CircleMinus size={30} color={BASE_COLORS.STONE500} />
            </Pressable>
            
            <TextInput
              value={quantity.toString()}
              inputMode="numeric"
              // autoFocus={true}
              enterKeyHint="done"
              maxLength={2}
              onChangeText={(text) => {
                const sanitized = text.replace(/[^0-9]/g, "");
                setQuantity(sanitized === "" ? "1" : sanitized);
              }}
              selectionColor={BASE_COLORS.ACCENT_PRIMARY}
              style={{
                width: 60,
                height: 40,
                textAlign: "center",
                fontFamily: FontFamilies.BODY,
                fontSize: Math.min(20 * scale, 26),
                color: BASE_COLORS.STONE700,
                paddingVertical: 0,
              }}
            />

            <Pressable
              testID="quantity-plus"
              onPress={() => {
                const newQuantity = parseInt(quantity) + 1;
                setQuantity(newQuantity.toString());
              }}
              hitSlop={8}
              style={{ justifyContent: "center", alignItems: "center" }}
            >
              <CirclePlus size={30} color={BASE_COLORS.STONE500} />
            </Pressable>
          </View>

          <PrimaryButton
            title="Add to order"
            testID="add-to-order"
            onPress={handleAddToOrder}
            size={18}
          />
        </View>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={2000}
          style={{
            backgroundColor: BASE_COLORS.WHITE,
            marginBottom: 80,
            shadowColor: BASE_COLORS.STONE700,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.07,
          }}
        >
          <View className="flex-row justify-between">
            <Text 
                style={{ 
                  fontSize: Math.min(18 * scale, 26),
                  fontFamily: FontFamilies.BODY,
                  color: BASE_COLORS.STONE600,
                }}
              >Item added to cart</Text>
            <SecondaryButton
              title="Back"
              testID="added-back"
              onPress={() => {
                if (from === "cart") {
                  router.push("/ShoppingCart");
                } else if (from === "specificrecipe") {
                  router.push({
                    pathname: "/SpecificRecipe",
                    params: { recipe_slug: recipe_slug }
                  });
                } else {
                  router.push("/Store");
                }
              }}
            />
          </View>
        </Snackbar>
      </SafeAreaView>
    );
}
