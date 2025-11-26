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

const TIMER_COLORS = [
  BASE_COLORS.AMBER500,
  BASE_COLORS.AMBER600,
  BASE_COLORS.AMBER700,
  BASE_COLORS.AMBER800,
  BASE_COLORS.AMBER900,
];

function computePhases(duration_total: number, duration_offset: number) {
  // only 1 step
  if (
    !duration_offset ||
    duration_offset <= 0 ||
    duration_offset >= duration_total
  ) {
    return {
      mode: "single",
      step1_time: duration_total,
      step2_time: 0,
    };
  }

  // 2 steps
  return {
    mode: "two",
    step1_time: duration_offset,
    step2_time: duration_total - duration_offset,
  };
}


function makeColorStops(durationSeconds: number, count: number) {
  // returns descending remaining-time stops, length === count
  if (count <= 1) return [durationSeconds];
  const step = durationSeconds / count;
  return Array.from({ length: count }, (_, i) => Math.max(0, Math.ceil(durationSeconds - step * i)));
}

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
      const user = userData?.user;
      if (!user) {
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
      const nextStep = allSteps[currentIndex + 1];

      const {data: tips} = await supabase
        .from("step_tips")
        .select("step_id, tip_md")
        .eq("step_id", brew.last_step_id)
        .single();
      // console.log('tips:',tips);

      const mapped = {
        step_id: currentStep.step_id ?? null,
        beer: brew?.name ?? '',
        title1: currentStep?.title ?? '',
        title2: nextStep?.title_2 ?? null,
        description1: currentStep?.description_md ?? '',
        description2: nextStep?.description_md_2 ?? null,
        duration_offset: currentStep?.start_offset_min ?? 0,
        duration_total: currentStep?.duration_min ?? 0,
        temp: currentStep?.temp_c_target ?? null,
        tips1: tips?.tip_md ?? null,
        tips2: tips?.tip_md_2 ?? null,
        next_step_id: nextStep?.step_id?? null,
      };

      setStepData(mapped);

      // reset timer state after reload
      setPhase(1);
      setTimerActive(false);
      setPhaseDone(!(mapped.duration_total > 0));

    } catch (e) {
      console.error('loadStep error', e);
      setStepData(null);
    }
    setLoading(false);
  }, [brewId]);

  useEffect(() => {
    loadStep();
  }, [loadStep]);

  const { mode, step1_time, step2_time } = useMemo(() => {
    if (!stepData) return { mode: 'single' as const, step1_time: 0, step2_time: 0 };
    return computePhases(stepData.duration_total, stepData.duration_offset);
  }, [stepData]);

  const hasTimer = (stepData?.duration_total ?? 0) > 0;
  const hasTemp = stepData?.temp !== null && stepData?.temp !== undefined;

  // durations in seconds for CountdownCircleTimer
  const step1Sec = Math.max(0, Math.round((step1_time ?? 0) /* * 60 */));
  const step2Sec = Math.max(0, Math.round((step2_time ?? 0) /* * 60 */));
  const durationSec = phase === 1 ? step1Sec : step2Sec;

  const colorsTime = useMemo(() => makeColorStops(durationSec || 1, TIMER_COLORS.length), [durationSec]);

  // color stops (must match TIMER_COLORS length)

  /*
  // Timer logic
  useEffect(() => {
    if (!stepData) return;

    const hasTimer = stepData.duration_total && stepData.duration_total > 0;

    if (!hasTimer) return;
  }, [timerActive, remainingTime, phase, stepData]);
  */

  const goToNextStep = useCallback(async () => {
    if (!brewId || !stepData?.step_id) return;
    try {
      await supabase
        .from("brew_steps")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id_brew", brewId)
        .eq("step_id", stepData.step_id);

      const isLastStep = !stepData.next_step_id;

      await supabase
        .from("brews")
        .update({ last_step_id: stepData.next_step_id,
          ...(isLastStep? { status_id: 3 } : {})
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
            {phase === 1 ? stepData.title1 : stepData.title2 ?? stepData.title1}
          </Text>
          { hasTemp && (
            <Chip
              style={{
                marginBottom: 8,
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
            //initialRemainingTime={phase1Duration}
            colors={["#4B5563", "#9CA3AF", "#111827"]}
            colorsTime={[Math.max(1, durationSec) * 60, (Math.max(1, durationSec) * 60) / 2, 0]}
            /*
            colors={[
              BASE_COLORS.AMBER500,
              BASE_COLORS.AMBER600,
              BASE_COLORS.AMBER700,
              BASE_COLORS.AMBER800,
              BASE_COLORS.AMBER900,
            ]}
            colorsTime={[
              duration - step * 1,
              duration - step * 2,
              duration - step * 3,
              duration - step * 4,
              duration - step * 5,
            ]}
            */
            trailColor={BASE_COLORS.STONE300}
            strokeWidth={10}
            onComplete={() => {
              if (mode === 'two' && phase === 1) {
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
              <View style={{ alignItems: 'center' }}>
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
                  onPress={() => {
                    if (!phaseDone && hasTimer) setTimerActive((p) => !p);
                  }}
                  labelStyle={{
                    fontSize: Math.min(16 * scale, 24),
                    color: BASE_COLORS.WHITE,
                    fontFamily: FontFamilies.BODY,
                  }}
                  style={{
                    borderRadius: 30,
                    backgroundColor: BASE_COLORS.TEXT_DARK,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    elevation: 0,
                  }}
                  >
                    {timerActive ? (
                      <Pause size={Math.min(18 * scale, 26)} strokeWidth={1.2} color={BASE_COLORS.WHITE} />
                    ) : (
                      <Play size={Math.min(18 * scale, 26)} strokeWidth={1.2} color={BASE_COLORS.WHITE} />
                    )}
                </Button>
              </View>
            )}
          </CountdownCircleTimer>
        </Card>
        )}

        <View className="mt-2">
          {(phase === 1 ? stepData.description1 : stepData.description2 ?? stepData.description1)
            ?.split(".")
            .map((sentence: string, index: number) => {
              const clean = sentence.trim();
              if (!clean) return null;
              return (
                <ThemedText key={index} type="defaultText" className="mb-2">{clean}.</ThemedText>
              );
            })}
        </View>

        {((phase === 1 && stepData.tips1) || (phase === 2 && stepData.tips2)) && (
          <View className="mt-2 flex-row items-start">
            <Lightbulb size={ Math.min(30 * scale, 50) } color={BASE_COLORS.ACCENT_LIGHT} className="mr-2"/>
            <ThemedText type="tips">{phase === 1 ? stepData.tips1 : stepData.tips2 ?? "No tips available."}</ThemedText>
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
          if (!phaseDone && hasTimer && !timerActive) setTimerActive(true);
          else goToNextStep();
        }}
        disabled={(!phaseDone) || false}
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