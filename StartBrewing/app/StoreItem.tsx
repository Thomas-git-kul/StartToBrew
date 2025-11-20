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

  /*
  try {
    // 1. Haal de gebruikerssessie op om de user_id te krijgen
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("User:", user);

    if (userError || !user) {
      console.error("Error fetching user for brew:", userError?.message);
      return;
    }

    // 2. Zoek de fase met de laagste positie (de eerste fase)
    const { data: phasesData, error: phasesError } = await supabase
      .from("phases")
      .select("phase_id")
      .eq("recipe_slug", slug)
      .order("position", { ascending: true });

    if (phasesError || !phasesData?.length) {
      console.error("Error fetching phases:", phasesError?.message || "No phases found.");
      return;
    }

    interface Phase {
      phase_id: string;
    }

    const phaseIds = phasesData.map((p: Phase) => p.phase_id);

    // 3. Haal de eerste stap van de eerste fase
    const { data: firstStepData, error: firstStepError } = await supabase
      .from("steps")
      .select("step_id")
      .eq("phase_id", phaseIds[0])
      .is("after_step_id", null) // startstap
      .limit(1)
      .single();

    if (firstStepError || !firstStepData) {
      console.error("Error finding first step:", firstStepError?.message || "No starting step found.");
      return;
    }

    const firstStepId = firstStepData.step_id;
    console.log("First step:", firstStepId);

    // 4. Voer INSERT uit in brews
    const newBrew = {
      user_id: user.id,
      name: recipe.name,
      start_date: new Date().toISOString(),
      status_id: 1,
      recipe_slug: slug,
      last_step_id: firstStepId,
    };

    const { data: brewData, error: insertError } = await supabase
      .from("brews")
      .insert([newBrew])
      .select();

    if (insertError || !brewData?.length) {
      console.error("Error inserting brew:", insertError?.message);
      return;
    }

    const brewId = brewData[0].id_brew;
    console.log("New brew started successfully:", brewId);

    // 5. Haal alle stappen van alle fases
    const { data: allSteps, error: stepsError } = await supabase
      .from("steps")
      .select("step_id, after_step_id")
      .in("phase_id", phaseIds)

    if (stepsError || !allSteps?.length) {
      console.error("Error fetching steps:", stepsError?.message || "No steps found.");
      return;
    }

    interface Step {
      step_id: string;
      after_step_id: string | null;
    }

    const orderedSteps: Step[] = [];
    let currentStep = allSteps.find((s: Step) => s.after_step_id === null);

    while (currentStep) {
      // Voeg zowel step_id als after_step_id toe
      orderedSteps.push({ 
        step_id: currentStep.step_id, 
        after_step_id: currentStep.after_step_id 
      });
      
      currentStep = allSteps.find((s: Step) => s.after_step_id === currentStep.step_id);
    }


    // 6. Voeg alle stappen toe aan brew_steps
    const brewSteps = allSteps.map((step: { step_id: string }) => ({
      id_brew: brewId,
      step_id: step.step_id,
      status: "pending",
      completed_at: null,
    }));

    const { error: brewStepsError } = await supabase
      .from("brew_steps")
      .insert(brewSteps);

    if (brewStepsError) {
      console.error("Error inserting brew_steps:", brewStepsError.message);
    } else {
      console.log("All brew steps added successfully!");
    }

    // 7. Navigeer naar progress
    router.push("../progress");

  } catch (e: any) {
    console.error("Exception during brew start:", e.message ?? e);
  }
};
*/
  
  useEffect(() => {
    console.log("id from last page:", id);
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

        console.log("Category ID:", data?.category_id);
        console.log("Example Image:", exampleImages[data?.category_id]);

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

    useEffect(() => {
      console.log("Item:", item);
    }, [item]);

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
                console.log("Image URI:", image?.source?.uri); // Log the URI of the image
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
            onPress={() =>
              router.push({
                pathname: "/Store",
                params: {
                  id: item?.id,
                  title: item?.name,
                  quantity,
                  price: totalPrice,
                },
              })
            }
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
