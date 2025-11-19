import React, { useEffect, useState } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { Searchbar} from "react-native-paper";
import { Search, X } from "lucide-react-native";
import BeerCard from '@/components/ui/RecipeCard';
import { BASE_COLORS } from "@/constants/Colors";
import { useRouter } from "expo-router";
import Header from '@/components/header';
import { useFonts } from "@/hooks/use-fonts";
import { supabase } from "../../supabase";
import { FontFamilies } from "@/constants/Fonts";

interface Beer {
  recipe_slug?: string;
  name: string;
  rating: number;
  reviews: number;
  image: any;
  description: string;
}

export default function Recipes() {
  useFonts();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [recipes, setRecipes] = useState<Beer[]>([]);
  const [loading, setLoading] = useState(true);

  // helper to check whether an item matches the query
  const filterMatches = (item: Beer, q: string) => {
    if (!q) return true;
    const lower = q.toLowerCase();
    return item.name.toLowerCase().includes(lower);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("recipes")
          .select("recipe_slug,name,description,rating")
          .limit(50);

        if (error) {
          console.warn("Supabase recipes(fetch) error:", error.message);
          if (mounted) setRecipes([]);
          return;
        }

        const mapped: Beer[] = (data ?? []).map((row: any) => ({
          recipe_slug: row.recipe_slug ?? undefined,
          name: row.name ?? "Untitled Recipe",
          rating: typeof row.rating === "number" ? row.rating : Number(row.rating ?? 0),
          description: row.description ?? "",
          reviews: 0,
          image: require("@/assets/images/default-beer.png"),
        }));

        if (mounted) setRecipes(mapped);
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
  }, []);

  return (
    <View className="flex-1" style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
      <Header title="Recipes" />

      {/* Searchbar */}
      <Searchbar
        placeholder="Search"
        value={searchQuery}
        onChangeText={setSearchQuery}
        inputStyle={{ 
          color: BASE_COLORS.STONE700, 
          fontFamily: FontFamilies.BODY
        }}
        icon={() => <Search size={20} color={BASE_COLORS.STONE300} />}
        clearIcon={searchQuery ? () => <X size={18} color={BASE_COLORS.STONE500} /> : undefined}
        onClearIconPress={() => setSearchQuery("")}
        style={{
          backgroundColor: BASE_COLORS.WHITE,
          borderColor: BASE_COLORS.STONE300,
          borderWidth: 1,
          marginBottom: 15,
        }}
      />

      {/* Recipes */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView>
          {!searchQuery ? (
            <View>
              {recipes.map((beer, index) => (
                <BeerCard
                  key={index}
                  {...beer}
                  onPress={() => router.push(({ pathname: "/SpecificRecipe", params: { slug: beer.recipe_slug } } as any))}
                  onToggleFavorite={() => {}}
                />
              ))}
            </View>
          ) : (
            <View>
              {recipes.filter((b) => filterMatches(b, searchQuery)).map((beer, index) => (
                <BeerCard key={index} {...beer} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
