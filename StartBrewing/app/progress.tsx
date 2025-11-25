import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, ScrollView, Dimensions, ActivityIndicator, Text } from "react-native";
import { Card, FAB, Chip, Button } from "react-native-paper";
import { Timer, Thermometer, Play, CheckCheck, Lightbulb } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Header from '@/components/header';
import { BASE_COLORS } from '@/constants/Colors';
import { ThemedText } from '@/components/themed-text';
import { useFonts } from "@/hooks/use-fonts";
import { FontFamilies } from "@/constants/Fonts";
import ConfettiCannon from 'react-native-confetti-cannon';
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
  const [remainingTime, setRemainingTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [phaseDone, setPhaseDone] = useState(false);

  const loadStep = async () => {
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
        console.log('brew:',brew);

        if (!brew) {
          setLoading(false);
          return;
        }

        const { data: phases } = await supabase
          .from("phases")
          .select("*")
          .eq("recipe_slug", brew.recipe_slug)
          .order("position", { ascending: true });
        console.log('phases:',phases);

        let allSteps: any[] = [];
        for (const phase of phases) {
          const { data: steps } = await supabase
            .from("steps")
            .select("*")
            .eq("phase_id", phase.phase_id)
            .order("step_id", { ascending: true });
          allSteps = [...allSteps, ...steps];
        }
        console.log('steps:', allSteps);
        const currentIndex = allSteps.findIndex(s => s.step_id === brew.last_step_id);
        const currentStep = allSteps[currentIndex];
        const nextStep = allSteps[currentIndex + 1];

        const {data: tips} = await supabase
          .from("step_tips")
          .select("step_id, tip_md")
          .eq("step_id", brew.last_step_id)
          .single();
        console.log('tips:',tips);

        const mapped = {
          step_id: currentStep.step_id,
          beer: brew.name,
          title1: currentStep.title,
          title2: nextStep?.title_2,
          description1: currentStep.description_md,
          description2: nextStep?.description_md_2,
          duration_offset: currentStep.start_offset_min,
          duration_total: currentStep.duration_min,
          temp: currentStep.temp_c_target,
          tips1: tips.tip_md,
          tips2: tips.tip_md_2,
          next_step_id: nextStep?.step_id?? null,
        };

        setStepData(mapped);
        setRemainingTime(mapped.duration_offset ?? mapped.duration_total ?? 0);
        setPhaseDone(!(mapped.duration_total > 0));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }

  // Fetch step data
  useEffect(() => {
    loadStep();
  }, []);

  // Timer logic
  useEffect(() => {
  if (!stepData) return;

  const hasTimer = stepData.duration_total && stepData.duration_total > 0;

  if (!hasTimer) return;
}, [timerActive, remainingTime, phase, stepData]);

  const goToNextStep = async () => {
    if (!brewId || !stepData?.step_id) {
       console.log("Aborted goToNextStep: missing brewId or stepData.step_id", { brewId, stepData });
    return;
    }

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
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
        <ActivityIndicator 
          animating size="large"
          color={BASE_COLORS.ACCENT_PRIMARY} 
        />
        <ThemedText type="defaultText" className="mt-3">
          Loading recipe...
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

  const phase1Duration = stepData.duration_offset ?? 0;
  const phase2Duration = (stepData.duration_total ?? 0) - phase1Duration;
  const hasPhase2 = Boolean(stepData.title2 && stepData.description2 && phase2Duration > 0);

  const currentStep = stepData;
  const hasTimer = currentStep.duration_total && currentStep.duration_total > 0;
  const hasTemp = currentStep.temp !== null;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
      <Header
        title={"Progress"}
        iconName="ArrowRight"
        onIconPress={() => router.push("/HomePage" as any)}
      />
        <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
          <ThemedText type="title" className="mb-2">{currentStep.beer}</ThemedText>
          <Text 
            className=""
            style={{
              fontSize: Math.min(18 * scale, 26),
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.STONE700
            }}
          >{phase === 1 ? currentStep.title1 : currentStep.title2 ?? currentStep.title1}</Text>

          <Card
            style={{
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
              key={`${phase}`}  // resets when phase changes
              isPlaying={timerActive}
              duration={phase === 1 ? phase1Duration * 60 : phase2Duration * 60}
              colors={["#4B5563", "#9CA3AF", "#111827"]}
              colorsTime={[phase1Duration * 60, (phase1Duration * 60) / 2, 0]}
              strokeWidth={10}
              onComplete={() => {
                if (phase === 1 && hasPhase2) {
                  // Stop, switch to phase 2
                  setTimerActive(false);
                  setPhase(2);
                  return { shouldRepeat: false };
                }

                // Step completely finished
                setPhaseDone(true);
                setTimerActive(false);
                // setShowConfetti(true);

                return { shouldRepeat: false };
              }}
            >
              {({ remainingTime }) => (
                <Text
                  style={{
                    fontSize: Math.min(22 * scale, 28),
                    color: BASE_COLORS.STONE800,
                    fontFamily: FontFamilies.BODY,
                  }}
                >
                  {Math.floor(remainingTime / 60)}m {remainingTime % 60}s
                </Text>
              )}
            </CountdownCircleTimer>
          </Card>

          <View className="flex-row justify-between items-center my-2">
            { hasTemp && (
              <Chip
                style={{
                  height: Math.min(45 * scale, 65),
                  alignItems: "center",
                  backgroundColor: BASE_COLORS.WHITE,
                  shadowColor: BASE_COLORS.STONE700,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.07,
                }}
                textStyle={{
                  fontSize: Math.min( 20 * scale, 40),
                  color: BASE_COLORS.ACCENT_PRIMARY,
                  fontFamily: FontFamilies.BODY,
                }}
                icon={() => <Thermometer size={Math.min( 26 * scale, 50)} color={BASE_COLORS.ACCENT_PRIMARY} strokeWidth={2}/>}
              >{`${currentStep.temp}°C`}</Chip>
            )}
            { hasTimer && (
              <Button 
                mode="contained"
                onPress={() => {
                  if (!phaseDone && hasTimer && !timerActive) setTimerActive(true);
                }}
                labelStyle={{ 
                  fontSize: Math.min(16 * scale, 24),
                  color: BASE_COLORS.WHITE,
                  fontFamily: FontFamilies.BODY,            
                }}
                style={{
                  borderRadius: 20,
                  backgroundColor: BASE_COLORS.TEXT_DARK,
                }}
              >
                <Play/>
              </Button>
            )}
          </View>

          <View className="mt-4">
            {(phase === 1 ? currentStep.description1 : currentStep.description2 ?? currentStep.description1)
              ?.split(".")
              .map((sentence: string, index: number) => {
                const clean = sentence.trim();
                if (!clean) return null;
                return (
                  <ThemedText key={index} type="defaultText" className="mb-2">{clean}.</ThemedText>
                );
              })}
          </View>

          {((phase === 1 && currentStep.tips1) || (phase === 2 && currentStep.tips2)) && (
            <View className="mt-2 flex-row items-start">
              <Lightbulb size={ Math.min(30 * scale, 50) } color={BASE_COLORS.ACCENT_LIGHT} className="mr-2"/>
              <ThemedText type="tips">{phase === 1 ? currentStep.tips1 : currentStep.tips2 ?? "No tips available."}</ThemedText>
            </View>
          )}
        </ScrollView>
      {/*
      {showConfetti && (
        <ConfettiCannon
          testID="confetti-cannon"
          count={200} 
          origin={{ x: -10, y: 0 }}
          fadeOut={true}
          autoStart={true}
        />
      )}
      */}
      <Button
        testID="fab-button"
        mode="contained"
        icon={(props) => {
          return <CheckCheck {...props} size={Math.min(24 * scale, 34)} />;
        }}
        onPress={() => {
          if (!phaseDone && hasTimer && !timerActive) setTimerActive(true);
          else goToNextStep();
        }}
        textColor={BASE_COLORS.WHITE}
        buttonColor={BASE_COLORS.TEXT_DARK}
        disabled={(!phaseDone) || false}
        style={{ 
          position: 'absolute',
          bottom: 20, 
          right: 20,
          borderRadius: 30,
          padding: 6,
        }}
        theme={{
          colors: {
            onSurfaceDisabled: BASE_COLORS.STONE400,
            surfaceDisabled: BASE_COLORS.STONE300,
          },
          fonts: {
            labelLarge: {
              fontSize: Math.min(18 * scale, 26),
              fontFamily: FontFamilies.BODY,
            },
          },
        }}
      >Next Step</Button>
    </SafeAreaView>
  );
}