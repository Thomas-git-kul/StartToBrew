import React, { useState, useEffect } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { Searchbar, ActivityIndicator } from "react-native-paper";
import { Search, X, Heart} from "lucide-react-native";
import BeerCard from "../../components/ui/RecipeCard";
import { useFavorites } from "@/context/FavoritesContext";
import { BASE_COLORS } from "@/constants/Colors";
import { useRouter } from "expo-router";
import Header from "../../components/header";
import { useFonts } from "@/hooks/use-fonts";
import { ThemedText } from "../../components/themed-text";
import { supabase } from "@/supabase";
import { getBeerImageSource } from "@/hooks/beer-image";

interface Beer {
  recipe_slug: string;
  name: string;
  rating: number;
  reviews: number;
  image: any;
  description: string | null;
  style: string | null;
}
// Debug: log imported components to help tests identify undefined imports
// (temporary; remove after debugging)
// eslint-disable-next-line no-console
console.log('DEBUG Imports:', {
  HeaderExists: typeof Header !== 'undefined',
  BeerCardExists: typeof BeerCard !== 'undefined',
  SearchbarExists: typeof Searchbar !== 'undefined',
  ThemedTextExists: typeof ThemedText !== 'undefined',
});

  // ...existing code...
export default function Recipes() {
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  useFonts();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState<Beer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { favoriteSlugs, toggleFavorite } = useFavorites();

  // helper to check whether an item matches the query
  const filterMatches = (item: Beer, q: string) => {
    if (!q) return true;
    const lower = q.toLowerCase();
    return item.name.toLowerCase().includes(lower);
  };

  // Use global toggleFavorite from FavoritesContext. We still keep a
  // Removed auto-disable of favorites view; instead we show an
  // informational message when there are no favorites.

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        // Note: user session and favorites are handled globally by FavoritesProvider

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

        const shuffled = [...mapped];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setRecipes(shuffled);

        // favorites are handled globally by FavoritesProvider
      } catch (e: any) {
        console.error("Error loading recipes", e);
        setError(
          e.message ?? "Unable to load recipes."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  let filteredRecipes = recipes.filter((b) => filterMatches(b, searchQuery));
  if (showOnlyFavorites) {
    filteredRecipes = filteredRecipes.filter((b) => favoriteSlugs.includes(b.recipe_slug));
  }

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

      {/* Heart icon under searchbar: toggles showing only user's favorites */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
        <Pressable onPress={() => setShowOnlyFavorites((prev) => !prev)} hitSlop={8} accessibilityLabel="toggle-favorites">
          <Heart
            size={28}
            stroke={showOnlyFavorites ? BASE_COLORS.ACCENT_PRIMARY : BASE_COLORS.STONE300}
            fill={showOnlyFavorites ? BASE_COLORS.ACCENT_PRIMARY : "transparent"}
            style={{ marginLeft: 8 }}
          />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator 
            animating size="large"
            color={BASE_COLORS.ACCENT_PRIMARY}
          />
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
      ) : showOnlyFavorites && favoriteSlugs.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <ThemedText type="defaultText" className="text-center">
            You don&apos;t have any favorites at the moment.
          </ThemedText>
        </View>
      ) : (
        <ScrollView>
          <View>
            {filteredRecipes.map((beer) => (
              <BeerCard
                key={beer.recipe_slug}
                {...beer}
                isFavorite={favoriteSlugs.includes(beer.recipe_slug)}
                onToggleFavorite={() => toggleFavorite(beer.recipe_slug)}
                onPress={() =>
                  router.push({
                    pathname: "/SpecificRecipe",
                    params: {
                      recipe_slug: beer.recipe_slug,
                      isFavorite: favoriteSlugs.includes(beer.recipe_slug) ? "true" : "false",
                    },
                  })
                }
              />
            ))}
            {showOnlyFavorites && filteredRecipes.length === 0 && favoriteSlugs.length > 0 && (
              <View className="items-center mt-6 px-6">
                <ThemedText type="defaultText" className="text-center">
                  No favorites match your search.
                </ThemedText>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
