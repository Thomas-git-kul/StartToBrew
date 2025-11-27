import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { FAB, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { useFonts } from "@/hooks/use-fonts";
import BeerCard from "@/components/ui/RecipeCard";
import { useFavorites } from "@/context/FavoritesContext";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { BASE_COLORS } from "@/constants/Colors";
import { Plus } from "lucide-react-native";
import ProgressCard from "@/components/ui/ProgressCard";
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

interface InProgressBrew {
  id: string | number;
  name: string;
  progress: number;
}

interface BrewRow {
  id_brew: number;
  name: string;
  recipe_slug: string;
}

function HomePageContent() {
  useFonts();
  const router = useRouter();
  const [beers, setBeers] = useState<Beer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inProgress, setInProgress] = useState<InProgressBrew[]>([]);
  const { favoriteSlugs, toggleFavorite } = useFavorites();

  useEffect(() => {
    let mounted = true;
    const fetchPopularRecipes = async () => {
      try {
        setLoading(true);
        setError(null);
        // 1) load recipes (we need at least the basic fields)
        const { data: recipesData, error: recipesError } = await supabase
          .from("recipes")
          .select(
            "recipe_slug, name, description, haze_level, srm_target, style"
          );
        if (recipesError) throw recipesError;
        const slugs = (recipesData || []).map((r: any) => r.recipe_slug);
        // 2) load all reviews for these recipes and aggregate in client
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("recipe_reviews")
          .select("recipe_slug, rating")
          .in("recipe_slug", slugs.length ? slugs : [""]);
        if (reviewsError) throw reviewsError;
        // aggregate by recipe_slug
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
        // map recipes and attach aggregated ratings/counts
        const mappedAll: Beer[] = (recipesData || []).map((r: any) => {
          const a = agg[r.recipe_slug];
          const avgRating = a ? a.avg : r.rating ?? 0;
          // ensure rating on 0-5 scale
          // behoud twee decimalen precisie voor we tonen
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
        // sort by rating desc, then reviews desc and take top 5
        const mapped = mappedAll
          .sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return b.reviews - a.reviews;
          })
          .slice(0, 5);
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
    const loadProgress = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) {
            setInProgress([]);
            setBeers([]);
          }
          return;
        }
        const { data: brews, error: brewsError } = await supabase
          .from("brews")
          .select("id_brew, name, recipe_slug")
          .eq("user_id", user.id)
          .in("status_id", [1, 2]);
        if (brewsError) {
          console.warn("Failed to load brews:", brewsError.message);
        }
        interface PhaseRow { phase_id: string; }
        const inProgressResult = brews?.length
          ? await Promise.all(
              brews.map(async (brew: BrewRow) => {
                const { data: phases } = await supabase
                  .from("phases")
                  .select("phase_id")
                  .eq("recipe_slug", brew.recipe_slug) as { data: PhaseRow[] | null };
                const phaseIds = phases?.map(p => p.phase_id) ?? [];
                const { data: totalSteps } = await supabase
                  .from("steps")
                  .select("step_id")
                  .in("phase_id", phaseIds);
                const { data: completedSteps } = await supabase
                  .from("brew_steps")
                  .select("step_id")
                  .eq("id_brew", brew.id_brew)
                  .eq("status", "completed");
                const progress = totalSteps && completedSteps
                  ? completedSteps.length / totalSteps.length
                  : 0;
                return { id: brew.id_brew, name: brew.name, progress };
              })
            )
          : [];
        if (mounted) {
          const sortedResult = inProgressResult.sort((a, b) => a.progress - b.progress);
          setInProgress(sortedResult);
        }
      } catch (e: any) {
        console.warn("Failed to load homepage data:", e?.message ?? e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProgress();
    fetchPopularRecipes();
    return () => {
      mounted = false;
    };
  }, []);
  // ...existing code...

  return (
    <View className="flex-1">
      <Header title="StartToBrew" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
      >
        {/* In progress section */}
        <ThemedText type="title">In progress</ThemedText>
        <View>
          {inProgress.length === 0 ? (
              <ThemedText>No brews in progress. Start a new recipe!</ThemedText>
            ) : (
              inProgress.map((brew) => (
                <ProgressCard
                  key={brew.id}
                  title={brew.name}
                  progress={brew.progress}
                  onPress={() => router.push({ pathname: "/progress", params: { id: brew.id } })}
                />
              ))
            )}
        </View>

        <ThemedText type="title">Popular recipes</ThemedText>
        {loading ? (
          <View className="items-center justify-center my-4">
            <ActivityIndicator 
              animating size="small" 
              color={BASE_COLORS.ACCENT_PRIMARY}
            />
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
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        testID="fab"
        mode="flat"
        icon={(props) => <Plus size={props.size} color={props.color} strokeWidth={3}/>}
        style={{
          position: "absolute",
          right: 10,
          bottom: 25,
          backgroundColor: BASE_COLORS.TEXT_DARK,
          borderRadius: 30,
        }}
        color={BASE_COLORS.WHITE}
        onPress={() => router.push("/Recipes")}
      />
    </View>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}
