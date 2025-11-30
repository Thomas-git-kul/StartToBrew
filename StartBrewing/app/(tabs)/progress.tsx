import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, ScrollView, Dimensions, ActivityIndicator, Text, Pressable } from "react-native";
import { Card, FAB, Chip, Button, Dialog, Portal } from "react-native-paper";
import { Pause, Thermometer, Play, CheckCheck, Lightbulb, ChevronLeft, ChevronRight, MessageSquare, MessageCircle} from "lucide-react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import Header from "@/components/header";
import { BASE_COLORS } from "@/constants/Colors";
import { ThemedText } from "@/components/themed-text";
import { useFonts } from "@/hooks/use-fonts";
import { FontFamilies } from "@/constants/Fonts";
import { supabase } from "@/supabase";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";
import { useUserProgressContext } from "@/context/UserProgressContext";
import DialogCustom from "@/components/dialog";
import { transparent } from "react-native-paper/lib/typescript/styles/themes/v2/colors";
import Stepper from "@/components/Stepper"

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_SCREEN_WIDTH = 375;
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

export default function Progress() {
  useFonts();
  const router = useRouter();

  const { id } = useLocalSearchParams() as { id?: string };
  const brewId = id ? Number(id) : undefined;

  const [stepData, setStepData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState(1);
  const phaseRef = useRef(1);
  const [timerActive, setTimerActive] = useState(false);
  const [phaseDone, setPhaseDone] = useState(false);
  const { refreshProgress } = useUserProgressContext();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [allSteps, setAllSteps] = useState<any[]>([]);
  const [isHistoricalStep, setIsHistoricalStep] = useState(false);
  const [hasPreviousStep, setHasPreviousStep] = useState(false);

  const currentStep = useRef<any>(null);
  let CompletedStep = useRef<boolean>(false);

  const loadStep = useCallback(async (stepId?: string) => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setLoading(false);
        return;
      }

      const { data: brew } = await supabase
        .from("brews")
        .select("id_brew, recipe_slug, name, last_step_id, status_id")
        .eq("id_brew", brewId)
        .single();

      if (!brew) {
        setStepData(null);
        setLoading(false);
        return;
      }

      // Load phases and steps
      const { data: phases } = await supabase
        .from("phases")
        .select("*")
        .eq("recipe_slug", brew.recipe_slug)
        .order("position", { ascending: true });

      let allSteps: any[] = [];
      for (const phase of phases) {
        const { data: steps } = await supabase
          .from("steps")
          .select("*")
          .eq("phase_id", phase.phase_id)
          .order("step_id", { ascending: true });
        allSteps = [...allSteps, ...steps];
      }
      setAllSteps(allSteps);

       const currentIndex = stepId
        ? allSteps.findIndex((s) => s.step_id === stepId)
        : allSteps.findIndex((s) => s.step_id === brew.last_step_id);

        if (currentIndex === -1) {
          console.error("No matching step found for last_step_id", brew.last_step_id);
          setStepData(null);
          setLoading(false);
          return;
        }

      currentStep.current = allSteps[currentIndex];
      const nextStep = allSteps[currentIndex + 1];
      setHasPreviousStep(currentIndex > 0);

      const { data: brew_steps } = await supabase
        .from("brew_steps")
        .select("*")
        .eq("id_brew", brewId)
        .eq("step_id", currentStep.current.step_id)
        .single();

      // Check of we een historische stap bekijken
      const isHistorical = brew_steps.status === "completed" || currentStep.current.status === "in_progress";
      setIsHistoricalStep(isHistorical);

      const { data: tips } = await supabase
        .from("step_tips")
        .select("step_id, tip_md")
        .eq("step_id", brew.last_step_id)
        .single();

      // Load ingredients for current step
      const ingredientRefsCurrentRes = await supabase
        .from("step_ingredient_refs")
        .select("*")
        .eq("step_id", currentStep.current.step_id);
      const ingredientRefsCurrent = ingredientRefsCurrentRes.data as { ingredient_id: number; amount_g: number | null }[] | null;

      const currentIngredients: { name: string; kind: string; amount_g: number | null }[] = [];
      if (ingredientRefsCurrent && ingredientRefsCurrent.length > 0) {
        const ingredientIds = ingredientRefsCurrent.map((r) => r.ingredient_id);

        const { data: ingRows } = await supabase
          .from("ingredients")
          .select("*")
          .in("ingredient_id", ingredientIds);

        // Combine ingredient + amount into unified objects
        ingredientRefsCurrent.forEach((ref: { ingredient_id: number; amount_g: number | null }) => {
          const info = ingRows.find((i: any) => i.ingredient_id === ref.ingredient_id);
          if (info) {
            currentIngredients.push({
              name: info.name,
              kind: info.kind,
              amount_g: ref.amount_g,
            });
          }
        });
      }

      let nextIngredients: { name: string; kind: string; amount_g: number | null }[] = [];
        if (nextStep) {
          const ingredientRefsNextRes = await supabase
            .from("step_ingredient_refs")
            .select("*")
            .eq("step_id", nextStep.step_id);
          const ingredientRefsNext = ingredientRefsNextRes.data as { ingredient_id: number; amount_g: number | null }[] | null;

          if (ingredientRefsNext && ingredientRefsNext.length > 0) {
            const ingredientIdsNext = ingredientRefsNext.map((r) => r.ingredient_id);

            const { data: ingRowsNext } = await supabase
              .from("ingredients")
              .select("*")
              .in("ingredient_id", ingredientIdsNext);

            ingredientRefsNext.forEach((ref: { ingredient_id: number; amount_g: number | null }) => {
              const info = ingRowsNext.find((i: any) => i.ingredient_id === ref.ingredient_id);
              if (info) {
                nextIngredients.push({
                  name: info.name,
                  kind: info.kind,
                  amount_g: ref.amount_g,
                });
              }
            });
          }
        }

      // Determine if there is multiple steps
      const nextHasOffset =
        nextStep && nextStep.start_offset_min && nextStep.start_offset_min > 0;
      let mapped;
      if (nextHasOffset) {
        const afterNextStep = allSteps[currentIndex + 2] ?? null;

        mapped = {
          mode: "two",
          beer: brew.name,
          temp: nextStep.temp_c_target ?? null,
          current_step_id: currentStep.current.step_id,
          next_step_id: nextStep.step_id,
          after_next_step_id: afterNextStep?.step_id ?? null,
          step1: {
            title: currentStep.current.title,
            desc: currentStep.current.description_md,
            tips: tips?.tip_md ?? null,
            duration_sec: nextStep.start_offset_min ?? 0,
            ingredients: currentIngredients,
          },
          step2: {
            title: nextStep.title,
            desc: nextStep.description_md,
            tips: tips?.tip_md ?? null,
            duration_sec: nextStep.duration_min ?? 0,
            ingredients: nextIngredients,
          },
        };
      } else {
        mapped = {
          mode: "single",
          beer: brew.name,
          temp: currentStep.current.temp_c_target ?? null,
          current_step_id: currentStep.current.step_id,
          next_step_id: nextStep?.step_id ?? null,
          step1: {
            title: currentStep.current.title,
            desc: currentStep.current.description_md,
            tips: tips?.tip_md ?? null,
            duration_sec: currentStep.current.duration_min ?? 0 /* * 60*/,
            ingredients: currentIngredients,
          },
          step2: null,
        };
      }

      setStepData(mapped);

      // reset timer state after reload
      setPhase(1);
      setTimerActive(false);
      setPhaseDone(mapped.mode === "single" && mapped.step1.duration_sec === 0);
    } catch (e) {
      console.error("loadStep error", e);
      setStepData(null);
    }
    setLoading(false);
  }, [brewId]);

  useFocusEffect(
    useCallback(() => {
      setIsHistoricalStep(false);
      loadStep();
    }, [loadStep])
  );

  useEffect(() => {
    if (!stepData) return;

    if (stepData.mode === "two" && phase === 2) {
      setHasPreviousStep(true);
    } else {
      const currentIndex = allSteps.findIndex(
        s => s.step_id === currentStep.current?.step_id
      );
      setHasPreviousStep(currentIndex > 0);
    }
  }, [stepData, phase, allSteps]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const durationSec =
    phase === 1
      ? (stepData?.step1?.duration_sec ?? 0)
      : (stepData?.step2?.duration_sec ?? 0);

  const hasTimer = durationSec > 0;
  const hasTemp = stepData?.temp != null;

  const goToNextStep = useCallback(async () => {
    if (!brewId || !stepData?.current_step_id) {
      console.log("Aborted goToNextStep: missing brewId or current_step_id", {
        brewId,
        stepData,
      });
      return;
    }

    const currentIndex = allSteps.findIndex(
      s => s.step_id === currentStep.current?.step_id
    );
    const nextStep = allSteps[currentIndex + 1];

    if (!nextStep) {
      // Laatste stap
      await refreshProgress();
      router.push("/homepage");
      return;
    }

    if (isHistoricalStep) {
      loadStep(nextStep.step_id);
      return;
    }

    try {
      const updates = [];
      //start brewing
      // If brew is planned: change status → in_progress + set start date
      const { data: brewStatus } = await supabase
        .from("brews")
        .select("status_id")
        .eq("id_brew", brewId)
        .single();

      if (brewStatus?.status_id === 1) { // assuming 1 = planned
        await supabase
          .from("brews")
          .update({
            status_id: 2, // in_progress
            start_date: new Date().toISOString()
          })
          .eq("id_brew", brewId);
      }

      // Always complete the current step
      updates.push({
        step_id: stepData.current_step_id,
      });

      // If two steps form one → also complete step2
      if (stepData.mode === "two" && stepData.next_step_id) {
        updates.push({
          step_id: stepData.next_step_id,
        });
      }

      for (const u of updates) {
        await supabase
          .from("brew_steps")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id_brew", brewId)
          .eq("step_id", u.step_id);
      }

      let newLastStepId;

      if (stepData.mode === "two") {
        // Skip both currentStep + nextStep → go to the step AFTER nextStep
        const afterMergedStep = stepData.after_next_step_id ?? null;
        newLastStepId = afterMergedStep;
      } else {
        // normal single-step behaviour
        newLastStepId = stepData.next_step_id;
      }

      const isLastStep = !newLastStepId;

      await supabase
        .from("brews")
        .update({
          last_step_id: newLastStepId,
          ...(isLastStep ? { status_id: 3 } : {}),
        })
        .eq("id_brew", brewId);

      if (isLastStep) {
        await refreshProgress();
        router.push("/HomePage");
        return;
      }

      await loadStep();
    } catch (error) {
      console.error("goToNextStep error:", error);
    }
  }, [brewId, stepData, loadStep, router]);

  const goToPreviousStep = useCallback(() => {
    if (!stepData || allSteps.length === 0) return;

    if (stepData.mode === "two" && phaseRef.current === 2) {
      // Alleen terug naar fase 1
      setPhase(1);
      setPhaseDone(false);
      setTimerActive(false);
      return;
    }

    const currentIndex = allSteps.findIndex(
      (s) => s.step_id === currentStep.current?.step_id
    );

    if (currentIndex <= 0) {
      console.log("No previous step available.");
      return;
    }

    // Vind de vorige stap
    const prevStep = allSteps[currentIndex - 1];

    setIsHistoricalStep(true);

    // Herlaad die stap via loadStep
    loadStep(prevStep.step_id);
  }, [stepData, allSteps, loadStep]);


  // To delete brews
  const deleteBrew = useCallback(async () => {
    if (!brewId) return;

    try {
      // Delete brew_steps first (FK constraint)
      await supabase.from("brew_steps").delete().eq("id_brew", brewId);

      // Delete the brew
      await supabase.from("brews").delete().eq("id_brew", brewId);

      router.push("/HomePage");
    } catch (error) {
      console.error("deleteBrew error:", error);
    }
  }, [brewId, router]);

  const showDialog = () => setDialogVisible(true);
  const hideDialog = () => setDialogVisible(false);

  const confirmDeleteBrew = () => {
    hideDialog();
    deleteBrew();
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
      >
        <ActivityIndicator
          animating
          size="large"
          color={BASE_COLORS.ACCENT_PRIMARY}
        />
        <ThemedText type="defaultText" className="mt-3">
          Loading progress...
        </ThemedText>
      </SafeAreaView>
    );
  }
  if (!stepData) {
    return (
      <SafeAreaView
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
      >
        <ThemedText type="defaultText" className="mt-3">
          Failed to load progress...
        </ThemedText>
      </SafeAreaView>
    );
  }

  const title =
    phase === 1
      ? stepData.step1.title
      : (stepData.step2?.title ?? stepData.step1.title);
  const desc =
    phase === 1
      ? stepData.step1.desc
      : (stepData.step2?.desc ?? stepData.step1.desc);
  const tips = phase === 1 ? stepData.step1.tips : stepData.step2?.tips;
  const ingredients: { name: string; kind: string; amount_g: number | null }[] = (phase === 1 ? stepData.step1.ingredients : stepData.step2?.ingredients) ?? [];

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
    >
      <Header
        title={stepData.beer}
        actionTestIDLeft="back-header"
        iconNameLeft="ArrowLeft"
        onIconPressLeft={() => router.back()}
      />
      <ScrollView
        className="px-3"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 85 }}
      >
        <Stepper
          step={allSteps.findIndex(s => s.step_id === currentStep.current?.step_id) + 1}
          total={allSteps.length}
          onNext={() => {
            if (!phaseDone && !isHistoricalStep) return;
            goToNextStep();
          }}
          onPrev={goToPreviousStep}
        />

        <View className="flex-row justify-between items-center">
          <ThemedText type="title"
          /*
            style={{
              fontSize: Math.min(18 * scale, 26),
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.STONE700,
            }}
          */
          >{title}</ThemedText>
          {hasTemp && (
            <Chip
              style={{
                alignItems: "flex-start",
                backgroundColor: BASE_COLORS.WHITE,
                shadowColor: BASE_COLORS.STONE700,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.07,
                paddingVertical: 4,
                paddingHorizontal: 8,
              }}
              textStyle={{
                fontSize: Math.min(17 * scale, 26),
                color: BASE_COLORS.STONE500,
                fontFamily: FontFamilies.BODY,
                flexWrap: 'wrap',
              }}
              icon={(props) => (
                <Thermometer
                  size={props.size}
                  color={BASE_COLORS.STONE500}
                  strokeWidth={0.5}
                  fill={BASE_COLORS.AMBER600}
                />
              )}
            >
              <Text style={{ flexWrap: 'wrap' }}>{`${stepData.temp}°C`}</Text>
            </Chip>
          )}
        </View>
        {stepData.mode === "two" && phase === 1 && (
          <Text
            style={{
              fontSize: Math.min(15 * scale, 22),
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.STONE600,
              marginTop: -4,
            }}
          >
            (+ {stepData.step2.title})
          </Text>
        )}

        {hasTimer && !CompletedStep.current && (
          <Card
            style={{
              marginBlock: 12,
              padding: 16,
              borderRadius: 8,
              backgroundColor: BASE_COLORS.WHITE,
              shadowColor: BASE_COLORS.STONE700,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.07,
              alignItems: "center",
            }}
          >
            <CountdownCircleTimer
              key={`${phase}`}
              isPlaying={timerActive}
              isGrowing={true}
              rotation="counterclockwise"
              duration={Math.max(1, durationSec)}
              colors={[BASE_COLORS.STONE300, BASE_COLORS.STONE200]}
              colorsTime={[0, Math.max(1, durationSec)]}
              trailColor={
                !phaseDone ? BASE_COLORS.TEXT_DARK : BASE_COLORS.STONE200
              }
              strokeWidth={10}
              onComplete={() => {
                if (stepData.mode === "two" && phase === 1) {
                  setTimerActive(false);
                  setPhase(2);
                  return { shouldRepeat: false };
                }
                setPhaseDone(true);
                setTimerActive(false);
                return { shouldRepeat: false };
              }}
            >
              {({ remainingTime }) => (
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: Math.min(22 * scale, 28),
                      color: BASE_COLORS.STONE800,
                      fontFamily: FontFamilies.BODY,
                      marginBottom: 8,
                    }}
                  >
                    {Math.floor(remainingTime / 60)}m {remainingTime % 60}s
                  </Text>
                  <Button
                    mode="contained"
                    compact
                    disabled={phaseDone}
                    onPress={() => setTimerActive((p) => !p)}
                    style={{
                      borderRadius: 30,
                      backgroundColor: !phaseDone
                        ? BASE_COLORS.TEXT_DARK
                        : BASE_COLORS.STONE200,
                      paddingInline: 8,
                    }}
                  >
                    {timerActive ? (
                      <Pause
                        size={Math.min(18 * scale, 26)}
                        color={BASE_COLORS.WHITE}
                        fill={BASE_COLORS.WHITE}
                        strokeWidth={0.5}
                      />
                    ) : (
                      <Play
                        size={Math.min(18 * scale, 26)}
                        color={BASE_COLORS.WHITE}
                        fill={BASE_COLORS.WHITE}
                        strokeWidth={1}
                      />
                    )}
                  </Button>
                </View>
              )}
            </CountdownCircleTimer>
          </Card>
        )}

        {(phase === 1 ? stepData.step1.ingredients : stepData.step2?.ingredients)?.length > 0 && (
          <View>
            <ThemedText type="subTitle">Ingredients:</ThemedText>

            {(ingredients)
              .map((ing, idx) => (
                <View key={idx} className="flex-row items-center">
                  <ThemedText type="defaultText">• {ing.name} ({ing.kind}): {ing.amount_g} g</ThemedText>
                </View>
              ))}
          </View>
        )}

        <View>        
          <View className="mb-2">
            {desc?.split(".").map((s: string, i: number) => {
              const clean = s.trim();
              if (!clean) return null;
              return (
                <ThemedText key={i} type="defaultText" className="mb-2">
                  {clean}.
                </ThemedText>
              );
            })}
          </View>
        </View>

        {tips && (
          <Chip
            mode="flat"
            icon={() => (<Lightbulb size={30} color={BASE_COLORS.ACCENT_LIGHT} />)}
            style={{
              backgroundColor: "transparent",
              flex: 1,
              flexWrap: "wrap"
            }}
          >
            <ThemedText type="tips">
              {tips}
            </ThemedText>
          </Chip>
        )}
      </ScrollView>
      {/*
      <FAB
        testID="fab-button"
        mode="flat"
        label={isHistoricalStep ? "Next" : "Next Step"}
        icon={(props) => {
          return isHistoricalStep ? (
            <ChevronRight {...props} size={Math.min(24 * scale, 34)} />
          ) : (
            <CheckCheck {...props} size={Math.min(24 * scale, 34)} />
          );
        }}
        onPress={() => {
          if (!phaseDone && !isHistoricalStep) return;
          goToNextStep();
        }}
        disabled={!phaseDone && !isHistoricalStep}
        color={BASE_COLORS.WHITE}
        style={{
          borderRadius: 30,
          backgroundColor: !phaseDone && !isHistoricalStep
            ? BASE_COLORS.STONE200
            : BASE_COLORS.TEXT_DARK,
          position: "absolute",
          bottom: 20,
          right: 20,
        }}
        theme={{
          colors: {
            onSurfaceDisabled: BASE_COLORS.STONE400,
          },
          fonts: {
            labelLarge: {
              fontSize: Math.min(16 * scale, 24),
              fontFamily: FontFamilies.BODY,
            },
          },
        }}
      />
      <FAB
        testID="fab-button"
        mode="flat"
        label="Back Step"
        icon={(props) => {
          return <ChevronLeft {...props} size={Math.min(24 * scale, 34)} />;
        }}
        onPress={() => {
          goToPreviousStep();
        }}
        disabled={!hasPreviousStep}
        color={BASE_COLORS.WHITE}
        style={{
          borderRadius: 30,
          backgroundColor: !hasPreviousStep 
            ? BASE_COLORS.STONE200
            : BASE_COLORS.TEXT_DARK,
          position: "absolute",
          bottom: 20,
          left: 20,
        }}
        theme={{
          colors: {
            onSurfaceDisabled: BASE_COLORS.STONE400,
          },
          fonts: {
            labelLarge: {
              fontSize: Math.min(16 * scale, 24),
              fontFamily: FontFamilies.BODY,
            },
          },
        }}
      />
      */}
      <FAB
        testID="chat-button"
        mode="flat"
        icon={(props) => <MessageCircle size={props.size} strokeWidth={0} color={props.color} fill={props.color}/>}
        onPress={() => {
          router.push(`/ChatBot`); 
        }}
        color={BASE_COLORS.WHITE}
        style={{
          borderRadius: 30,
          backgroundColor: BASE_COLORS.TEXT_DARK,
          position: "absolute",
          bottom: 90,
          right: 20,
        }}
        theme={{
          colors: {
            onSurfaceDisabled: BASE_COLORS.STONE400,
          },
          fonts: {
            labelLarge: {
              fontSize: Math.min(16 * scale, 24),
              fontFamily: FontFamilies.BODY,
            },
          },
        }}
      />
    </SafeAreaView>
  );
}
