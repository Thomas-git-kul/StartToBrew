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

        const { data, error } = await supabase
          .from("recipes")
          .select(
            "recipe_slug, name, description, rating, haze_level, srm_target, style"
          );

        if (error) throw error;

        const mapped: Beer[] = (data || []).map((r: any) => ({
          recipe_slug: r.recipe_slug,
          name: r.name,
          // pas dit eventueel aan als je rating als 1-5 of als 0-100 opslaat
          rating: r.rating ?? 0,
          reviews: 0, // later kun je dit vullen met een count uit recipe_reviews
          image: getBeerImageSource(r.haze_level, r.srm_target),
          description: r.description ?? null,
          style: r.style ?? null,
        }));

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
