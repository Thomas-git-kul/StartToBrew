import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Card, FAB } from "react-native-paper";
import { Timer, Thermometer, Play, CheckCheck, Lightbulb } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Header from '@/components/header';
import { BASE_COLORS } from '@/constants/Colors';
import { ThemedText } from '@/components/themed-text';
import { useFonts } from "@/hooks/use-fonts";
import { FontFamilies } from "@/constants/Fonts";
import ConfettiCannon from 'react-native-confetti-cannon';
import { supabase } from "@/supabase";

const testStep = {
  beer: "black IPA",
  title1: "60-min Citra",
  title2: "15-min Mosaic",
  description1: "At T-60: briefly kill the flame to prevent foam, add hops, then resume boil. Stir to break up the hop cone; keep a steady (not violent) boil. Lid off during the boil to drive off DMS. Resume countdown for next addition.",
  description2: "At T-15: briefly kill the flame to prevent foam, add hops, then resume boil. Stir to break up the hop cone; keep a steady (not violent) boil. Lid off during the boil to drive off DMS. Resume countdown for next addition.",
  duration_offset: 6,
  duration_total: 10,
  temp: 100,
  tips1: "Lower the heat briefly before adding hops to prevent sudden foaming.",
  tips2: "Lower the heat briefly before adding hops to prevent sudden foaming.",
};

function Progress() {
  useFonts();
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id?: string };
  const brewId = id ? Number(id) : undefined;

  const [stepData, setStepData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState(1);
  const [remainingTime, setRemainingTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [tipsVisible, setTipsVisible] = useState(false);
  const [phaseDone, setPhaseDone] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const loadStep = async () => {
    setLoading(true);
    try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) {
          setStepData(testStep);
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
          setStepData(testStep);
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
        setStepData(testStep);
        setRemainingTime(testStep.duration_offset ?? testStep.duration_total ?? 0);
        setPhaseDone(!(testStep.duration_total > 0));
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
  const hasPhase2 = stepData.title2 && stepData.description2;

  if (!hasTimer) return;

  const interval = setInterval(() => {
    if (timerActive && remainingTime > 0) {
      setRemainingTime(prev => prev - 1);
    } else if (timerActive && remainingTime === 0) {
      if (phase === 1 && hasPhase2 && stepData.duration_offset) {
        setTimerActive(false);
        setPhase(2);
        setRemainingTime(stepData.duration_total - stepData.duration_offset);
      } else {
        setTimerActive(false);
        setPhaseDone(true);
        setShowConfetti(true);
      }
    }
  }, 1000);

  // Correct cleanup
  return () => {
    clearInterval(interval);
  };
}, [timerActive, remainingTime, phase, stepData]);


  //const goToNextStep = () => router.push('/progress?step=nextStep');
  const goToNextStep = async () => {
    if (!brewId || !stepData?.step_id) return;
    console.log('Marking step as completed:', brewId, stepData.step_id);

    try {
      await supabase
        .from("brew_steps")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id_brew", brewId)
        .eq("step_id", stepData.step_id);

      await supabase
        .from("brews")
        .update({ last_step_id: stepData.next_step_id })
        .eq("id_brew", brewId);

      await loadStep(); // ✅ gewoon de loadStep opnieuw aanroepen
    } catch (error) {
      console.error(error);
    }
  };


  if (loading || !stepData) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" testID="loading-indicator"/>
      </SafeAreaView>
    );
  }

  const currentStep = stepData;
  const hasTimer = currentStep.duration_total && currentStep.duration_total > 0;
  const hasPhase2 = currentStep.title2 && currentStep.description2;
  const hasTemp = currentStep.temp !== undefined;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
      <Header
        title={`${currentStep.beer} Progress`}
        iconName="House"
        onIconPress={() => router.push("/HomePage" as any)}
      />

      <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
        <ThemedText type="titleBlack">{phase === 1 ? currentStep.title1 : currentStep.title2 ?? currentStep.title1}</ThemedText>

        <Card
          style={{
            marginHorizontal: 40,
            padding: 20,
            borderRadius: 16,
            backgroundColor: BASE_COLORS.WHITE,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
            alignItems: "center",
          }}
        >
          <View className="flex-row items-center mb-4">
            <Thermometer size={24} color={BASE_COLORS.ACCENT_PRIMARY} />
            <ThemedText type="title" className="ml-2">
              {hasTemp ? `${currentStep.temp}°C` : "No specific temperature"}
            </ThemedText>
          </View>

          <View className="flex-row items-center">
            <Timer size={24} color={BASE_COLORS.ACCENT_PRIMARY} />
            <ThemedText type="title" className="ml-2 mr-4">
              {hasTimer ? `${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s` : "No timer"}
            </ThemedText>
          </View>
        </Card>

        <View className="mt-4">
          {(phase === 1 ? currentStep.description1 : currentStep.description2 ?? currentStep.description1)
            ?.split(".")
            .map((sentence: string, index: number) => {
              const clean = sentence.trim();
              if (!clean) return null;
              return (
                <ThemedText key={index} type="defaultText" className="mb-2">
                  {clean}.
                </ThemedText>
              );
            })}
        </View>

        {((phase === 1 && currentStep.tips1) || (phase === 2 && currentStep.tips2)) && (
          <View className="mt-2 flex-row items-start">
            <Pressable testID="lightbulb-button" onPress={() => setTipsVisible(!tipsVisible)}>
              <Lightbulb size={30} color={BASE_COLORS.ACCENT_LIGHT} />
            </Pressable>
            {tipsVisible && (
              <ThemedText
                type="tips"
                className="ml-2 flex-shrink"
                style={{ flexShrink: 1 }}
              >
                {phase === 1 ? currentStep.tips1 : currentStep.tips2 ?? "No tips available."}
              </ThemedText>
            )}
          </View>
        )}
      </ScrollView>

      {showConfetti && (
        <ConfettiCannon
          testID="confetti-cannon"
          count={200} 
          origin={{ x: -10, y: 0 }}
          fadeOut={true}
          autoStart={true}
        />
      )}

      <FAB
        testID="fab-button"
        mode="elevated"
        icon={(props) => {
          if (phaseDone) return <CheckCheck {...props} />;
          if (hasTimer) return <Play {...props} />;
        }}
        label={phaseDone ? "Next Step" : hasTimer ? "Start Timer" : "Next Step"}
        color={BASE_COLORS.WHITE}
        onPress={() => {
          if (!phaseDone && hasTimer && !timerActive) setTimerActive(true);
          else goToNextStep();
        }}
        disabled={(!phaseDone && hasTimer && timerActive) || false}
        style={{ 
          position: 'absolute',
          bottom: 30, 
          right: 20,
          backgroundColor: timerActive && !phaseDone ? BASE_COLORS.STONE400 : BASE_COLORS.TEXT_DARK,
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
    </SafeAreaView>
  );
}

export default Progress;
