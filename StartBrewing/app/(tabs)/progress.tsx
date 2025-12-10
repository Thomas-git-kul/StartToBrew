// COMPONENTS
import { BadgeEarnedModal } from "@/components/BadgeEarnedModal";
import Header from "@/components/header";
import PrimaryButton from "@/components/primaryButton";
import { ReviewModal } from "@/components/reviewModal";
import Spinner from "@/components/spinner";
import Stepper from "@/components/Stepper";
import { ThemedText } from "@/components/themed-text";

// CONSTANTS / CONTEXT / HOOKS
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useUserProgressContext } from "@/context/UserProgressContext";
import { useFonts } from "@/hooks/use-fonts";
import { supabase } from "@/supabase";
import { fetchLatestBadge } from "@/supabase/queries/badges";

// NAVIGATION
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

// REACT / RN / UI LIBS
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  View
} from "react-native";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";
import { Button, Card, FAB } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

// ICONS
import {
  BotMessageSquare,
  Lightbulb,
  Pause,
  Play,
  Thermometer
} from "lucide-react-native";


const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_SCREEN_WIDTH = 375;
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

// Default batch size waarop alle recepten gebaseerd zijn
const BASE_BATCH_SIZE_L = 19;

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
  const [allSteps, setAllSteps] = useState<any[]>([]);
  const [isHistoricalStep, setIsHistoricalStep] = useState(false);
  const [isForwardStep, setIsForwardStep] = useState(false);
  const [hasPreviousStep, setHasPreviousStep] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const { from } = useLocalSearchParams() as { from?: string };
  const [brew, setBrew] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [latestBadgeId, setLatestBadgeId] = useState<number | null>(null);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [badgeForModal, setBadgeForModal] = useState<{
    name: string | null;
    iconUrl: string | null;
  } | null>(null);
  const [navigateAfterBadge, setNavigateAfterBadge] = useState<
    "/HomePage" | null
  >(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const currentStep = useRef<any>(null);
  let CompletedStep = useRef<boolean>(false);

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

  const loadStep = useCallback(
    async (stepId?: string) => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          setLoading(false);
          return;
        }

        const user = userData.user;
        setCurrentUserId(user.id);
        // baseline latest badge (alleen eerste keer of als je dat wil)
        if (latestBadgeId === null) {
          const latest = await fetchLatestBadge(user.id);
          if (latest) {
            setLatestBadgeId(latest.id);
          }
        }
        const { data: brew } = await supabase
          .from("brews")
          .select(
            "id_brew, recipe_slug, name, last_step_id, status_id, batch_size_l"
          )
          .eq("id_brew", brewId)
          .single();

        if (!brew) {
          setStepData(null);
          setLoading(false);
          return;
        }

        setBrew(brew);

        // schaalfactor obv batch_size_l t.o.v. 19 L
        const scaleFactor =
          (brew.batch_size_l ?? BASE_BATCH_SIZE_L) / BASE_BATCH_SIZE_L;

        // Load phases and steps
        const { data: phases } = await supabase
          .from("phases")
          .select("*")
          .eq("recipe_slug", brew.recipe_slug)
          .order("position", { ascending: true });

        let allStepsLocal: any[] = [];
        for (const phase of phases) {
          const { data: steps } = await supabase
            .from("steps")
            .select("*")
            .eq("phase_id", phase.phase_id)
            .order("step_id", { ascending: true });
          allStepsLocal = [...allStepsLocal, ...(steps ?? [])];
        }
        setAllSteps(allStepsLocal);

        const currentIndex = stepId
          ? allStepsLocal.findIndex((s) => s.step_id === stepId)
          : allStepsLocal.findIndex((s) => s.step_id === brew.last_step_id);

        if (currentIndex === -1) {
          console.error(
            "No matching step found for last_step_id",
            brew.last_step_id
          );
          setStepData(null);
          setLoading(false);
          return;
        }

        currentStep.current = allStepsLocal[currentIndex];
        const nextStep = allStepsLocal[currentIndex + 1];
        setHasPreviousStep(currentIndex > 0);

        const { data: brew_steps } = await supabase
          .from("brew_steps")
          .select("*")
          .eq("id_brew", brewId)
          .eq("step_id", currentStep.current.step_id)
          .single();

        if (!stepId && brew_steps?.status === "completed") {
          let nextIncompleteIndex = currentIndex + 1;
          while (nextIncompleteIndex < allStepsLocal.length) {
            const { data: nextStepStatus } = await supabase
              .from("brew_steps")
              .select("status")
              .eq("id_brew", brewId)
              .eq("step_id", allStepsLocal[nextIncompleteIndex].step_id)
              .single();
            
            if (nextStepStatus?.status !== "completed") {
              await loadStep(allStepsLocal[nextIncompleteIndex].step_id);
              return;
            }
            nextIncompleteIndex++;
          }
        }

        setCompletedAt(
          brew_steps?.completed_at ? new Date(brew_steps.completed_at) : null
        );

        // Prepare auto-start restore values if there is a stored timer
        let autoStartRemaining: number | null = null;
        let autoStartExpired = false;
        
        // Only restore timer state if the step is in progress (not pending, not completed)
        if (brew_steps?.status === "in_progress" && brew_steps?.completed_at && brew_steps?.time_left != null) {
          const lastStart = new Date(brew_steps.completed_at).getTime();
          const now = Date.now();
          const elapsedSec = Math.floor((now - lastStart) / 1000);

          const newRemaining = Math.max(0, brew_steps.time_left - elapsedSec);
          if (newRemaining > 0) {
            autoStartRemaining = newRemaining;
          } else {
            autoStartExpired = true;
          }
        }

        // Check of we een historische stap bekijken
        const isHistorical = brew_steps.status === "completed";
        setIsHistoricalStep(isHistorical);

        let isForward = false;
        if (brew_steps.status === "pending" && brew.last_step_id != brew_steps.step_id) {
          // Check if there are any incomplete steps before this one
          for (let i = 0; i < currentIndex; i++) {
            const { data: prevStepStatus } = await supabase
              .from("brew_steps")
              .select("status")
              .eq("id_brew", brewId)
              .eq("step_id", allStepsLocal[i].step_id)
              .single();
            
            if (prevStepStatus?.status !== "completed") {
              isForward = true;
              break;
            }
          }
        }
        setIsForwardStep(isForward);

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
        const ingredientRefsCurrent = ingredientRefsCurrentRes.data as
          | {
              ingredient_id: string;
              amount: number | null;
              unit: string | null;
            }[]
          | null;

        const currentIngredients: {
          name: string;
          kind: string;
          amount: number | null;
          unit: string | null;
        }[] = [];
        if (ingredientRefsCurrent && ingredientRefsCurrent.length > 0) {
          const ingredientIds = ingredientRefsCurrent.map(
            (r) => r.ingredient_id
          );

          const { data: ingRows } = await supabase
            .from("ingredients")
            .select("*")
            .in("ingredient_id", ingredientIds as string[]);

          // Combine ingredient + scaled amount + unit
          ingredientRefsCurrent.forEach(
            (ref: {
              ingredient_id: string;
              amount: number | null;
              unit: string | null;
            }) => {
              const info = ingRows?.find(
                (i: any) => i.ingredient_id === ref.ingredient_id
              );
              if (info) {
                currentIngredients.push({
                  name: info.name,
                  kind: info.kind,
                  amount: ref.amount != null ? ref.amount * scaleFactor : null,
                  unit: ref.unit,
                });
              }
            }
          );
        }

        let nextIngredients: {
          name: string;
          kind: string;
          amount: number | null;
          unit: string | null;
        }[] = [];
        if (nextStep) {
          const ingredientRefsNextRes = await supabase
            .from("step_ingredient_refs")
            .select("*")
            .eq("step_id", nextStep.step_id);
          const ingredientRefsNext = ingredientRefsNextRes.data as
            | {
                ingredient_id: string;
                amount: number | null;
                unit: string | null;
              }[]
            | null;

          if (ingredientRefsNext && ingredientRefsNext.length > 0) {
            const ingredientIdsNext = ingredientRefsNext.map(
              (r) => r.ingredient_id
            );

            const { data: ingRowsNext } = await supabase
              .from("ingredients")
              .select("*")
              .in("ingredient_id", ingredientIdsNext as string[]);

            ingredientRefsNext.forEach(
              (ref: {
                ingredient_id: string;
                amount: number | null;
                unit: string | null;
              }) => {
                const info = ingRowsNext?.find(
                  (i: any) => i.ingredient_id === ref.ingredient_id
                );
                if (info) {
                  nextIngredients.push({
                    name: info.name,
                    kind: info.kind,
                    amount:
                      ref.amount != null ? ref.amount * scaleFactor : null,
                    unit: ref.unit,
                  });
                }
              }
            );
          }
        }

        const nextHasOffset =
          nextStep &&
          nextStep.start_offset_min &&
          nextStep.start_offset_min > 0;
        let mapped;
        if (nextHasOffset) {
          const afterNextStep = allStepsLocal[currentIndex + 2] ?? null;

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
              duration_sec: currentStep.current.duration_min ?? 0,
              ingredients: currentIngredients,
            },
            step2: null,
          };
        }

        // If we have a stored running timer, apply recalculated remaining time
        if (autoStartRemaining != null) {
          if (mapped.mode === "single") {
            mapped.step1.duration_sec = autoStartRemaining;
          } else {
            mapped.step1.duration_sec = autoStartRemaining;
          }
          setTimerActive(true);
          setPhaseDone(false);
        } else if (autoStartExpired) {
          setTimerActive(false);
          setPhaseDone(true);
        } else {
          setPhase(1);
          setTimerActive(false);
          setPhaseDone(
            mapped.mode === "single" && mapped.step1.duration_sec === 0
          );
        }

        setStepData(mapped);
      } catch (e) {
        console.error("loadStep error", e);
        setStepData(null);
      }
      setLoading(false);
    },
    [brewId]
  );

  useFocusEffect(
    useCallback(() => {
      setIsHistoricalStep(false);
      setIsForwardStep(false);
      loadStep();
    }, [loadStep])
  );

  useEffect(() => {
    if (!stepData) return;

    if (stepData.mode === "two" && phase === 2) {
      setHasPreviousStep(true);
    } else {
      const currentIndex = allSteps.findIndex(
        (s) => s.step_id === currentStep.current?.step_id
      );
      setHasPreviousStep(currentIndex > 0);
    }
  }, [stepData, phase, allSteps]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const getActiveStepId = useCallback(() => {
    if (stepData?.mode === "two" && phase === 2) {
      return stepData.next_step_id;
    }
    return stepData?.current_step_id ?? currentStep.current?.step_id;
  }, [stepData, phase]);

  const handlePlay = useCallback(
    async (remainingSecs: number) => {
      const activeStepId = getActiveStepId();
      if (!brewId || !activeStepId) {
        console.error("Missing brewId or active step when starting timer", {
          brewId,
          activeStepId,
        });
        return;
      }

      try {
        const { data: upData, error: upErr } = await supabase
          .from("brew_steps")
          .update({
            completed_at: new Date().toISOString(),
            time_left: remainingSecs,
            status: "in_progress",
          })
          .eq("id_brew", brewId)
          .eq("step_id", activeStepId)
          .select();

        if (upErr) {
          console.error("Supabase update error (start)", upErr);
        } else {
          console.debug("Supabase update success (start)", upData);
          setCompletedAt(
            new Date(upData?.[0]?.completed_at ?? new Date().toISOString())
          );
        }
      } catch (e) {
        console.error("Failed to persist timer start state", e);
      }

      setTimerActive(true);
    },
    [brewId, getActiveStepId]
  );

  const handlePause = useCallback(
    async (remainingSecs: number) => {
      const activeStepId = getActiveStepId();
      if (!brewId || !activeStepId) {
        console.error("Missing brewId or active step when pausing timer", {
          brewId,
          activeStepId,
        });
        return;
      }

      try {
        const { data: upData, error: upErr } = await supabase
          .from("brew_steps")
          .update({
            completed_at: null,
            time_left: remainingSecs,
            status: "in_progress",
          })
          .eq("id_brew", brewId)
          .eq("step_id", activeStepId)
          .select();

        if (upErr) {
          console.error("Supabase update error (pause)", upErr);
        } else {
          console.debug("Supabase update success (pause)", upData);
          setCompletedAt(null);
        }
      } catch (e) {
        console.error("Failed to persist timer pause state", e);
      }

      setTimerActive(false);
    },
    [brewId, getActiveStepId]
  );

  const durationSec = stepData?.step1?.duration_sec ?? 0;

  const handleComplete = useCallback(
    (totalElapsedTime: number) => {
      setPhaseDone(true);
      setTimerActive(false);
      return { shouldRepeat: false };
    },
    []
  );

  const hasTimer = durationSec > 0;
  const hasTemp = stepData?.temp != null;

  const goToNextStepComplete = useCallback(async () => {
    if (!brewId || !stepData?.current_step_id) {
      console.log("Aborted goToNextStep: missing brewId or current_step_id", {
        brewId,
        stepData,
      });
      return;
    }

    try {
      const currentIndex = allSteps.findIndex(
        (s) => s.step_id === currentStep.current?.step_id
      );
      const nextStep = allSteps[currentIndex + 1];

      const updates: { step_id: string }[] = [];

      const { data: brewStatus } = await supabase
        .from("brews")
        .select("status_id")
        .eq("id_brew", brewId)
        .single();

      if (brewStatus?.status_id === 1) {
        await supabase
          .from("brews")
          .update({
            status_id: 2,
            start_date: new Date().toISOString(),
          })
          .eq("id_brew", brewId)
          .select();
      }

      updates.push({
        step_id: stepData.current_step_id,
      });
      
      for (const u of updates) {
        await supabase
          .from("brew_steps")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            time_left: null,
          })
          .eq("id_brew", brewId)
          .eq("step_id", u.step_id)
          .select();
      }

      let newLastStepId;

      if (stepData.mode === "two") {
        newLastStepId = stepData.next_step_id;
      } else {
        newLastStepId = stepData.next_step_id;
      }

      const isLastStep = !newLastStepId;

      await supabase
        .from("brews")
        .update({
          last_step_id: newLastStepId,
          ...(isLastStep ? { status_id: 3 } : {}),
        })
        .eq("id_brew", brewId)
        .select();

      if (isLastStep) {
        const hasNewBadge = await checkForNewBadge(currentUserId ?? "");

        if (hasNewBadge) {
          // Na sluiten van de badge-modal naar Home navigeren
          setNavigateAfterBadge("/HomePage");
        } else {
          // Geen nieuwe badge: gewoon progress refreshen en review-modal tonen
          await refreshProgress();
          setReviewModalVisible(true);
        }
      return;
    }


      if (!nextStep) {
        await refreshProgress();
        router.push("/HomePage");
        return;
      }

      await loadStep();
    } catch (error) {
      console.error("goToNextStep error:", error);
    }
  }, [brewId, stepData, loadStep, router, allSteps, refreshProgress]);

  const goToPreviousStep = useCallback(() => {
    if (!stepData || allSteps.length === 0) return;

    const currentIndex = allSteps.findIndex(
      (s) => s.step_id === currentStep.current?.step_id
    );

    if (currentIndex <= 0) {
      console.log("No previous step available.");
      return;
    }

    const prevStep = allSteps[currentIndex - 1];

    setIsHistoricalStep(true);
    setIsForwardStep(false);
    loadStep(prevStep.step_id);
  }, [stepData, allSteps, loadStep]);

  const goToNextStep = useCallback(() => {
    if (!stepData || allSteps.length === 0) return;

    const currentIndex = allSteps.findIndex(
      (s) => s.step_id === currentStep.current?.step_id
    );

    if (currentIndex === -1 || currentIndex >= allSteps.length - 1) {
      console.log("No next step available.");
      return;
    }

    const nextStep = allSteps[currentIndex + 1];

    // forward navigation is geen historische stap
    setIsHistoricalStep(false);
    setIsForwardStep(true);
    loadStep(nextStep.step_id);
  }, [stepData, allSteps, loadStep]);

  if (loading) {
    return <Spinner title="Loading progress..." />;
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

  const title = stepData.step1.title;
  const desc = stepData.step1.desc;
  const tips = stepData.step1.tips;
  const ingredients: {
    name: string;
    kind: string;
    amount: number | null;
    unit: string | null;
  }[] = (() => {
    if (!stepData) return [];
    if (stepData.mode === "two" && stepData.step2) {
      return [...(stepData.step1?.ingredients ?? []), ...(stepData.step2?.ingredients ?? [])];
    } else {
      return stepData.step1?.ingredients ?? [];
    }
  })();
  const formatAmount = (amount: number | null, unit: string | null) => {
    if (amount == null) return null;
    const effectiveUnit = unit ?? "g";
    if (effectiveUnit === "L") {
      const rounded = Math.round(amount * 10) / 10;
      return `${rounded} ${effectiveUnit}`;
    }
    const rounded = Math.round(amount);
    return `${rounded} ${effectiveUnit}`;
  };

  //const isCompleted = isHistoricalStep || phaseDone;
  const isButtonDisabled = !phaseDone || isHistoricalStep || isForwardStep;
  const isActiveStep = !isHistoricalStep && !isForwardStep;

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
    >
      <Header
        title={stepData.beer}
        actionTestIDLeft="back-header"
        iconNameLeft="ArrowLeft"
        onIconPressLeft={() =>
          router.push(from === "agenda" ? "/Agenda" : "/HomePage")
        }
      />
      <Stepper
        step={
          allSteps.findIndex(
            (s) => s.step_id === currentStep.current?.step_id
          ) + 1
        }
        total={allSteps.length}
        isCompleted={!isActiveStep}
        onNext={goToNextStep}
        onPrev={goToPreviousStep}
      />
      {isHistoricalStep && completedAt && (
        <ThemedText type="subTitle" className="ml-3 mb-2">
          Completed on: {completedAt.toLocaleDateString()} at{" "}
          {completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>
      )}
      <ScrollView
        className="px-3"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 95 }}
      >
        <View className="flex-row justify-between items-start">
          <ThemedText type="title">{title}</ThemedText>
          {!isHistoricalStep && (
            <View className="mb-2">
              <PrimaryButton
                title="Step completed"
                testID="completed-button"
                onPress={() => {
                  if (!phaseDone && isHistoricalStep && isForwardStep) return;
                  goToNextStepComplete();
                }}
                disabled={isButtonDisabled}
                size={14}
                height={34}
              />
            </View>
          )}
        </View>
        {stepData.mode === "two" && stepData.step2 && (
          <Text
            style={{
              fontSize: Math.min(15 * scale, 22),
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.STONE600,
              marginTop: -12,
            }}
          >
            (+ {stepData.step2.title})
          </Text>
        )}

        {(hasTemp || hasTimer) && (
          <Card
            style={{
              marginBottom: 18,
              padding: hasTimer ? 16 : 8,
              borderRadius: 8,
              backgroundColor: BASE_COLORS.WHITE,
              shadowColor: BASE_COLORS.STONE700,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              alignItems: "center",
            }}
          >
            {hasTemp && (
              <View className="flex-row items-center justify-center">
                <Thermometer
                  size={28}
                  color={BASE_COLORS.STONE500}
                  strokeWidth={0.5}
                  fill={BASE_COLORS.AMBER600}
                />
                <Text
                  style={{
                    fontSize: Math.min(22 * scale, 32),
                    color: BASE_COLORS.STONE500,
                    fontFamily: FontFamilies.BODY,
                  }}
                >{`${stepData.temp}°C`}</Text>
              </View>
            )}
            {hasTimer && !CompletedStep.current && (
              <View className="mt-4">
                <CountdownCircleTimer
                  key={stepData.current_step_id}
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
                  onComplete={handleComplete}
                >
                  {({ remainingTime }) => {
                    const btnDisabled = phaseDone || isHistoricalStep || isForwardStep;
                    return (
                      <View className="items-center">
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
                          disabled={btnDisabled}
                          onPress={async () => {
                            if (isHistoricalStep) {
                              console.debug(
                                "Historical step - timer controls disabled"
                              );
                              return;
                            }
                            if (isForwardStep) {
                              console.debug(
                                "Forward step - timer controls disabled"
                              );
                              return;
                            }

                            const remainingSecs = remainingTime;
                            const newActive = !timerActive;

                            if (newActive) {
                              await handlePlay(remainingSecs);
                            } else {
                              await handlePause(remainingSecs);
                            }
                          }}
                          style={{
                            borderRadius: 30,
                            backgroundColor: btnDisabled
                              ? BASE_COLORS.STONE200
                              : BASE_COLORS.TEXT_DARK,
                            paddingInline: 8,
                          }}
                        >
                          {timerActive ? (
                            <Pause
                              size={Math.min(18 * scale, 26)}
                              color={
                                btnDisabled
                                  ? BASE_COLORS.STONE400
                                  : BASE_COLORS.WHITE
                              }
                              fill={
                                btnDisabled
                                  ? BASE_COLORS.STONE400
                                  : BASE_COLORS.WHITE
                              }
                              strokeWidth={0.5}
                            />
                          ) : (
                            <Play
                              size={Math.min(18 * scale, 26)}
                              color={
                                btnDisabled
                                  ? BASE_COLORS.STONE400
                                  : BASE_COLORS.WHITE
                              }
                              fill={
                                btnDisabled
                                  ? BASE_COLORS.STONE400
                                  : BASE_COLORS.WHITE
                              }
                              strokeWidth={1}
                            />
                          )}
                        </Button>
                      </View>
                    );
                  }}
                </CountdownCircleTimer>
              </View>
            )}
          </Card>
        )}

        {ingredients.length > 0 && (
          <View className="mb-4">
            <ThemedText type="subTitle">Ingredients:</ThemedText>
            {ingredients.map((ing, idx) => {
              const amountLabel = formatAmount(ing.amount, ing.unit);
              return (
                <View key={idx} className="flex-row items-center">
                  <ThemedText type="defaultText">
                    • {ing.name} ({ing.kind})
                    {amountLabel ? `: ${amountLabel}` : ""}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        )}

        <View>
          <ThemedText type="subTitle">Description:</ThemedText>
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
          <View className="mt-2 flex-row items-start gap-4">
            <View>
              <Lightbulb size={30} color={BASE_COLORS.ACCENT_LIGHT} />
            </View>
            <ThemedText type="tips" style={{ marginTop: -34 }}>
              {tips ?? "No tips available."}
            </ThemedText>
          </View>
        )}
      </ScrollView>
      <BadgeEarnedModal
        visible={badgeModalVisible}
        badgeName={badgeForModal?.name ?? null}
        iconUrl={badgeForModal?.iconUrl ?? null}
        onClose={async () => {
          setBadgeModalVisible(false);
          if (navigateAfterBadge) {
            await refreshProgress();
            router.push(navigateAfterBadge);
            setNavigateAfterBadge(null);
          }
        }}
      />
      <FAB
        testID="chat-button"
        mode="flat"
        icon={(props) => (
          <BotMessageSquare size={props.size} color={BASE_COLORS.WHITE} />
        )}
        onPress={() => {
          router.push({
            pathname: `/ChatBot`,
            params: {
              recipe_slug: brew.recipe_slug,
              last_step_id: brew.last_step_id,
              from: "progress",
            },
          })
        }}
        color={BASE_COLORS.WHITE}
        style={{
          position: "absolute",
          right: 10,
          bottom: 25,
          backgroundColor: BASE_COLORS.TEXT_DARK,
          borderRadius: 45,
        }}
        theme={{
          colors: {
            onSurfaceDisabled: BASE_COLORS.STONE400,
          },
        }}
      />
      <ReviewModal
        visible={reviewModalVisible}
        onDismiss={() => {
          setReviewModalVisible(false);
          router.push("/HomePage");
        }}
        recipe_slug={brew?.recipe_slug ?? ""}
        onSuccess={() => {
          setReviewModalVisible(false);
          router.push("/HomePage");
        }}
      />
    </SafeAreaView>
  );
}
