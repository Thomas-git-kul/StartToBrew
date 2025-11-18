import { useState, useEffect } from "react";
import { View, Image, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { FAB, Modal, Portal, Button } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../supabase";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/header";
import { useFonts } from "@/hooks/use-fonts";
import { Star } from "lucide-react-native";
import { ThemedText } from "@/components/themed-text";

export default function SpecificRecipe() {
  useFonts()

  const router = useRouter();

  const { slug } = useLocalSearchParams() as { slug?: string };

  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<{
    name: string;
    description: string;
    rating: number;
    reviews?: number;
  } | null>(null);

  const [reviewVisible, setReviewVisible] = useState(false);
  const [rating, setRating] = useState(0);

  const handleStarPress = (value: number) => {
    setRating(value);
    setTimeout(() => setReviewVisible(false), 300);
  };

  const brewRecipe = async () => {
    if (!slug || !recipe?.name) {
      console.warn("Cannot start brew: missing slug or recipe name.");
      return;
    }
    console.log("Starting brewing brewRecipe");

    try {
      // 1. Haal de gebruikerssessie op om de user_id te krijgen
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log("User:", user);

      if (userError || !user) {
        console.error("Error fetching user for brew:", userError?.message);
        return;
      }

      // Zoek de fase met de laagste positie (de eerste fase)
      const { data: phasesData, error: phaseError } = await supabase
        .from("phases")
        .select("phase_id")
        .eq("recipe_slug", slug)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (phaseError || !phasesData) {
        console.error("Error finding first phase:", phaseError?.message || "No phases found.");
        return;
      }

      const firstPhaseId = phasesData.phase_id;
      console.log("First phase:", firstPhaseId);

      // Zoek de eerste stap van die fase (step waar after_step_id NULL is)
      const { data: stepData, error: stepError } = await supabase
        .from("steps")
        .select("step_id")
        .eq("phase_id", firstPhaseId)
        .is("after_step_id", null) // Dit markeert de startstap van een flow
        .limit(1)
        .maybeSingle();
        
      if (stepError || !stepData) {
        console.error("Error finding first step:", stepError?.message || "No starting step found.");
        return;
      }

      const firstStepId = stepData.step_id;
      console.log("First step:", firstStepId);

      // 2. Bepaal de waarden voor de INSERT
      const newBrew = {
        user_id: user.id,
        name: recipe.name, // Gebruik de naam van het recept
        start_date: new Date().toISOString(), // Huidige tijd in ISO-formaat
        status_id: 1, // Standaardstatus ID (bv. 'Started', aannemend dat 1 de ID voor 'Started' is)
        recipe_slug: slug, // De slug van het geselecteerde recept
        last_step_id : firstStepId, // De eerste stap van de eerste fase
      };

      // 3. Voer de INSERT uit
      const { data: brewData, error: insertError } = await supabase
        .from("brews")
        .insert([newBrew])
        .select(); // Selecteer het ingevoegde record om te bevestigen

      if (insertError) {
        console.error("Supabase insert brew error:", insertError.message);
        // Optioneel: toon een foutmelding aan de gebruiker
      } else {
        console.log("New brew started successfully:", brewData[0].id_brew);
        // 4. Navigeer naar het volgende scherm
        router.push("../progress");
      }
    } catch (e: any) {
      console.error("Exception during brew start:", e.message ?? e);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("recipes")
          .select("name,description,rating")
          .eq("recipe_slug", String(slug))
          .maybeSingle();

        if (error) {
          console.warn("Supabase fetch recipe error:", error.message);
          if (mounted) setRecipe(null);
        } else if (data) {
          if (mounted)
            setRecipe({
              name: data.name ?? "Untitled Recipe",
              description: data.description ?? "",
              rating: typeof data.rating === "number" ? data.rating : Number(data.rating ?? 0),
              reviews: 0,
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
  }, [slug]);

  const ingredients = [
    "not yet implemented",
  ];

  return (
    <SafeAreaView
      className="flex-1"
      style={{backgroundColor: BASE_COLORS.LIGHT_BG}}
    >
      <Header
        title={recipe?.name ?? (loading ? "Loading…" : "Recipe")}
        iconName="ArrowRight"
        onIconPress={() => router.push("/Recipes" as any)}
        actionTestID="cart-button"
      />

      <ScrollView className="flex-1 mx-3"
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        <View className="items-center mb-5">
          <Image
            source={require("@/assets/images/default-beer.png")}
            style={{
              width: "100%",
              borderRadius: 16,
            }}
            resizeMode="cover"
          />
        </View>

        {/* Rating */}
        {loading ? (
          <View style={{ alignItems: "center", marginVertical: 16 }}>
            <ActivityIndicator />
          </View>
        ) : (
          <View className="flex-row items-center justify-center mb-4 gap-2">
            <Star size={22} color={BASE_COLORS.ACCENT_LIGHT} fill={BASE_COLORS.ACCENT_LIGHT} />
            <ThemedText type="subTitle">{(recipe?.rating ?? 0).toFixed(1)} / 5</ThemedText>
            <ThemedText type="subTitle">({recipe?.reviews ?? 0} reviews)</ThemedText>
            <TouchableOpacity
              onPress={() => setReviewVisible(true)}
              style={{ marginLeft: 8, paddingVertical: 4, paddingHorizontal: 10 }}
            >
              <ThemedText type="subTitle">Add Review</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Brew Info */}
        <ThemedText type="defaultText" className="mb-3">
          {loading ? "" : recipe?.description ?? ""}
        </ThemedText>

        {/* Ingredients */}
        {ingredients.map((item, index) => (
          <View key={index} className="flex-row items-start mt-2 ml-3 gap-3">
            <ThemedText type="defaultText">•</ThemedText>
            <ThemedText type="defaultText">{item}</ThemedText>
          </View>
        ))}
      </ScrollView>

      {/* Modal for reviews */}
      <Portal>
        <Modal
          visible={reviewVisible}
          onDismiss={() => setReviewVisible(false)}
          contentContainerStyle={{
            backgroundColor: BASE_COLORS.WHITE,
            padding: 20,
            borderRadius: 12,
            marginHorizontal: 30,
          }}
        >
          <ThemedText type="title" className="text-center mb-4">Rate this recipe</ThemedText>

          <View className="flex-row justify-center gap-3">
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity 
                key={value} 
                onPress={() => handleStarPress(value)}
                testID={`star-${value}`}
              >
                <Star
                  size={36}
                  stroke={value <= rating ? BASE_COLORS.ACCENT_LIGHT : BASE_COLORS.STONE300}
                  fill={value <= rating ? BASE_COLORS.ACCENT_LIGHT : "transparent"}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Modal>
      </Portal>

      <View
        style={{
          position: "absolute",
          bottom: 10,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <FAB
          mode="elevated"
          label="Start Brewing"
          color={BASE_COLORS.WHITE}
          onPress={brewRecipe}
          style={{
            backgroundColor: BASE_COLORS.TEXT_DARK,
            borderRadius: 20,
          }}
          theme={{
            fonts: {
              labelLarge: {
                fontSize: 16,
                fontFamily: FontFamilies.BODY,
              },
            },
          }}
        />
      </View>
    </SafeAreaView>
  );
};
