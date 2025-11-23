import { useState, useEffect } from "react";
import { View, Image, ScrollView, TouchableOpacity, Alert, Dimensions } from "react-native";
import {FAB, Modal, Portal, Chip, ActivityIndicator, Button } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/header";
import { useFonts } from "@/hooks/use-fonts";
import { Star, Wheat, Hop, } from "lucide-react-native";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/supabase";
import { useFavorites } from "@/context/FavoritesContext";
import { getBeerImageSource } from "@/hooks/beer-image";
import StoreCard from "@/components/ui/StoreCard";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

type Recipe = {
  recipe_slug: string;
  name: string;
  style: string | null;
  batch_size_l: number | null;
  abv_target: number | null;
  ibu_target: number | null;
  srm_target: number | null;
  description: string | null;
  difficulty: number | null;
  rating: number | null;
  haze_level: number | null; // 1 = clear, 2 = light haze, 3 = hazy
};

type IngredientRow = {
  ingredient_id: string;
  ingredient_name: string;
  kind: string;
  amount_g: number | null;
};

export default function SpecificRecipe() {
  useFonts();

  const router = useRouter();
  const { recipe_slug } = useLocalSearchParams<{ recipe_slug?: string }>();

  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<{
    recipe_slug: string;
    name: string;
    style: string;
    batch_size_l: number;
    abv_target: number;
    ibu_target: number;
    srm_target: number;
    description: string;
    difficulty: number;
    rating: number;
    haze_level: number;
  } | null>(null);

  const [reviewVisible, setReviewVisible] = useState(false);
  const [rating, setRating] = useState(0);

  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const { favoriteSlugs, toggleFavorite } = useFavorites();
  const isFavorite = recipe_slug ? (favoriteSlugs || []).includes(String(recipe_slug)) : false;
  const [isFavoriteIconFilled, setIsFavoriteIconFilled] = useState(isFavorite);
  const [kits, setKits] = useState<any[]>([]);

  const handleToggleFavorite = async () => {
    if (!recipe_slug) return;
    try {
      await toggleFavorite(String(recipe_slug));
      setIsFavoriteIconFilled((prev) => !prev);
    } catch (e: any) {
      Alert.alert("Favorite failed", e?.message ?? "Could not toggle favorite");
    }
  };

  // Check if current logged-in user already reviewed this recipe
  const checkUserReviewed = async (slugToCheck: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) {
        setHasUserReviewed(false);
        return;
      }
      const { data: existingReview } = await supabase
        .from("recipe_reviews")
        .select("rating")
        .eq("recipe_slug", slugToCheck)
        .eq("account_id", user.id)
        .maybeSingle();
      setHasUserReviewed(!!existingReview);
    } catch {
      // Fail silently – keep previous state
    }
  };

  // Herbruikbare fetch functie (recept + ingrediënten + reviews)
  const fetchRecipeBundle = async (slug: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .select(
          "recipe_slug, name, style, batch_size_l, abv_target, ibu_target, srm_target, description, difficulty, rating, haze_level"
        )
        .eq("recipe_slug", slug)
        .single();

      if (recipeError) throw recipeError;

      const { data: ingredientData, error: ingredientError } = await supabase.rpc(
        "get_recipe_ingredients",
        { _recipe_slug: slug }
      );
      if (ingredientError) throw ingredientError;

      const { data: reviewsData, error: reviewsError } = await supabase
        .from("recipe_reviews")
        .select("rating")
        .eq("recipe_slug", slug);
      if (reviewsError) throw reviewsError;

      const count = (reviewsData || []).length;
      const avg = count
        ? (reviewsData!.reduce((s: any, r: any) => s + (r.rating ?? 0), 0) / count)
        : null;

      const recipeWithRating = recipeData
        ? { ...recipeData, rating: avg != null ? parseFloat(avg.toFixed(2)) : recipeData.rating }
        : null;

      setRecipe(recipeWithRating);
      setIngredients((ingredientData || []) as IngredientRow[]);
      setReviewCount(count);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleStarPress = async (value: number) => {
    if (!recipe_slug) return;
    setRating(value);
    try {
      // Controleer of user sessie aanwezig is (web en native)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const user = sessionData?.session?.user;
      if (!user) {
        Alert.alert("Login vereist", "Log eerst in om een review te plaatsen.");
        return;
      }

      // Controleer of de ingelogde user al een review voor dit recept heeft
      const { data: existingReview, error: existingError } = await supabase
        .from("recipe_reviews")
        .select("rating")
        .eq("recipe_slug", recipe_slug)
        .eq("account_id", user.id)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existingReview) {
        Alert.alert("Review bestaat al", "Je hebt dit recept al beoordeeld.");
        setHasUserReviewed(true); // direct UI update
        setReviewVisible(false);
        return;
      }

      // Insert nieuwe review met account_id (jouw DB gebruikt `account_id`)
      const { error: insertError } = await supabase.from("recipe_reviews").insert({
        recipe_slug: recipe_slug,
        rating: value,
        account_id: user.id,
      });
      if (insertError) {
        throw insertError;
      }

      // Na succesvolle insert: herbereken gemiddelde en count en update recepten-tabel
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("recipe_reviews")
        .select("rating")
        .eq("recipe_slug", recipe_slug);
      if (reviewsError) throw reviewsError;

      const count = (reviewsData || []).length;
      const avg = count
        ? (reviewsData!.reduce((s: any, r: any) => s + (r.rating ?? 0), 0) / count)
        : null;

      // Werk de aggregate kolommen in recipes bij
      const updatePayload: any = {};
      if (avg != null) updatePayload.rating = parseFloat(avg.toFixed(2));
      updatePayload.review_count = count;

      const { error: updateError } = await supabase
        .from("recipes")
        .update(updatePayload)
        .eq("recipe_slug", recipe_slug);
      if (updateError) throw updateError;

      // Refetch local bundle voor UI
      await fetchRecipeBundle(recipe_slug);
      // Markeer dat user nu gereviewd heeft en dubbelcheck
      setHasUserReviewed(true);
      checkUserReviewed(recipe_slug);
    } catch (e: any) {
      Alert.alert("Review mislukt", e.message ?? "Onbekende fout bij opslaan review");
    } finally {
      setReviewVisible(false);
    }
  };

  const brewRecipe = async () => {
    if (!recipe_slug || !recipe?.name) {
      console.warn("Cannot start brew: missing slug or recipe name.");
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Error fetching user for brew:", userError?.message);
        return;
      }

      const { data: phasesData, error: phasesError } = await supabase
        .from("phases")
        .select("phase_id")
        .eq("recipe_slug", recipe_slug)
        .order("position", { ascending: true });

      if (phasesError || !phasesData?.length) {
        console.error("Error fetching phases:", phasesError?.message || "No phases found.");
        return;
      }

      interface Phase {
        phase_id: string;
      }

      const phaseIds = phasesData.map((p: Phase) => p.phase_id);

      const { data: firstStepData, error: firstStepError } = await supabase
        .from("steps")
        .select("step_id")
        .eq("phase_id", phaseIds[0])
        .is("after_step_id", null)
        .limit(1)
        .single();

      if (firstStepError || !firstStepData) {
        console.error("Error finding first step:", firstStepError?.message || "No starting step found.");
        return;
      }

      const firstStepId = firstStepData.step_id;

      const newBrew = {
        user_id: user.id,
        name: recipe.name,
        start_date: new Date().toISOString(),
        status_id: 1,
        recipe_slug: recipe_slug,
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

      const { data: allSteps, error: stepsError } = await supabase
        .from("steps")
        .select("step_id, after_step_id")
        .in("phase_id", phaseIds);

      if (stepsError || !allSteps?.length) {
        console.error("Error fetching steps:", stepsError?.message || "No steps found.");
        return;
      }

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
      }

      router.push("../progress");
    } catch (e: any) {
      console.error("Exception during brew start:", e.message ?? e);
    }
  };

  const fetchStarterKits = async (slug: string) => {
    try {
      const { data, error } = await supabase
      .from("recipe_kits")
      .select(`
        id_starter_kit,
        starter_kit:starter_kits (
          name,
          description,
          size_liters,
          price,
          is_active
        )
      `)
      .eq("recipe_slug", slug);

      // console.log("Starterkits response:", data, "error:", error);

      if (error) throw error;

      // flatten
      const kits = data?.map((row: any) => ({
        id: row.id_starter_kit,
        ...row.starter_kit
      }));
      setKits(kits);

    } catch (e: any) {
      console.error("Error fetching kits:", e.message);
      return [];
    }
  };

  useEffect(() => {
    if (!recipe_slug) return;
    fetchRecipeBundle(recipe_slug);
    checkUserReviewed(recipe_slug);
    fetchStarterKits(recipe_slug);
  }, [recipe_slug]);

  const hazeLevels: Record<number, String> = {
    1: "clear",
    2: "light haze",
    3: "hazy",
  }

  const chips: { key: string; label: string }[] = [];
  if (recipe?.style) chips.push({ key: "style", label: recipe.style });
  if (recipe?.abv_target != null)
    chips.push({ key: "abv", label: `${recipe.abv_target.toFixed(1)}% ABV` });
  if (recipe?.ibu_target != null)
    chips.push({ key: "ibu", label: `${recipe.ibu_target} IBU` });
  if (recipe?.srm_target != null)
    chips.push({ key: "srm", label: `${recipe.srm_target} SRM` });
  if (recipe?.batch_size_l != null)
    chips.push({
      key: "batch",
      label: `${recipe.batch_size_l} L batch`,
    });
  if (recipe?.difficulty != null) {
    const stars =
      "★".repeat(recipe.difficulty) + "☆".repeat(3 - recipe.difficulty);
    chips.push({ key: "difficulty", label: `Difficulty ${stars}` });
  }
  if (recipe?.haze_level != null) {
    const haze = hazeLevels[recipe.haze_level] || "clear";
    chips.push({ key: "haze", label: haze as string });
  }
  
  const displayedRating =
    recipe?.rating != null && !Number.isNaN(recipe.rating)
      ? recipe.rating.toFixed(2)
      : "0.00";

  // Bepaal image source o.b.v. haze + srm (valt terug op default-image in util)
  const beerImageSource =
    recipe != null
      ? getBeerImageSource(recipe.haze_level, recipe.srm_target)
      : require("@/assets/images/default-beer.png");

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
    >
      <Header
        title="Recipe"
        iconName={isFavoriteIconFilled ? "Heart" : "HeartPlus"}
        filled={isFavoriteIconFilled}
        onIconPress={handleToggleFavorite}
        actionTestID="heart-button"
      />
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator 
            animating size="large"
            color={BASE_COLORS.ACCENT_PRIMARY} 
          />
          <ThemedText type="defaultText" className="mt-3">
            Loading recipe...
          </ThemedText>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <ThemedText type="title" className="mb-2 text-center">Oops</ThemedText>
          <ThemedText type="defaultText" className="text-center">{error}</ThemedText>
        </View>
      ) : (
        <ScrollView
          className="flex-1 mx-3"
          contentContainerStyle={{ paddingBottom: 70 }}
          showsVerticalScrollIndicator={false}
        >
          
          {/* Title */}
          <View>
            <ThemedText type="titleBlack">{recipe?.name}</ThemedText>
          </View>

          {/* Image */}
          <View className="items-center mb-5">
            <View
              style={{
                width: "100%",
                aspectRatio: 3 / 4, 
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <Image
                source={beerImageSource}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Rating */}
          <View className="flex-row mb-5 gap-2 items-center">
            <Star
              size={Math.min(22 * scale, 35)}
              color={BASE_COLORS.ACCENT_LIGHT}
              fill={BASE_COLORS.ACCENT_LIGHT}
            />
            <ThemedText type="subTitle">{displayedRating} / 5</ThemedText>
            <ThemedText type="subTitle">({reviewCount} reviews)</ThemedText>
            {hasUserReviewed ? (
              <ThemedText
                type="subTitle"
                testID="already-reviewed-label"
                style={{ 
                  position: "absolute",
                  right: 0, 
                }}
              >You reviewed ✓</ThemedText>
            ) : (
              <Button
                testID="review-button"
                onPress={() => setReviewVisible(true)}
                style={{
                  position: "absolute",
                  right: 0,
                }}
              >
                <ThemedText type="subTitle" style={{ color: BASE_COLORS.TEXT_DARK }}>Add Review</ThemedText>
              </Button>
              /*
             <Button
                onPress={() => setReviewVisible(true)}
                labelStyle={{ 
                  fontSize: Math.min(12 * scale, 24),
                  color: BASE_COLORS.STONE700,
                  fontFamily: FontFamilies.BODY_LIGHT,            
                }}
                style={{
                  position: "absolute",
                  right: 0,
                  borderRadius: 20,
                  backgroundColor: BASE_COLORS.AMBER200,
                }}
              >Add Review</Button>
              */
            )}
          </View>

          {/* Specs chips */}
          {chips.length > 0 && (
            <View className="flex-row flex-wrap gap-x-2 gap-y-2 mb-5">
              {chips.map((chip) => (
                <Chip
                  key={chip.key}
                  mode="flat"
                  compact
                  style={{
                    backgroundColor: BASE_COLORS.STONE200,
                    borderWidth: 0,
                  }}
                  textStyle={{
                    fontFamily: FontFamilies.BODY,
                    fontSize: Math.min(12 * scale, 18),
                    color: BASE_COLORS.TEXT_DARK,
                  }}
                >{chip.label}</Chip>
              ))}
            </View>
          )}
                
          {/* Description */}
          {recipe?.description && (
            <ThemedText type="defaultText" className="mb-3">
              {recipe.description}
            </ThemedText>
          )}

          {/* Ingredients */}
          <View className="mt-2 mb-4">
            <ThemedText type="defaultText" className="">Ingredients:</ThemedText>
            {ingredients.length === 0 ? (
              <ThemedText type="defaultText">No ingredients found for this recipe.</ThemedText>
            ) : (
              ingredients.map((item) => (
                <View
                  key={item.ingredient_id}
                  className="flex-row items-start mt-2 ml-3 gap-3"
                >
                  <ThemedText type="defaultText">•</ThemedText>
                  <ThemedText type="defaultText">
                    {item.amount_g != null ? `${item.amount_g} g ` : ""}
                    {item.ingredient_name} {item.kind ? `(${item.kind})` : ""}
                  </ThemedText>
                </View>
              ))
            )}
          </View>

          {/* Starterkit */}
          <View className="mt-2 mb-4">
            <ThemedText type="title" className="">Get your StarterKit now!</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
            >
              {kits.length === 0 ? (
                <ThemedText type="defaultText" className="ml-1">No starter kits available for this recipe.</ThemedText>
              ) : (
                kits.map((kit) => (
                  <StoreCard
                    key={kit.id_starter_kit}
                    image={require("@/assets/images/starterkit2.png")}
                    title={`${kit.name} • ${kit.size_liters}L`}
                    price={`$${kit.price.toFixed(2)}`}
                    onPress={() => router.push(`/store/starter-kit/${kit.id_starter_kit}`)}
                  />
                ))
              )}
            </ScrollView>
          </View>
        </ScrollView>
      )}

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
          <ThemedText type="title" className="text-center mb-4">
            Rate this recipe
          </ThemedText>

          <View className="flex-row justify-center gap-3">
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => handleStarPress(value)}
                testID={`star-${value}`}
              >
                <Star
                  size={36}
                  stroke={
                    value <= rating
                      ? BASE_COLORS.ACCENT_LIGHT
                      : BASE_COLORS.STONE300
                  }
                  fill={
                    value <= rating ? BASE_COLORS.ACCENT_LIGHT : "transparent"
                  }
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
          mode="flat"
          label="Start Brewing"
          color={BASE_COLORS.WHITE}
          onPress={brewRecipe}
          style={{
            backgroundColor: BASE_COLORS.TEXT_DARK,
            borderRadius: 30,
          }}
          theme={{
            fonts: {
              labelLarge: {
                fontSize: Math.min(16 * scale, 24),
                fontFamily: FontFamilies.BODY,
              },
            },
          }}
        />
      </View>
    </SafeAreaView>
  );
}
