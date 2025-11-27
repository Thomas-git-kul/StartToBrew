import { useState, useEffect, useCallback, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, ScrollView, Dimensions, ActivityIndicator, Text } from "react-native";
import { Card, FAB, Chip, Button } from "react-native-paper";
import { Pause, Thermometer, Play, CheckCheck, Lightbulb } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Header from '@/components/header';
import { BASE_COLORS } from '@/constants/Colors';
import { ThemedText } from '@/components/themed-text';
import { useFonts } from "@/hooks/use-fonts";
import { FontFamilies } from "@/constants/Fonts";
import { supabase } from "@/supabase";
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
  const [timerActive, setTimerActive] = useState(false);
  const [phaseDone, setPhaseDone] = useState(false);

  const loadStep = useCallback(async () => {
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
      // console.log('brew:',brew);

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
      // console.log('phases:',phases);

      let allSteps: any[] = [];
      for (const phase of phases) {
        const { data: steps } = await supabase
          .from("steps")
          .select("*")
          .eq("phase_id", phase.phase_id)
          .order("step_id", { ascending: true });
        allSteps = [...allSteps, ...steps];
      }
      //console.log('steps:', allSteps);

      const currentIndex = allSteps.findIndex(s => s.step_id === brew.last_step_id);
      const currentStep = allSteps[currentIndex];
      // const previousStep = allSteps[currentIndex - 1] ?? null;
      const nextStep = allSteps[currentIndex + 1];

      const {data: tips} = await supabase
        .from("step_tips")
        .select("step_id, tip_md")
        .eq("step_id", brew.last_step_id)
        .single();
      // console.log('tips:',tips);
      
      // Determine if there is multiple steps
      const nextHasOffset =
        nextStep &&
        nextStep.start_offset_min &&
        nextStep.start_offset_min > 0;
      let mapped;
      if (nextHasOffset) {
      const afterNextStep = allSteps[currentIndex + 2] ?? null;

      mapped = {
        mode: "two",
        beer: brew.name,
        temp: nextStep.temp_c_target ?? null,
        current_step_id: currentStep.step_id,
        next_step_id: nextStep.step_id,
        after_next_step_id: afterNextStep?.step_id ?? null,
        step1: {
          title: currentStep.title,
          desc: currentStep.description_md,
          tips: tips?.tip_md ?? null,
          duration_sec: nextStep.start_offset_min ?? 0,
        },
        step2: {
          title: nextStep.title,
          desc: nextStep.description_md,
          tips: tips?.tip_md ?? null,
          duration_sec: nextStep.duration_min ?? 0,
        },
      };
    } else {
        mapped = {
          mode: "single",
          beer: brew.name,
          temp: currentStep.temp_c_target ?? null,
          current_step_id: currentStep.step_id,
          next_step_id: nextStep?.step_id ?? null,
          step1: {
            title: currentStep.title,
            desc: currentStep.description_md,
            tips: tips?.tip_md ?? null,
            duration_sec: (currentStep.duration_min ?? 0) /* * 60*/,
          },
          step2: null,
        };
      }

      setStepData(mapped);

      console.log("stepData: ", mapped);

      // reset timer state after reload
      setPhase(1);
      setTimerActive(false);
      setPhaseDone(mapped.mode === "single" && mapped.step1.duration_sec === 0);


    } catch (e) {
      console.error('loadStep error', e);
      setStepData(null);
    }
    setLoading(false);
  }, [brewId]);

  useEffect(() => {
    loadStep();
  }, [loadStep]);
  
  const durationSec = phase === 1
    ? stepData?.step1?.duration_sec ?? 0
    : stepData?.step2?.duration_sec ?? 0;

  const hasTimer = durationSec > 0;
  const hasTemp = stepData?.temp != null;

  const goToNextStep = useCallback(async () => {
    if (!brewId || !stepData?.current_step_id) {
      console.log("Aborted goToNextStep: missing brewId or current_step_id", { brewId, stepData });
      return;
    }

    try {
      const updates = [];

      // Always complete the current step
      updates.push({
        step_id: stepData.current_step_id
      });

      // If two steps form one → also complete step2
      if (stepData.mode === "two" && stepData.next_step_id) {
        updates.push({
          step_id: stepData.next_step_id
        });
      }

      for (const u of updates) {
        await supabase
          .from("brew_steps")
          .update({
            status: "completed",
            completed_at: new Date().toISOString()
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
          ...(isLastStep ? { status_id: 3 } : {})
        })
        .eq("id_brew", brewId);


      if (isLastStep) {
        router.push("/HomePage");
        return;
      }

      await loadStep();
    } catch (error) {
      console.error("goToNextStep error:", error);
    }
  }, [brewId, stepData, loadStep, router]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
        <ActivityIndicator 
          animating size="large"
          color={BASE_COLORS.ACCENT_PRIMARY} 
        />
        <ThemedText type="defaultText" className="mt-3">
          Loading progress...
        </ThemedText>
      </SafeAreaView>
    );
  } if (!stepData) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
        <ThemedText type="defaultText" className="mt-3">
          Failed to load progress...
        </ThemedText>
      </SafeAreaView>
    );
  }

  const title = phase === 1 ? stepData.step1.title : stepData.step2?.title ?? stepData.step1.title;
  const desc = phase === 1 ? stepData.step1.desc : stepData.step2?.desc ?? stepData.step1.desc;
  const tips = phase === 1 ? stepData.step1.tips : stepData.step2?.tips;

  /*
  const phase1Duration = stepData.duration_total - stepData.duration_offset;
  const phase2Duration = (stepData.duration_total ?? 0) - phase1Duration;
  const hasPhase2 = Boolean(stepData.title2 && stepData.description2 && phase2Duration > 0);

  const currentStep = stepData;
  // const hasTimer = currentStep.duration_total && currentStep.duration_total > 0;
  // const hasTemp = currentStep.temp !== null;

  // Timer color gradient
  const duration = phase === 1 ? phase1Duration : phase2Duration;
  const step = duration / 9;
  */

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
      <Header
        title={"Progress"}
        iconName="ArrowRight"
        onIconPress={() => router.push("/HomePage" as any)}
      />
      <ScrollView 
        className="px-5" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 85 }}
      >
        <ThemedText type="title" className="mb-2">{stepData.beer}</ThemedText>
        <View className="flex-row justify-between items-center">
          <Text
            style={{
              fontSize: Math.min(18 * scale, 26),
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.STONE700
            }}
          >
            {title}
          </Text>
          { hasTemp && (
            <Chip
              style={{
                alignItems: "center",
                backgroundColor: BASE_COLORS.WHITE,
                shadowColor: BASE_COLORS.STONE700,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.07,
              }}
              textStyle={{
                fontSize: Math.min( 17 * scale, 26),
                color: BASE_COLORS.STONE500,
                fontFamily: FontFamilies.BODY,
              }}
              icon={(props) => <Thermometer size={props.size} color={BASE_COLORS.STONE500} strokeWidth={0.5} fill={BASE_COLORS.AMBER600} />}
            >{`${stepData.temp}°C`}</Chip>
          )}
        </View>
        {stepData.mode === "two" && phase === 1 && (
          <Text
            style={{
              fontSize: Math.min(15 * scale, 22),
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.STONE600,
              marginTop: -4
            }}
          >
            (+ {stepData.step2.title})
          </Text>
        )}
        
        { hasTimer && (
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
            colors={[
              BASE_COLORS.STONE300,
              BASE_COLORS.STONE200,
            ]}
            colorsTime={[
              0,
              Math.max(1, durationSec),
            ]}
            trailColor={!phaseDone ? BASE_COLORS.TEXT_DARK : BASE_COLORS.STONE200}
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
                  style={{ borderRadius: 30, backgroundColor: !phaseDone ? BASE_COLORS.TEXT_DARK : BASE_COLORS.STONE200, paddingInline: 8 }}
                >
                  {timerActive ? (
                    <Pause size={Math.min(18 * scale, 26)} color={BASE_COLORS.WHITE} fill={BASE_COLORS.WHITE}  strokeWidth={0.5}/>
                  ) : (
                    <Play size={Math.min(18 * scale, 26)} color={BASE_COLORS.WHITE} fill={BASE_COLORS.WHITE} strokeWidth={1}/>
                  )}
                </Button>
              </View>
            )}
          </CountdownCircleTimer>
        </Card>
        )}

        <View className="mt-2">
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

        {tips && (
          <View className="mt-2 flex-row items-start">
            <Lightbulb size={ Math.min(30 * scale, 50) } color={BASE_COLORS.ACCENT_LIGHT} className="mr-2"/>
            <ThemedText type="tips">{tips}</ThemedText>
          </View>
        )}
      </ScrollView>
      <FAB
        testID="fab-button"
        mode="flat"
        label="Next Step"
        icon={(props) => {
          return <CheckCheck {...props} size={Math.min(24 * scale, 34)} />;
        }}
        onPress={() => {
          if (!phaseDone) return;
          goToNextStep();
        }}
        disabled={!phaseDone}
        color={BASE_COLORS.WHITE}
        style={{ 
          borderRadius: 30,
          backgroundColor: !phaseDone ? 
            BASE_COLORS.STONE200 :
            BASE_COLORS.TEXT_DARK,
          position: 'absolute',
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
    </SafeAreaView>
  );
}