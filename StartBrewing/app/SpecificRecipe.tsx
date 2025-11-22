import { useState, useEffect } from "react";
import { View, Image, ScrollView, TouchableOpacity, Alert } from "react-native";
import {
  FAB,
  Modal,
  Portal,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/header";
import { useFonts } from "@/hooks/use-fonts";
import { Star, Heart, HeartPlus } from "lucide-react-native";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/supabase";
import { getBeerImageSource } from "@/hooks/beer-image";

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

  const { slug } = useLocalSearchParams() as { slug?: string };

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
  const [isFavorite, setIsFavorite] = useState(false);

  const handleToggleFavorite = () => {
    setIsFavorite((prev) => !prev);
    // Hier kun je eventueel een API-call doen om de favorite op te slaan
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

  useEffect(() => {
    if (!recipe_slug) return;

    fetchRecipeBundle(recipe_slug);
    checkUserReviewed(recipe_slug);
  }, [recipe_slug]);

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
        title={recipe?.name ?? (loading ? "Loading…" : "Recipe")}
        iconName="ArrowRight"
        onIconPress={() => router.push("/Recipes" as any)}
        actionTestID="cart-button"
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator animating size="large" />
          <ThemedText type="defaultText" className="mt-3">
            Loading recipe...
          </ThemedText>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <ThemedText type="title" className="mb-2 text-center">
            Oops
          </ThemedText>
          <ThemedText type="defaultText" className="text-center">
            {error}
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          className="flex-1 mx-3"
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Image */}
          <View className="items-center mb-5">
            <View
              style={{
                width: "100%",
                aspectRatio: 3 / 4, // bredere dan hoog; pas aan naar smaak
                borderRadius: 16,
                overflow: "hidden", // alles buiten de hoekjes afknippen
              }}
            >
              <Image
                source={beerImageSource}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                resizeMode="cover" // vult box en cropt waar nodig
              />
            </View>
          </View>

          {/* Rating */}
          <View className="flex-row items-center justify-center mb-3 gap-2">
            <Star
              size={22}
              color={BASE_COLORS.ACCENT_LIGHT}
              fill={BASE_COLORS.ACCENT_LIGHT}
            />
            <ThemedText type="subTitle">{displayedRating} / 5</ThemedText>
            <ThemedText type="subTitle">({reviewCount} reviews)</ThemedText>
            {hasUserReviewed ? (
              <ThemedText
                type="subTitle"
                testID="already-reviewed-label"
                style={{ marginLeft: 8 }}
              >
                You reviewed ✓
              </ThemedText>
            ) : (
              <TouchableOpacity
                onPress={() => setReviewVisible(true)}
                style={{
                  marginLeft: 8,
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                }}
              >
                <ThemedText type="subTitle">Add Review</ThemedText>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={handleToggleFavorite}
              accessibilityLabel={`favorite-${recipe?.name ?? "recipe"}`}
              hitSlop={8}
              style={{ marginLeft: 12 }}
            >
              {isFavorite ? (
                <Heart
                  size={24}
                  stroke={BASE_COLORS.ACCENT_PRIMARY}
                  fill={BASE_COLORS.ACCENT_PRIMARY}
                />
              ) : (
                <HeartPlus size={24} stroke={BASE_COLORS.STONE300} />
              )}
            </TouchableOpacity>
          </View>

          {/* Specs chips */}
          {chips.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-4">
              {chips.map((chip) => (
                <Chip
                  key={chip.key}
                  mode="flat"
                  style={{
                    backgroundColor: BASE_COLORS.STONE300,
                    borderRadius: 999,
                    borderWidth: 0,
                  }}
                  textStyle={{
                    fontFamily: FontFamilies.BODY,
                    fontSize: 13,
                    color: BASE_COLORS.TEXT_DARK,
                  }}
                >
                  {chip.label}
                </Chip>
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
            <ThemedText type="title" className="mb-2">
              Ingredients
            </ThemedText>

            {ingredients.length === 0 ? (
              <ThemedText type="defaultText">
                No ingredients found for this recipe.
              </ThemedText>
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
          mode="elevated"
          label="Start Brewing"
          color={BASE_COLORS.WHITE}
          onPress={() => router.push("../progress")}
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
}
