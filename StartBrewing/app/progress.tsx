import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, ScrollView, Modal, Pressable } from "react-native";
import { Text, Button, Card, FAB, Dialog } from "react-native-paper";
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
  duration_offset: 10, // seconds
  duration_total: 20, // seconds
  temp: 100,
  tips1: "Lower the heat briefly before adding hops to prevent sudden foaming.",
  tips2: "Lower the heat briefly before adding hops to prevent sudden foaming.",
};

export default function Progress({ step = testStep }: { step?: any }) {
  useFonts();
  const router = useRouter();

  const [phase, setPhase] = useState(1);
  const [remainingTime, setRemainingTime] = useState(step.duration_offset);
  const [timerActive, setTimerActive] = useState(false);
  const [tipsVisible, setTipsVisible] = useState(false);
  const [phase2Done, setPhase2Done] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (timerActive && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev: number) => prev - 1);
      }, 1000);
    } else if (timerActive && remainingTime === 0) {
      if (phase === 1) {
        // Phase 1 finished
        setTimerActive(false);
        setPhase(2);
        setRemainingTime(step.duration_total - step.duration_offset);
      } else if (phase === 2) {
        // Phase 2 finished
        setTimerActive(false);
        setPhase2Done(true); // Unlock Next Step FAB
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, remainingTime, phase]);

  const goToNextStep = () => {
    router.push('/progress?step=nextStep');
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
    >
      <Header
        title={`${step.beer} Progress`}
        iconName="ArrowRight"
        onIconPress={() => router.back()}
      />

      <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
        <ThemedText type="titleBlack">{phase === 1 ? step.title1 : step.title2}</ThemedText>

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
              {step.temp}°C
            </ThemedText>
          </View>

          {/* Timer + Start Button */}
          <View className="flex-row items-center justify-center">
            <Timer size={24} color={BASE_COLORS.ACCENT_PRIMARY} />
            <ThemedText type="title" className="ml-2 mr-4">
              {Math.floor(remainingTime / 60)}m {remainingTime % 60}s
            </ThemedText>
          </View>
        </Card>

        <View className="mt-4">
          {(phase === 1 ? step.description1 : step.description2)
            .split(".")
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

        <Button mode="outlined" onPress={() => setTipsVisible(true)}>
          Show Tips
        </Button>
      </ScrollView>

      <Modal visible={tipsVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-center items-center p-6">
          <Card className="p-6 w-full rounded-2xl">
            <Text className="text-lg mb-3">Tips</Text>
            <Text>{phase === 1 ? step.tips1 : step.tips2 || 'No tips available for this step.'}</Text>
            <Pressable onPress={() => setTipsVisible(false)} className="mt-4">
              <Button mode="contained">Close</Button>
            </Pressable>
          </Card>
        </View>
      </Modal>

      <FAB
        icon={phase2Done ? "arrow-right" : "timer"} // show arrow after phase 2 done, timer otherwise
        label={phase2Done ? "Next Step" : "Start Timer"}
        onPress={() => {
          if (!phase2Done) {
            // Start timer for current phase
            if (!timerActive) setTimerActive(true);
          } else {
            // Navigate to next step
            goToNextStep();
          }
        }}
        disabled={phase2Done ? false : timerActive} // disable FAB when timer is running
        style={{ position: 'absolute', bottom: 30, right: 20 }}
      />
    </SafeAreaView>
  );
}
