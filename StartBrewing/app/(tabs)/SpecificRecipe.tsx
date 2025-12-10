import { BadgeEarnedModal } from "@/components/BadgeEarnedModal";
import Header from "@/components/header";
import PrimaryButton from "@/components/primaryButton";
import { ReviewModal } from "@/components/reviewModal";
import SecondaryButton from "@/components/secondaryButton";
import SelectionChip from "@/components/selectionChip";
import Spinner from "@/components/spinner";
import TextInput from "@/components/textInput";
import { ThemedText } from "@/components/themed-text";
import ReviewCard from "@/components/ui/ReviewCard";
import StoreCard from "@/components/ui/StoreCard";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useAppRefresh } from "@/context/AppRefreshContext";
import { useClickCounter } from "@/context/ClickCounterContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useUserProgressContext } from "@/context/UserProgressContext";
import { analytics, logEvent } from "@/firebase/firebaseConfig";
import { getBeerImageSource } from "@/hooks/beer-image";
import { useFonts } from "@/hooks/use-fonts";
import { supabase } from "@/supabase";
import { fetchLatestBadge } from "@/supabase/queries/badges";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  View
} from "react-native";
import { Chip, FAB, Modal, Portal } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
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
  haze_level: number | null;
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
  const { recipe_slug, from } = useLocalSearchParams<{
    recipe_slug?: string;
    from?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  const [reviewVisible, setReviewVisible] = useState(false);
  const [kitsVisible, setKitsVisible] = useState(false);
  const [northStarLogged, setNorthStarLogged] = useState(false);
  const { increment, get, reset } = useClickCounter();
  const { refreshProgress } = useUserProgressContext();
  const { triggerRefresh } = useAppRefresh();

  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [reviews, setReviews] = useState<
    Array<{
      rating: number;
      review_text: string | null;
      created_at?: string | null;
      account_id?: string;
      username?: string | null;
      level?: number;
    }>
  >([]);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const { favoriteSlugs, toggleFavorite } = useFavorites();
  const isFavorite = recipe_slug
    ? (favoriteSlugs || []).includes(String(recipe_slug))
    : false;
  const [isFavoriteIconFilled, setIsFavoriteIconFilled] = useState(isFavorite);
  const [kits, setKits] = useState<any[]>([]);

  // Batch size selectie
  const [batchSizeModalVisible, setBatchSizeModalVisible] = useState(false);
  const [selectedBatchSizeOption, setSelectedBatchSizeOption] = useState<
    "5" | "10" | "19" | "custom"
  >("19");
  const [customBatchSize, setCustomBatchSize] = useState<string>("");
  const [selectedBatchSize, setSelectedBatchSize] = useState<number | null>(
    null
  );

  // Badge modal state
  const [latestBadgeId, setLatestBadgeId] = useState<number | null>(null);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [badgeForModal, setBadgeForModal] = useState<{
    name: string | null;
    iconUrl: string | null;
  } | null>(null);

  const handleToggleFavorite = async () => {
    if (!recipe_slug) return;
    try {
      await toggleFavorite(String(recipe_slug));
      setIsFavoriteIconFilled((prev) => !prev);
    } catch (e: any) {
      Alert.alert("Favorite failed", e?.message ?? "Could not toggle favorite");
    }
  };

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
      // ignore
    }
  };

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

      const { data: ingredientData, error: ingredientError } =
        await supabase.rpc("get_recipe_ingredients", {
          _recipe_slug: slug,
        });
      if (ingredientError) throw ingredientError;

      const { data: reviewsData, error: reviewsError } = await supabase
        .from("recipe_reviews")
        .select("rating")
        .eq("recipe_slug", slug);
      if (reviewsError) throw reviewsError;

      const count = (reviewsData || []).length;
      const avg = count
        ? reviewsData!.reduce((s: any, r: any) => s + (r.rating ?? 0), 0) /
          count
        : null;

      const recipeWithRating = recipeData
        ? {
            ...recipeData,
            rating:
              avg != null ? parseFloat(avg.toFixed(2)) : recipeData.rating,
          }
        : null;

      setRecipe(recipeWithRating as Recipe | null);
      setIngredients((ingredientData || []) as IngredientRow[]);
      setReviewCount(count);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSuccess = async () => {
    // Refresh data after successful review
    if (!recipe_slug) return;
    
    try {
      await fetchRecipeBundle(recipe_slug);
      await fetchReviews(recipe_slug);
      checkUserReviewed(recipe_slug);
      setHasUserReviewed(true);
      triggerRefresh();
      await refreshProgress();
      if (currentUserId) {
        await checkForNewBadge(currentUserId);
      }
    } catch (e: any) {
      console.error("Error refreshing after review:", e);
    }
  };

  const brewRecipe = async (
    clicksToFirstBrew?: number,
    batchSizeL?: number
  ) => {
    const effectiveSlug = recipe_slug || recipe?.recipe_slug;
    console.log("brewRecipe called with:", {
      recipe_slug,
      effectiveSlug,
      recipeName: recipe?.name,
      batchSizeL,
    });
    if (!effectiveSlug || !recipe?.name) {
      console.warn("Cannot start brew: missing slug or recipe name.", {
        recipe_slug,
        effectiveSlug,
        recipe,
      });
      return;
    }

    try {
      console.log("Fetching user...");
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Error fetching user for brew:", userError?.message);
        return;
      }
      console.log("User fetched:", user.id);

      const { data: phasesData, error: phasesError } = await supabase
        .from("phases")
        .select("phase_id")
        .eq("recipe_slug", effectiveSlug)
        .order("position", { ascending: true });

      if (phasesError || !phasesData?.length) {
        console.error(
          "Error fetching phases:",
          phasesError?.message || "No phases found."
        );
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
        console.error(
          "Error finding first step:",
          firstStepError?.message || "No starting step found."
        );
        return;
      }

      const firstStepId = firstStepData.step_id;

      const { data: previousBrewsAll, error: prevAllError } = await supabase
        .from("brews")
        .select("id_brew")
        .eq("user_id", user.id);

      if (prevAllError) {
        console.error("Error checking previous brews:", prevAllError?.message);
      }

      const isFirstEver = (previousBrewsAll?.length || 0) === 0;

      const { data: previousBrews, error: prevError } = await supabase
        .from("brews")
        .select("id_brew")
        .eq("user_id", user.id)
        .eq("recipe_slug", effectiveSlug);

      if (prevError) {
        console.error(
          "Error checking previous brews for recipe:",
          prevError?.message
        );
      }

      const brewNumber = (previousBrews?.length || 0) + 1;
      const brewName =
        brewNumber === 1 ? recipe.name : `${recipe.name} (#${brewNumber})`;

      const finalBatchSize = batchSizeL ?? recipe.batch_size_l ?? 19;

      const newBrew = {
        user_id: user.id,
        name: brewName,
        start_date: new Date().toISOString(),
        status_id: 1,
        recipe_slug: effectiveSlug,
        last_step_id: firstStepId,
        batch_size_l: finalBatchSize,
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

      if (isFirstEver && !northStarLogged) {
        try {
          const accountCreatedAt = user.created_at
            ? new Date(user.created_at)
            : null;
          const brewStartedAt = brewData[0].start_date
            ? new Date(brewData[0].start_date)
            : new Date();
          const timeToFirstBrewSeconds = accountCreatedAt
            ? Math.max(
                0,
                Math.round(
                  (brewStartedAt.getTime() - accountCreatedAt.getTime()) / 1000
                )
              )
            : null;

          const baseParams: any = {
            user_id: user.id,
            brew_id: brewId,
            recipe_slug: effectiveSlug,
          };

          const finalClicks =
            clicksToFirstBrew != null ? clicksToFirstBrew : get();

          // Log two separate analytics events:
          // - `northstar_time_in_sec` for the time in seconds until first northstar
          // - `northstar_amount_of_clicks` for the number of clicks until first northstar
          if (analytics) {
            if (timeToFirstBrewSeconds != null) {
              logEvent(analytics, "northstar_time_in_sec", {
                ...baseParams,
                time_in_sec: timeToFirstBrewSeconds,
              });
            }
            if (finalClicks != null) {
              logEvent(analytics, "northstar_amount_of_clicks", {
                ...baseParams,
                clicks: finalClicks,
              });
            }
          } else {
            if (timeToFirstBrewSeconds != null) {
              console.log("northstar_time_in_sec", {
                ...baseParams,
                time_in_sec: timeToFirstBrewSeconds,
              });
            }
            if (finalClicks != null) {
              console.log("northstar_amount_of_clicks", {
                ...baseParams,
                clicks: finalClicks,
              });
            }
          }

          setNorthStarLogged(true);
          try {
            await reset();
          } catch {
            // ignore
          }
        } catch (e: any) {
          console.error("Failed to log north-star events:", e?.message ?? e);
        }
      }

      const { data: allSteps, error: stepsError } = await supabase
        .from("steps")
        .select("step_id, after_step_id")
        .in("phase_id", phaseIds);

      if (stepsError || !allSteps?.length) {
        console.error(
          "Error fetching steps:",
          stepsError?.message || "No steps found."
        );
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

      console.log("Navigating to progress page with brew ID:", brewId);
      router.push({ pathname: "/progress", params: { id: brewId } });
      console.log("Navigation command sent");
    } catch (e: any) {
      console.error("Exception during brew start:", e.message ?? e);
    }
  };

  const fetchStarterKits = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from("recipe_kits")
        .select(
          `
        id_starter_kit,
        starter_kit:starter_kits (
          name,
          description,
          size_liters,
          price,
          is_active
        )
      `
        )
        .eq("recipe_slug", slug);

      if (error) throw error;

      const kits = data?.map((row: any) => ({
        id: row.id_starter_kit,
        ...row.starter_kit,
      }));
      setKits(kits);
    } catch (e: any) {
      console.error("Error fetching kits:", e.message);
      return [];
    }
  };

  const handleInitialStartPress = async () => {
    setBatchSizeModalVisible(true);
    try {
      await increment("initial_start_press");
    } catch {
      // ignore
    }
  };

  const handleDeleteReview = async (reviewAccountId: string) => {
    if (!recipe_slug || !currentUserId || reviewAccountId !== currentUserId) {
      Alert.alert("Error", "Je kunt alleen je eigen reviews verwijderen.");
      return;
    }

    try {
      const { error } = await supabase
        .from("recipe_reviews")
        .delete()
        .eq("recipe_slug", recipe_slug)
        .eq("account_id", currentUserId);

      if (error) throw error;

      // Update recipe rating en review count
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("recipe_reviews")
        .select("rating")
        .eq("recipe_slug", recipe_slug);

      if (reviewsError) throw reviewsError;

      const count = (reviewsData || []).length;
      const avg = count
        ? reviewsData!.reduce((s: any, r: any) => s + (r.rating ?? 0), 0) /
          count
        : null;

      const updatePayload: any = {};
      if (avg != null) updatePayload.rating = parseFloat(avg.toFixed(2));
      updatePayload.review_count = count;

      await supabase
        .from("recipes")
        .update(updatePayload)
        .eq("recipe_slug", recipe_slug);

      // Refresh data
      await fetchRecipeBundle(recipe_slug);
      await fetchReviews(recipe_slug);
      setHasUserReviewed(false);

      Alert.alert("Success", "Review verwijderd.");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Kon review niet verwijderen.");
    }
  };

  const fetchReviews = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from("recipe_reviews")
        .select("rating, review_text, created_at, account_id")
        .eq("recipe_slug", slug)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      const rows = data || [];

      const reviewsWithUser = await Promise.all(
        rows.map(async (r: any) => {
          try {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("username, level")
              .eq("id", r.account_id)
              .maybeSingle();
            return {
              rating: r.rating,
              review_text: r.review_text,
              created_at: r.created_at,
              account_id: r.account_id,
              username: profileData?.username ?? null,
              level: profileData?.level ?? null,
            };
          } catch {
            return {
              rating: r.rating,
              review_text: r.review_text,
              created_at: r.created_at,
              account_id: r.account_id,
              username: null,
              level: null,
            };
          }
        })
      );

      setReviews(reviewsWithUser);
    } catch (e: any) {
      console.error("Error fetching reviews:", e.message || e);
      setReviews([]);
    }
  };

  const initLatestBadge = useCallback(async (accountId: string) => {
    const latest = await fetchLatestBadge(accountId);
    if (latest) {
      setLatestBadgeId(latest.id);
    }
  }, []);

  const checkForNewBadge = useCallback(
    async (accountId: string) => {
      const latest = await fetchLatestBadge(accountId);
      if (!latest) return false;

      if (latestBadgeId == null || latest.id !== latestBadgeId) {
        setLatestBadgeId(latest.id);
        setBadgeForModal({ name: latest.name, iconUrl: latest.imageUrl });
        setBadgeModalVisible(true);
        return true;
      }
      return false;
    },
    [latestBadgeId]
  );

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const id = user?.id ?? null;
        setCurrentUserId(id);
        if (id) {
          await initLatestBadge(id); // baseline
        }
      } catch {
        setCurrentUserId(null);
      }
    };

    getCurrentUser();

    if (!recipe_slug) return;
    fetchRecipeBundle(recipe_slug);
    checkUserReviewed(recipe_slug);
    fetchStarterKits(recipe_slug);
    fetchReviews(recipe_slug);
  }, [recipe_slug, initLatestBadge]);

  useFocusEffect(
    useCallback(() => {
      const getCurrentUser = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          setCurrentUserId(user?.id ?? null);
        } catch {
          setCurrentUserId(null);
        }
      };

      const loadData = async () => {
        if (!recipe_slug) return;
        
        await getCurrentUser();
        await fetchRecipeBundle(recipe_slug);
        await checkUserReviewed(recipe_slug);
        await fetchStarterKits(recipe_slug);
        await fetchReviews(recipe_slug);
      };

      loadData();

      // Reset modal states when navigating back to this screen
      // This ensures clean state after returning from other pages
      return () => {
        // Cleanup function runs when screen loses focus
        setKitsVisible(false);
        setBatchSizeModalVisible(false);
      };
    }, [recipe_slug])
  );

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUserId(user?.id ?? null);
      } catch {
        setCurrentUserId(null);
      }
    };

    getCurrentUser();

    if (!recipe_slug) return;
    fetchRecipeBundle(recipe_slug);
    checkUserReviewed(recipe_slug);
    fetchStarterKits(recipe_slug);
    fetchReviews(recipe_slug);
  }, [recipe_slug]);

  const hazeLevels: Record<number, String> = {
    1: "clear",
    2: "light haze",
    3: "hazy",
  };

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

  const beerImageSource =
    recipe != null
      ? getBeerImageSource(recipe.haze_level, recipe.srm_target)
      : require("@/assets/images/default-beer.png");

  const displayedReviews = (reviews || []).filter(
    (r) => r.review_text && String(r.review_text).trim().length > 0
  );

  const handleConfirmBatchSize = () => {
    let size: number;

    if (selectedBatchSizeOption === "custom") {
      const parsed = Number((customBatchSize || "").replace(",", "."));
      if (!parsed || parsed <= 0) {
        Alert.alert(
          "Invalid batch size",
          "Please enter a valid volume in liters."
        );
        return;
      }
      size = parsed;
    } else {
      size =
        selectedBatchSizeOption === "5"
          ? 5
          : selectedBatchSizeOption === "10"
          ? 10
          : 19;
    }

    setSelectedBatchSize(size);
    setBatchSizeModalVisible(false);
    setKitsVisible(true);
  };

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
        iconNameLeft="ArrowLeft"
        actionTestIDLeft="back-button"
        onIconPressLeft={() => {
          if (from === "account") {
            router.push("/Account");
          } else if (from === "home") {
            router.push("/HomePage");
          } else {
            router.push("/Recipes");
          }
        }}
      />
      {loading ? (
        <Spinner title="Loading recipe..." />
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
          contentContainerStyle={{ paddingBottom: 70 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <ThemedText type="titleBlack">{recipe?.name}</ThemedText>

          {/* Image */}
          <View className="items-center mb-2">
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
          <View className="flex-row  mb-3 gap-2 items-center justify-between">
            <View className="flex-row gap-2">
              <Star
                size={Math.min(22 * scale, 35)}
                color={BASE_COLORS.ACCENT_LIGHT}
                fill={BASE_COLORS.ACCENT_LIGHT}
              />
              <ThemedText type="subTitle">{displayedRating} / 5</ThemedText>
              <ThemedText type="subTitle">({reviewCount} reviews)</ThemedText>
            </View>
            <View>
              {hasUserReviewed ? (
                <ThemedText type="subTitle" testID="already-reviewed-label">
                  You reviewed ✓
                </ThemedText>
              ) : (
                <View className="mt-1">
                  <SecondaryButton
                    title="Add review"
                    testID="review-button"
                    onPress={() => {setReviewVisible(true)}}
                    size={14}
                  />
                </View>
              )}
            </View>
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
            <ThemedText type="defaultText">Ingredients:</ThemedText>
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

          {/* Reviews section */}
          <View className="mt-2 mb-4">
            <ThemedText type="defaultText" className="mb-2">
              Reviews:
            </ThemedText>
            {displayedReviews.length === 0 ? (
              <ThemedText type="defaultText">
                This beer has no reviews yet.
              </ThemedText>
            ) : (
              displayedReviews.map((r, idx) => (
                <View key={idx}>
                  <ReviewCard
                    review={r as any}
                    currentUserId={currentUserId ?? undefined}
                    onDelete={
                      r.account_id
                        ? () => handleDeleteReview(r.account_id!)
                        : undefined
                    }
                  />
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Modal for batch size */}
      <Portal>
        <Modal
          visible={batchSizeModalVisible}
          onDismiss={() => setBatchSizeModalVisible(false)}
          contentContainerStyle={{
            backgroundColor: BASE_COLORS.LIGHT_BG,
            padding: 20,
            borderRadius: 16,
            marginHorizontal: 24,
            borderWidth: 1,
            borderColor: BASE_COLORS.STONE200,
          }}
        >
          <ThemedText type="title" className="text-center mb-4">
            Choose batch size
          </ThemedText>
          <View className="flex-row flex-wrap gap-2">
            {["5", "10", "19"].map((val) => {
              const selected = selectedBatchSizeOption === val;
              return (
                <SelectionChip
                  key={val}
                  text={`${val} L`}
                  testID={`batch-chip-${val}`}
                  isActive={selected}
                  onPress={() =>
                    setSelectedBatchSizeOption(val as "5" | "10" | "19")
                  }
                />
              );
            })}
            <SelectionChip
              text="Custom"
              testID="batch-chip-custom"
              isActive={selectedBatchSizeOption === "custom"}
              onPress={() => setSelectedBatchSizeOption("custom")}
            />
          </View>

          {selectedBatchSizeOption === "custom" && (
            <View className="mb-4">
              <TextInput
                placeholder="Custom volume in L"
                keyboardType="numeric"
                value={customBatchSize}
                onChangeText={(text) => {
                  const filtered = text.replace(/[^0-9.,]/g, "");
                  setCustomBatchSize(filtered);
                }}
              />
            </View>
          )}
          <View className="flex-row items-center justify-between mt-2">
            <SecondaryButton
              title="cancel"
              onPress={() => setBatchSizeModalVisible(false)}
              testID="cencel-start"
              size={14}
            />
            <PrimaryButton
              title="Confirm"
              onPress={handleConfirmBatchSize}
              testID="confirm-start"
              size={14}
            />
          </View>
        </Modal>
      </Portal>

      {/* Modal for Starterkits */}
      <Portal>
        <Modal
          visible={kitsVisible}
          onDismiss={() => setKitsVisible(false)}
          contentContainerStyle={{
            backgroundColor: BASE_COLORS.LIGHT_BG,
            padding: 20,
            borderRadius: 12,
            marginHorizontal: 12,
            maxHeight: "85%",
          }}
        >
          <ThemedText type="title" className="text-center mb-4">
            Get your StarterKit now!
          </ThemedText>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 55,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              {(() => {
                let filteredKits = kits;
                if (selectedBatchSizeOption !== "custom" && selectedBatchSize) {
                  filteredKits = kits.filter(
                    (kit) => kit.size_liters === selectedBatchSize
                  );
                }

                return filteredKits.length === 0 ? (
                  <ThemedText type="defaultText">
                    No starter kits available for this recipe.
                  </ThemedText>
                ) : (
                  filteredKits.map((kit) => (
                    <View
                      key={kit.id}
                      style={{
                        width: "49%",
                        marginBottom: 12,
                      }}
                    >
                      <StoreCard
                        image={require("@/assets/images/starterkit2.png")}
                        title={`${kit.name} • ${kit.size_liters}L`}
                        price={`€${kit.price.toFixed(2)}`}
                        onPress={() => {
                          setKitsVisible(false);
                          router.push({
                            pathname: "/StoreItem",
                            params: {
                              id: kit.id,
                              categoryNumber: 4,
                              from: "specificrecipe",
                              recipe_slug: recipe_slug,
                            },
                          } as any);
                        }}
                      />
                    </View>
                  ))
                );
              })()}
            </View>
          </ScrollView>
          <View className="flex-row items-center justify-between">
            <SecondaryButton
              testID="skip-button"
              title="Skip"
              onPress={async () => {
                console.log("Skip button pressed");
                console.log("recipe_slug:", recipe_slug);
                console.log("recipe:", recipe);
                console.log("selectedBatchSize:", selectedBatchSize);
                try {
                  await increment("modal_ready_start");
                } catch {
                  // ignore
                }
                setKitsVisible(false);
                const sizeToUse =
                  selectedBatchSize ?? recipe?.batch_size_l ?? 19;
                console.log("Calling brewRecipe with size:", sizeToUse);
                await brewRecipe(undefined, sizeToUse);
                console.log("brewRecipe completed");
              }}
            />
            {selectedBatchSizeOption !== "custom" &&
              (() => {
                let filteredKits = kits;
                if (selectedBatchSize) {
                  filteredKits = kits.filter(
                    (kit) => kit.size_liters === selectedBatchSize
                  );
                }
                const firstKit = filteredKits[0];

                return firstKit ? (
                  <PrimaryButton
                    testID="ordernow-button"
                    title="Order now"
                    onPress={() => {
                      setKitsVisible(false);
                      router.push({
                        pathname: "/StoreItem",
                        params: {
                          id: firstKit.id,
                          categoryNumber: 4,
                          from: "specificrecipe",
                          recipe_slug: recipe_slug,
                        },
                      } as any);
                    }}
                  />
                ) : null;
              })()}
          </View>
        </Modal>
      </Portal>

      {/* Modal for reviews */}
      <ReviewModal
        visible={reviewVisible}
        onDismiss={() => setReviewVisible(false)}
        recipe_slug={recipe_slug || ""}
        onSuccess={handleReviewSuccess}
      />

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
          onPress={handleInitialStartPress}
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

      <BadgeEarnedModal
        visible={badgeModalVisible}
        badgeName={badgeForModal?.name ?? null}
        iconUrl={badgeForModal?.iconUrl ?? null}
        onClose={() => setBadgeModalVisible(false)}
      />
    </SafeAreaView>
  );
}
