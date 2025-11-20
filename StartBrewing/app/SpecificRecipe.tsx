import { useState, useEffect } from "react";
import { View, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { FAB, Modal, Portal, Button } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../supabase";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/header";
import { useFonts } from "@/hooks/use-fonts";
import { Star } from "lucide-react-native";
import { ThemedText } from "@/components/themed-text";

export default function SpecificRecipe() {
  useFonts()

  const router = useRouter();

  const { slug } = useLocalSearchParams() as { slug?: string };

  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<{
    name: string;
    description: string;
    rating: number;
    reviews?: number;
  } | null>(null);

  const [reviewVisible, setReviewVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [userReviewExists, setUserReviewExists] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const submitReview = async (value: number) => {
    console.log('submitReview called', { value, slug, submittingReview });
    if (submittingReview) {
      console.log('Already submitting, ignoring');
      return;
    }
    if (!slug) {
      console.warn('No slug present, cannot submit review');
      Alert.alert('Error', 'Geen recept geselecteerd.');
      return;
    }
    setSubmittingReview(true);
    setRating(value);
    setReviewVisible(false);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('supabase.auth.getUser result', { user, userError });
      if (userError || !user) {
        console.error('Error fetching user for review:', userError?.message);
        Alert.alert('Niet ingelogd', 'Je moet ingelogd zijn om een review te plaatsen.');
        setSubmittingReview(false);
        return;
      }

      // check if user already reviewed this recipe
      const { data: existingReview, error: existErr } = await supabase
        .from('recipe_reviews')
        .select('id_recipe_review')
        .eq('account_id', user.id)
        .eq('recipe_slug', slug)
        .maybeSingle();

      console.log('existingReview check', { existingReview, existErr });

      if (existingReview) {
        setUserReviewExists(true);
        setSubmittingReview(false);
        return;
      }

      // insert new review
      const { data: insertData, error: insertErr } = await supabase
        .from('recipe_reviews')
        .insert([
          {
            account_id: user.id,
            recipe_slug: slug,
            rating: value,
            review_text: '',
          },
        ])
        .select();

      if (insertErr) {
        console.error('Error inserting review:', insertErr.message, insertErr);
        Alert.alert('Fout bij opslaan', insertErr.message ?? 'Kon review niet opslaan');
        setSubmittingReview(false);
        return;
      }

      console.log('insertData', insertData);

      // recompute average rating and review count
      const { data: allRatings, error: ratingsErr } = await supabase
        .from('recipe_reviews')
        .select('rating')
        .eq('recipe_slug', slug);

      if (ratingsErr) {
        console.error('Error fetching ratings for aggregate:', ratingsErr.message);
        setSubmittingReview(false);
        return;
      }

      const count = allRatings?.length ?? 0;
      const avg = count > 0
        ? allRatings.reduce((sum: number, r: any) => sum + Number(r.rating), 0) / count
        : value;

      // round to 2 decimals
      const avgRounded = Number(Number(avg).toFixed(2));

      const { error: updateRecipeErr } = await supabase
        .from('recipes')
        .update({ rating: avgRounded, review_count: count })
        .eq('recipe_slug', slug);

      if (updateRecipeErr) {
        console.error('Error updating recipe rating:', updateRecipeErr.message);
      }

      // success
      console.log('Review submitted successfully', { avg: avgRounded, count });
      Alert.alert('Bedankt', 'Je review is opgeslagen');

      setRecipe((prev) => prev ? { ...prev, rating: avgRounded, reviews: count } : {
        name: recipe?.name ?? 'Recipe',
        description: recipe?.description ?? '',
        rating: avgRounded,
        reviews: count,
      });
      setUserReviewExists(true);
    } catch (e: any) {
      console.error('Exception while submitting review:', e?.message ?? e);
    } finally {
      setSubmittingReview(false);
    }
  };

  const brewRecipe = async () => {
  if (!slug || !recipe?.name) {
    console.warn("Cannot start brew: missing slug or recipe name.");
    return;
  }
  console.log("Start brewing brewRecipe");

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("User:", user);

    if (userError || !user) {
      console.error("Error fetching user for brew:", userError?.message);
      return;
    }

    const { data: phasesData, error: phasesError } = await supabase
      .from("phases")
      .select("phase_id")
      .eq("recipe_slug", slug)
      .order("position", { ascending: true });

    if (phasesError || !phasesData?.length) {
      console.error("Error fetching phases:", phasesError?.message || "No phases found.");
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
      .is("after_step_id", null) // startstap
      .limit(1)
      .single();

    if (firstStepError || !firstStepData) {
      console.error("Error finding first step:", firstStepError?.message || "No starting step found.");
      return;
    }

    const firstStepId = firstStepData.step_id;
    console.log("First step:", firstStepId);

    const newBrew = {
      user_id: user.id,
      name: recipe.name,
      start_date: new Date().toISOString(),
      status_id: 1,
      recipe_slug: slug,
      last_step_id: firstStepId,
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
    console.log("New brew started successfully:", brewId);

    const { data: allSteps, error: stepsError } = await supabase
      .from("steps")
      .select("step_id, after_step_id")
      .in("phase_id", phaseIds)

    if (stepsError || !allSteps?.length) {
      console.error("Error fetching steps:", stepsError?.message || "No steps found.");
      return;
    }

    interface Step {
      step_id: string;
      after_step_id: string | null;
    }

    const orderedSteps: Step[] = [];
    let currentStep = allSteps.find((s: Step) => s.after_step_id === null);

    while (currentStep) {
      orderedSteps.push({ 
        step_id: currentStep.step_id, 
        after_step_id: currentStep.after_step_id 
      });
      
      currentStep = allSteps.find((s: Step) => s.after_step_id === currentStep.step_id);
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
    } else {
      console.log("All brew steps added successfully!");
    }

    router.push("../progress");

  } catch (e: any) {
    console.error("Exception during brew start:", e.message ?? e);
  }
};


  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("recipes")
          .select("name,description,rating,review_count")
          .eq("recipe_slug", String(slug))
          .single();

        if (error) {
          console.warn("Supabase fetch recipe error:", error.message);
          if (mounted) setRecipe(null);
        } else if (data) {
            if (mounted)
            setRecipe({
              name: data.name ?? "Untitled Recipe",
              description: data.description ?? "",
              rating: typeof data.rating === "number" ? data.rating : Number(data.rating ?? 0),
              reviews: typeof data.review_count === 'number' ? data.review_count : Number(data.review_count ?? 0),
            });

          // After loading recipe data, also check whether the current user already left a review
          // and fetch the current review count/average to keep the UI in sync.
          try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (!userError && user) {
              const { data: userReview, error: urErr } = await supabase
                .from('recipe_reviews')
                .select('rating')
                .eq('account_id', user.id)
                .eq('recipe_slug', slug)
                .single();

              if (!urErr && userReview) {
                setUserReviewExists(true);
                setRating(Number(userReview.rating ?? 0));
              }
            }

            const { data: ratingsData } = await supabase
              .from('recipe_reviews')
              .select('rating')
              .eq('recipe_slug', slug);

            const count = ratingsData?.length ?? 0;
            if (mounted) {
              if (count && ratingsData) {
                const avg = ratingsData.reduce((s: number, r: any) => s + Number(r.rating), 0) / count;
                setRecipe((prev) => prev ? { ...prev, rating: avg, reviews: count } : prev);
              } else {
                setRecipe((prev) => prev ? { ...prev, reviews: count } : prev);
              }
            }
          } catch (e: any) {
            console.warn('Error fetching user review or rating count:', e?.message ?? e);
          }
        }
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
  }, [slug]);

  const ingredients = [
    "not yet implemented",
  ];

  return (
    <SafeAreaView
      className="flex-1"
      style={{backgroundColor: BASE_COLORS.LIGHT_BG}}
    >
      <Header
        title={recipe?.name ?? (loading ? "Loading…" : "Recipe")}
        iconName="ArrowRight"
        onIconPress={() => router.push("/Recipes" as any)}
        actionTestID="cart-button"
      />

      <ScrollView className="flex-1 mx-3"
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        <View className="items-center mb-5">
          <Image
            source={require("@/assets/images/default-beer.png")}
            style={{
              width: "100%",
              borderRadius: 16,
            }}
            resizeMode="cover"
          />
        </View>

        {/* Rating */}
        {loading ? (
          <View style={{ alignItems: "center", marginVertical: 16 }}>
            <ActivityIndicator />
          </View>
        ) : (
          <View className="flex-row items-center justify-center mb-4 gap-2">
            <Star size={22} color={BASE_COLORS.ACCENT_LIGHT} fill={BASE_COLORS.ACCENT_LIGHT} />
            <ThemedText type="subTitle">{(recipe?.rating ?? 0).toFixed(1)} / 5</ThemedText>
            <ThemedText type="subTitle">({recipe?.reviews ?? 0} reviews)</ThemedText>
            {!userReviewExists ? (
              <TouchableOpacity
                onPress={() => setReviewVisible(true)}
                style={{ marginLeft: 8, paddingVertical: 4, paddingHorizontal: 10 }}
              >
                <ThemedText type="subTitle">Add Review</ThemedText>
              </TouchableOpacity>
            ) : (
              <ThemedText type="subTitle">You reviewed</ThemedText>
            )}
          </View>
        )}

        {/* Brew Info */}
        <ThemedText type="defaultText" className="mb-3">
          {loading ? "" : recipe?.description ?? ""}
        </ThemedText>

        {/* Ingredients */}
        {ingredients.map((item, index) => (
          <View key={index} className="flex-row items-start mt-2 ml-3 gap-3">
            <ThemedText type="defaultText">•</ThemedText>
            <ThemedText type="defaultText">{item}</ThemedText>
          </View>
        ))}
      </ScrollView>

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
          <ThemedText type="title" className="text-center mb-4">Rate this recipe</ThemedText>

          <View className="flex-row justify-center gap-3">
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity 
                key={value} 
                onPress={() => submitReview(value)}
                testID={`star-${value}`}
              >
                <Star
                  size={36}
                  stroke={value <= rating ? BASE_COLORS.ACCENT_LIGHT : BASE_COLORS.STONE300}
                  fill={value <= rating ? BASE_COLORS.ACCENT_LIGHT : "transparent"}
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
          onPress={brewRecipe}
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
};
