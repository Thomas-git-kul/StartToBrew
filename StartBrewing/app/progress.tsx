import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, ScrollView, Modal, Pressable } from "react-native";
import { Text, Button, Card, FAB } from "react-native-paper";
import { Timer, Thermometer } from "lucide-react-native";
import { useRouter } from "expo-router";
import Header from '@/components/header';
import { BASE_COLORS } from '@/constants/Colors';
import { ThemedText } from '@/components/themed-text';
import { useFonts } from "@/hooks/use-fonts";
import { FontFamilies } from "@/constants/Fonts";

const testStep = {
  beer: "black IPA",
  title1: "60-min Citra",
  title2: "15-min Mosaic",
  description1: "At T-60: briefly kill the flame to prevent foam, add hops, then resume boil. Stir to break up the hop cone; keep a steady (not violent) boil. Lid off during the boil to drive off DMS. Resume countdown for next addition.",
  description2: "At T-15: briefly kill the flame to prevent foam, add hops, then resume boil. Stir to break up the hop cone; keep a steady (not violent) boil. Lid off during the boil to drive off DMS. Resume countdown for next addition.",
  duration_offset: 10,
  duration_total: 20,
  temp: 100,
  tips1: "Lower the heat briefly before adding hops to prevent sudden foaming.",
  tips2: "Lower the heat briefly before adding hops to prevent sudden foaming.",
};

export default function Progress({ step = testStep }: { step?: any }) {
  useFonts();
  const router = useRouter();

  const hasTimer = step?.duration_total && step.duration_total > 0;
  const hasPhase2 = step?.title2 && step?.description2; // second phase exists
  const hasTemp = step?.temp !== undefined;

  const [phase, setPhase] = useState(1);
  const [remainingTime, setRemainingTime] = useState(
    step?.duration_offset ?? step?.duration_total ?? 0
  );
  const [timerActive, setTimerActive] = useState(false);
  const [tipsVisible, setTipsVisible] = useState(false);
  const [phaseDone, setPhaseDone] = useState(!hasTimer); // If no timer, consider done

  // Timer logic
  useEffect(() => {
    if (!hasTimer) return;

    let interval: ReturnType<typeof setInterval> | null = null;

    if (timerActive && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev: number) => prev - 1);
      }, 1000);
    } else if (timerActive && remainingTime === 0) {
      if (phase === 1 && hasPhase2 && step.duration_offset) {
        // Phase 1 finished: setup phase 2
        setTimerActive(false);
        setPhase(2);
        setRemainingTime(step.duration_total - step.duration_offset);
      } else {
        // Phase 2 finished OR single-phase step
        setTimerActive(false);
        setPhaseDone(true);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, remainingTime, phase, hasPhase2, step.duration_offset, step.duration_total, hasTimer]);

  const goToNextStep = () => router.push('/progress?step=nextStep');

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
      <Header
        title={`${step.beer} Progress`}
        iconName="ArrowRight"
        onIconPress={() => router.back()}
      />

      <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
        <ThemedText type="titleBlack">{phase === 1 ? step.title1 : step.title2 ?? step.title1}</ThemedText>

        {/* Timer & Temperature card */}
        <Card
          style={{
            marginHorizontal: 10,
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
          {/* Temperature */}
          <View className="flex-row items-center mb-4">
            <Thermometer size={24} color={BASE_COLORS.ACCENT_PRIMARY} />
            <ThemedText type="title" className="ml-2">
              {hasTemp ? `${step.temp}°C` : "No specific temperature"}
            </ThemedText>
          </View>

          {/* Timer */}
          <View className="flex-row items-center justify-center">
            <Timer size={24} color={BASE_COLORS.ACCENT_PRIMARY} />
            <ThemedText type="title" className="ml-2 mr-4">
              {hasTimer ? `${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s` : "No timer"}
            </ThemedText>
          </View>
        </Card>

        {/* Step descriptions */}
        <View className="mt-4">
          {(phase === 1 ? step.description1 : step.description2 ?? step.description1)
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

        {/* Tips */}
        {((phase === 1 && step.tips1) || (phase === 2 && step.tips2)) && (
          <Button mode="outlined" onPress={() => setTipsVisible(true)}>
            Show Tips
          </Button>
        )}
      </ScrollView>

      {/* Tips Modal */}
      <Modal visible={tipsVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-center items-center p-6">
          <Card className="p-6 w-full rounded-2xl">
            <Text className="text-lg mb-3">Tips</Text>
            <Text>{phase === 1 ? step.tips1 : step.tips2 ?? "No tips available for this step."}</Text>
            <Pressable onPress={() => setTipsVisible(false)} className="mt-4">
              <Button mode="contained">Close</Button>
            </Pressable>
          </Card>
        </View>
      </Modal>

      {/* FAB */}
      <FAB
        icon={phaseDone ? "arrow-right" : hasTimer ? "timer" : "arrow-right"}
        label={phaseDone ? "Next Step" : hasTimer ? "Start Timer" : "Next Step"}
        onPress={() => {
          if (!phaseDone && hasTimer) {
            if (!timerActive) setTimerActive(true);
          } else {
            goToNextStep();
          }
        }}
        disabled={(!phaseDone && hasTimer && timerActive) || false}
        style={{ position: 'absolute', bottom: 30, right: 20 }}
      />
    </SafeAreaView>
  );
}
