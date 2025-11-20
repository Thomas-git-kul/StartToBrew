import { useState, useEffect } from "react";
import { View, Image, ScrollView, TouchableOpacity } from "react-native";
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
import { Star } from "lucide-react-native";
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

  const [reviewVisible, setReviewVisible] = useState(false);
  const [rating, setRating] = useState(0);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleStarPress = (value: number) => {
    setRating(value);
    setTimeout(() => setReviewVisible(false), 300);
  };

  useEffect(() => {
    if (!recipe_slug) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Recipe details
        const { data: recipeData, error: recipeError } = await supabase
          .from("recipes")
          .select(
            "recipe_slug, name, style, batch_size_l, abv_target, ibu_target, srm_target, description, difficulty, rating, haze_level"
          )
          .eq("recipe_slug", recipe_slug)
          .single();

        if (recipeError) {
          throw recipeError;
        }

        // Ingredients via function
        const { data: ingredientData, error: ingredientError } =
          await supabase.rpc("get_recipe_ingredients", {
            _recipe_slug: recipe_slug,
          });

        if (ingredientError) {
          throw ingredientError;
        }

        setRecipe(recipeData as Recipe);
        setIngredients((ingredientData || []) as IngredientRow[]);
      } catch (e: any) {
        setError(e.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    recipe?.rating != null ? (recipe.rating / 10).toFixed(1) : "4.8"; // pas aan naar jouw logica
  const reviewCount = 265; // later te vervangen door echte count uit recipe_reviews

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
        title={recipe?.name ?? "Recipe"}
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
