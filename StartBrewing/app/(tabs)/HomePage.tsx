import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { FAB } from "react-native-paper";
import { useRouter } from "expo-router";
import { useFonts } from "@/hooks/use-fonts";
import BeerCard from "@/components/ui/RecipeCard";
import { useFavorites } from "@/context/FavoritesContext";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { BASE_COLORS } from "@/constants/Colors";
import { Plus } from "lucide-react-native";
import ProgressCard from "@/components/ui/ProgressCard";
import Dialog from "@/components/dialog";
import { supabase } from "@/supabase";
import { getBeerImageSource } from "@/hooks/beer-image";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Spinner from "@/components/spinner";

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
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | number; name?: string } | null>(null);

  // Auth-guard helper: alle acties gaan eerst langs Supabase auth.
  const withAuthGuard = (action: () => void) => {
    return async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/Auth");
        } else {
          action();
        }
      } catch (err: unknown) {
        console.warn("Auth guard failed:", err);
        router.push("/Auth");
      }
    };
  };

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;

      const fetchPopularRecipes = async (
        ratingWeight = 0.8,
        reviewWeight = 0.2,
        reviewScale = 20
      ) => {
        try {
          setLoading(true);
          setError(null);

          const { data: recipesData, error: recipesError } = await supabase
            .from("recipes")
            .select(
              "recipe_slug, name, description, haze_level, srm_target, style"
            );

          if (recipesError) throw recipesError;

          const slugs = (recipesData || []).map((r: any) => r.recipe_slug);

          const { data: reviewsData, error: reviewsError } = await supabase
            .from("recipe_reviews")
            .select("recipe_slug, rating")
            .in("recipe_slug", slugs.length ? slugs : [""]);

          if (reviewsError) throw reviewsError;

          const agg: Record<string, { count: number; avg: number }> = {};
          (reviewsData || []).forEach((r: any) => {
            const slug = r.recipe_slug;
            if (!agg[slug]) agg[slug] = { count: 0, avg: 0 };
            agg[slug].count += 1;
            agg[slug].avg += r.rating ?? 0;
          });
          Object.keys(agg).forEach((k) => {
            agg[k].avg = agg[k].count ? agg[k].avg / agg[k].count : 0;
          });

          const mappedAll: Beer[] = (recipesData || []).map((r: any) => {
            const a = agg[r.recipe_slug];
            const avgRating = a ? a.avg : (r.rating ?? 0);
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

          // 4) bereken gewogen score per recipe
          const totalWeight =
            ratingWeight + reviewWeight > 0 ? ratingWeight + reviewWeight : 1;

          const withScore = mappedAll.map((beer) => {
            const normalizedRating = beer.rating > 0 ? beer.rating / 5 : 0;
            const normalizedReviews =
              beer.reviews > 0 ? Math.min(beer.reviews / reviewScale, 1) : 0;

            const score =
              (ratingWeight * normalizedRating +
                reviewWeight * normalizedReviews) /
              totalWeight;

            return { ...beer, score };
          });

          // 5) sorteer op gewogen score (desc) en neem top 5
          const topWithScore = withScore
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

          const mapped = topWithScore.map(({ score, ...rest }) => rest);

          if (mounted) {
            setBeers(mapped);
          }
        } catch (e: any) {
          if (mounted) {
            setError(
              e.message ??
                "Er ging iets mis bij het laden van de populaire recepten."
            );
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

      const loadProgress = async () => {
        setLoading(true);
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            if (mounted) {
              setInProgress([]);
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

          interface PhaseRow {
            phase_id: string;
          }

          interface StepRow {
            step_id: string | number;
            duration_min?: number | null;
          }

          interface CompletedStepRow {
            step_id: string | number;
            steps?: { duration_min?: number | null } | null;
            time_left?: number | null;
            status: string;
            completed_at?: Date | null;
          }

          const inProgressResult = brews?.length
            ? await Promise.all(
                brews.map(async (brew: BrewRow) => {
                  const { data: phases } = (await supabase
                    .from("phases")
                    .select("phase_id")
                    .eq("recipe_slug", brew.recipe_slug)) as {
                    data: PhaseRow[] | null;
                  };

                  const phaseIds = phases?.map((p) => p.phase_id) ?? [];

                  const { data: totalSteps } = (await supabase
                    .from("steps")
                    .select("step_id, duration_min")
                    .in("phase_id", phaseIds)) as { data: StepRow[] | null };

                  const { data: completedSteps } = (await supabase
                    .from("brew_steps")
                    .select("step_id, steps(duration_min), time_left, status, completed_at")
                    .eq("id_brew", brew.id_brew)
                    .in("status", ["completed", "in_progress"])) as { data: CompletedStepRow[] | null };

                  const durations = (totalSteps || [])
                    .map((s) => s.duration_min)
                    .filter((d): d is number => typeof d === "number" && d > 0);

                  const avgDuration = durations.length > 0
                    ? durations.reduce((a, b) => a + b, 0) / durations.length
                    : 60; // fallback: 1 uur als ALLES null is

                  // 1) Bepaal totale workload (met tijd)
                  const totalWorkload = (totalSteps || []).reduce((sum: number, step: { duration_min?: number | null }) => {
                    const dur = step.duration_min;
                    return sum + (dur && dur > 0 ? dur : avgDuration);
                  }, 0);

                  // 2) Completed workload + gedeeltelijk in-progress workload
                  let completedWorkload = 0;

                  (completedSteps || []).forEach((step: CompletedStepRow) => {
                      const dur = step.steps?.duration_min ?? null;
                      const fullDuration = dur && dur > 0 ? dur : avgDuration;
                      console.log(`Brew ${brew.name}: time_left = ${step.time_left}`);

                      const lastUpdate = step.completed_at ? new Date(step.completed_at).getTime() : null;
                      const now = Date.now();

                      let dynamicRemaining = step.time_left ?? fullDuration;

                      if (step.status === "in_progress" && lastUpdate) {
                        const elapsedMs = now - lastUpdate;
                        const elapsedMin = elapsedMs / 1000;

                        // Dynamisch tijd herberekenen
                        dynamicRemaining = Math.max(0,
                          (step.time_left ?? fullDuration) - elapsedMin
                        );
                      }

                      // Normal completed step → full duration
                      if (step.steps && step.time_left == null) {
                        completedWorkload += fullDuration;
                        return;
                      }

                      console.log(`Brew ${brew.name}`, 'dynamicRemaining:', dynamicRemaining);

                      // Step is in_progress → partial progress
                      if (step.time_left != null) {
                        const remaining = step.time_left;
                        const completedPart = Math.max(fullDuration - dynamicRemaining, 0);

                        completedWorkload += completedPart;
                        return;
                      }
                    }
                  );

                  // 3) Progress berekenen
                  const progress =
                    totalWorkload > 0 ? completedWorkload / totalWorkload : 0;

                  console.log(`Brew ${brew.name} \nTotal: ${totalWorkload} \nCompleted: ${completedWorkload} \nAvg: ${avgDuration}, Progress: ${progress * 100}%`);
                  return { id: brew.id_brew, name: brew.name, progress };
                })
              )
            : [];

          if (mounted) {
            const sortedResult = inProgressResult.sort(
              (a, b) => a.progress - b.progress
            );
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
  }, []));

  // Open confirmation modal for deletion (modal handles actual deletion)
  const handleDeleteBrew = (id: string | number | undefined, name?: string) => {
    if (!id) return;
    setDeleteTarget({ id, name });
    setDeleteDialogVisible(true);
  };

  const confirmDeleteBrew = async () => {
    const id = deleteTarget?.id;
    const name = deleteTarget?.name;
    setDeleteDialogVisible(false);
    setDeleteTarget(null);
    if (!id) return;
    try {
      await supabase.from("brew_steps").delete().eq("id_brew", id);
      await supabase.from("brews").delete().eq("id_brew", id);
      setInProgress((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      console.warn("Failed to delete brew:", e);
    }
  };

  return (
    <SafeAreaView className="flex-1" style ={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
      <Header title="StartToBrew" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="mx-3"
        contentContainerStyle={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
      >
        {/* In progress section */}
        <ThemedText type="title">In progress</ThemedText>
        {loading ? (
          <Spinner
            title="Loading progress..."
            size= "small"
          />
        ) : error ? (
          <View className="items-center justify-center my-4 px-6">
            <ThemedText type="defaultText" className="text-center">
              {error}
            </ThemedText>
          </View>
        ) : (
          <View>
            {inProgress.length === 0 ? (
              <ThemedText>No brews in progress. Start a new recipe!</ThemedText>
            ) : (
              inProgress.map((brew) => (
                <ProgressCard
                  key={brew.id}
                  title={brew.name}
                  progress={brew.progress}
                    onPress={withAuthGuard(() =>
                    router.push({
                      pathname: "/progress",
                      params: { id: brew.id },
                    })
                  )}
                    onDelete={() => handleDeleteBrew(brew.id)}
                />
              ))
            )}
          </View>
        )}

        <ThemedText type="title" className="mt-4">Popular recipes</ThemedText>

        {loading ? (
          <Spinner
            title="Loading recipes..."
            size="small"
          />
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
                onToggleFavorite={withAuthGuard(() =>
                  toggleFavorite(beer.recipe_slug)
                )}
                onPress={withAuthGuard(() =>
                  router.push({
                    pathname: "/SpecificRecipe",
                    params: {
                      recipe_slug: beer.recipe_slug,
                      isFavorite: favoriteSlugs.includes(beer.recipe_slug)
                        ? "true"
                        : "false",
                    },
                  })
                )}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Dialog
        title="Confirm Brew Deletion"
        text={`Are you sure you want to delete "${deleteTarget?.name ?? "this"}" brew?`}
        visible={deleteDialogVisible}
        onDismiss={() => setDeleteDialogVisible(false)}
        cancelBtn="Cancel"
        yesBtn="Delete"
        onPressCancel={() => setDeleteDialogVisible(false)}
        onPressYes={confirmDeleteBrew}
      />

      {/* Floating Action Button */}
      <FAB
        mode="flat"
        icon={(props) => <Plus size={props.size} strokeWidth={3} color={props.color} />}
        testID="fab"
        style={{
          position: "absolute",
          right: 10,
          bottom: 25,
          backgroundColor: BASE_COLORS.TEXT_DARK,
          borderRadius: 45,
        }}
        color={BASE_COLORS.WHITE}
        onPress={withAuthGuard(() => router.push("/Recipes"))}
      />
    </SafeAreaView>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}
