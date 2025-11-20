import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { FAB, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { useFonts } from "@/hooks/use-fonts";
import BeerCard from "@/components/ui/RecipeCard";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { BASE_COLORS } from "@/constants/Colors";
import { Plus } from "lucide-react-native";
import ProgressCard from "@/components/ui/ProgressCard";
import { supabase } from "@/supabase";
import { getBeerImageSource } from "@/hooks/beer-image"; // <<< zelfde util als SpecificRecipe/Recipes

interface Beer {
  recipe_slug: string;
  name: string;
  rating: number;
  reviews: number;
  image: any; // React Native image source
  description: string | null;
  style: string | null;
}

export default function HomePage() {
  useFonts();
  const router = useRouter();

  const [beers, setBeers] = useState<Beer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularRecipes = async () => {
      try {
        setLoading(true);
        setError(null);

        // haal populaire recepten op, nu met haze + srm
        const { data, error } = await supabase
          .from("recipes")
          .select(
            "recipe_slug, name, description, rating, style, haze_level, srm_target"
          )
          .order("rating", { ascending: false })
          .limit(5);

        if (error) throw error;

        const mapped: Beer[] = (data || []).map((r: any) => ({
          recipe_slug: r.recipe_slug,
          name: r.name,
          rating: r.rating ?? 0,
          reviews: 0, // later: count(recipe_reviews)
          image: getBeerImageSource(r.haze_level, r.srm_target),
          description: r.description ?? null,
          style: r.style ?? null,
        }));

        setBeers(mapped);
      } catch (e: any) {
        setError(
          e.message ??
            "Er ging iets mis bij het laden van de populaire recepten."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPopularRecipes();
  }, []);

  return (
    <View className="flex-1">
      <Header title="StartToBrew" />

      <ScrollView style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
        {/* In progress section voorlopig statisch */}
        <ThemedText type="title">In progress</ThemedText>
        <View>
          <ProgressCard
            title="Hazy IPA"
            progress={0.3}
            onPress={() => router.push("/progress")}
          />
          <ProgressCard
            title="Belgian Tripel"
            progress={0.65}
            onPress={() => router.push("/progress")}
          />
          <ProgressCard
            title="American Pale Ale"
            progress={0.85}
            onPress={() => router.push("/progress")}
          />
        </View>

        <ThemedText type="title">Popular recipes</ThemedText>

        {loading ? (
          <View className="items-center justify-center my-4">
            <ActivityIndicator animating size="small" />
            <ThemedText type="defaultText" className="mt-2">
              Loading recipes...
            </ThemedText>
          </View>
        ) : error ? (
          <View className="items-center justify-center my-4 px-6">
            <ThemedText type="defaultText" className="text-center">
              {error}
            </ThemedText>
          </View>
        ) : (
          <View>
            {beers.map((beer) => (
              <BeerCard
                key={beer.recipe_slug}
                {...beer}
                onPress={() =>
                  router.push({
                    pathname: "/SpecificRecipe",
                    params: { recipe_slug: beer.recipe_slug },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon={(props) => <Plus size={props.size} color={props.color} />}
        testID="fab"
        style={{
          position: "absolute",
          right: 10,
          bottom: 25,
          backgroundColor: BASE_COLORS.TEXT_DARK,
          borderRadius: 20,
        }}
        color={BASE_COLORS.LIGHT_BG}
        onPress={() => router.push("/Recipes")}
        mode="elevated"
        size="medium"
      />
    </View>
  );
}
