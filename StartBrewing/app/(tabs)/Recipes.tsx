import React, { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { Searchbar, ActivityIndicator } from "react-native-paper";
import { Search, X } from "lucide-react-native";
import BeerCard from "@/components/ui/RecipeCard";
import { BASE_COLORS } from "@/constants/Colors";
import { useRouter } from "expo-router";
import Header from "@/components/header";
import { useFonts } from "@/hooks/use-fonts";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/supabase";
import { getBeerImageSource } from "@/hooks/beer-image";

interface Beer {
  recipe_slug: string;
  name: string;
  rating: number;
  reviews: number;
  image: any; // React Native image source
  description: string | null;
  style: string | null;
}

export default function Recipes() {
  useFonts();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState<Beer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // helper to check whether an item matches the query
  const filterMatches = (item: Beer, q: string) => {
    if (!q) return true;
    const lower = q.toLowerCase();
    return item.name.toLowerCase().includes(lower);
  };

  const toggleFavorite = (slug: string) => {
    // placeholder, hier kan later echte favorite-logica in
    setRecipes((prev) =>
      prev.map((beer) => (beer.recipe_slug === slug ? { ...beer } : beer))
    );
  };

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: recipesData, error: recipesError } = await supabase
          .from("recipes")
          .select(
            "recipe_slug, name, description, rating, haze_level, srm_target, style"
          );

        if (recipesError) throw recipesError;

        const slugs = (recipesData || []).map((r: any) => r.recipe_slug);

        const { data: reviewsData, error: reviewsError } = await supabase
          .from("recipe_reviews")
          .select("recipe_slug, rating")
          .in("recipe_slug", slugs.length ? slugs : [""]);

        if (reviewsError) throw reviewsError;

        // aggregate
        const agg: Record<string, { count: number; avg: number }> = {};
        (reviewsData || []).forEach((r: any) => {
          const slug = r.recipe_slug;
          if (!agg[slug]) agg[slug] = { count: 0, avg: 0 };
          agg[slug].count += 1;
          agg[slug].avg += (r.rating ?? 0);
        });
        Object.keys(agg).forEach((k) => {
          agg[k].avg = agg[k].count ? agg[k].avg / agg[k].count : 0;
        });

        const mapped: Beer[] = (recipesData || []).map((r: any) => {
          const a = agg[r.recipe_slug];
          const avgRating = a ? a.avg : r.rating ?? 0;
          // twee decimalen precisie
          const rating = parseFloat(avgRating.toFixed(2));
          return {
            recipe_slug: r.recipe_slug,
            name: r.name,
            rating,
            reviews: a ? a.count : 0,
            image: getBeerImageSource(r.haze_level, r.srm_target),
            description: r.description ?? null,
            style: r.style ?? null,
          };
        });

        setRecipes(mapped);
      } catch (e: any) {
        console.error("Error loading recipes", e);
        setError(
          e.message ?? "Er ging iets mis bij het laden van de recepten."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  const filteredRecipes = recipes.filter((b) => filterMatches(b, searchQuery));

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: BASE_COLORS.LIGHT_BG,
      }}
    >
      <Header title="Recipes" />

      {/* Searchbar */}
      <Searchbar
        placeholder="Search"
        value={searchQuery}
        onChangeText={setSearchQuery}
        inputStyle={{ color: BASE_COLORS.STONE700 }}
        icon={() => <Search size={20} color={BASE_COLORS.STONE300} />}
        clearIcon={
          searchQuery
            ? () => <X size={18} color={BASE_COLORS.STONE500} />
            : undefined
        }
        onClearIconPress={() => setSearchQuery("")}
        style={{
          backgroundColor: BASE_COLORS.WHITE,
          borderColor: BASE_COLORS.STONE300,
          borderWidth: 1,
          marginBottom: 15,
        }}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator animating size="large" />
          <ThemedText type="defaultText" className="mt-3">
            Loading recipes...
          </ThemedText>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <ThemedText type="title" className="mb-2 text-center">
            Oeps
          </ThemedText>
          <ThemedText type="defaultText" className="text-center">
            {error}
          </ThemedText>
        </View>
      ) : (
        <ScrollView>
          <View>
            {filteredRecipes.map((beer) => (
              <BeerCard
                key={beer.recipe_slug}
                {...beer}
                onPress={() =>
                  router.push({
                    pathname: "/SpecificRecipe",
                    params: { recipe_slug: beer.recipe_slug },
                  })
                }
                onToggleFavorite={() => toggleFavorite(beer.recipe_slug)}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
