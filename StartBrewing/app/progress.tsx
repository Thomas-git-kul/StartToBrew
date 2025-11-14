import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { StyleSheet, View } from "react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter } from "expo-router"; 
import { useFonts } from "@/hooks/use-fonts";
import { ProgressBar } from "react-native-paper";
import Checkbox from "expo-checkbox";
import { ScrollView } from "react-native";
import Header from '@/components/header';
import { Button } from "react-native-paper";
import { AlarmClock, AlarmClockCheck } from "lucide-react-native";

type Step = {
    text: string;
    time: number;
    done: boolean;
};

type Phase = {
    title: string;
    phase: string;
    steps: Step[];
};

const fetchProgressData = async (): Promise<Phase[]> => {
    return [
        {
            title: "IJ IPA",
            phase: "Phase 1: Mash",
            steps: [
                { text: "Heat strike water", time: 60, done: false },
                { text: "Mash in", time: 30, done: false },
                { text: "Saccharification rest", time: 20, done: false },
                { text: "Mash out", time: 10, done: false },
            ],
        },
    ];
};

export default function Progress() {
    useFonts();
    const router = useRouter();

    const [phases, setPhases] = useState<Phase[]>([]);
    const [activeTimer, setActiveTimer] = useState<{ phaseIndex: number; stepIndex: number } | null>(null);
    const [remainingTime, setRemainingTime] = useState<number | null>(null);

    useEffect(() => {
        const loadProgressData = async () => {
            const data = await fetchProgressData();
            setPhases(data);
        };
        loadProgressData();
    }, []);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (activeTimer && remainingTime !== null && remainingTime > 0) {
            timer = setInterval(() => {
                setRemainingTime((prev) => (prev !== null ? prev - 1 : null));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [activeTimer, remainingTime]);

    const toggleStep = (phaseIndex: number, stepIndex: number) => {
        const newPhases = [...phases];
        newPhases[phaseIndex].steps[stepIndex].done =
            !newPhases[phaseIndex].steps[stepIndex].done;
        setPhases(newPhases);
    };

    const startTimer = (phaseIndex: number, stepIndex: number, time: number) => {
        setActiveTimer({ phaseIndex, stepIndex });
        setRemainingTime(time);
    };

    const totalSteps = phases.reduce((sum, p) => sum + p.steps.length, 0);
    const doneSteps = phases.reduce(
        (sum, p) => sum + p.steps.filter((s: Step) => s.done).length, 0
    );
    const progress = doneSteps / totalSteps;
    const progressPercentage = Math.round(progress * 100);

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
        >
            {phases.map((phase, phaseIndex) => (
                <Header
                    title={`${phase.title} progress`}
                    iconName="ArrowRight"
                    onIconPress={() => router.push("/HomePage" as any)}
                    actionTestID="store-button"
                />
            ))}

            <View className="my-7 px-5">
                    <ThemedText type="title">{progressPercentage}%</ThemedText>
                        <ProgressBar
                            progress={progress}
                            color={BASE_COLORS.ACCENT_PRIMARY}
                            style={styles.progressBar}
                            testID="progress-bar"
                            accessible={true}
                        />
                </View>

            <ScrollView
            className="mx-5"
                showsVerticalScrollIndicator={false}
            >
                {phases.map((phase, phaseIndex) => (
                    <View key={phaseIndex} style={{ marginBottom: 20 }}>
                        <ThemedText type="subTitle">{phase.phase}</ThemedText>
                        {phase.steps.map((step: Step, stepIndex: number) => (
                            <View key={stepIndex} className="flex-row items-center gap-3">
                                <Checkbox
                                    value={step.done}
                                    disabled={stepIndex > 0 && !phase.steps[stepIndex - 1].done}
                                    onValueChange={() => toggleStep(phaseIndex, stepIndex)}
                                    color={BASE_COLORS.ACCENT_PRIMARY}
                                />
                                <ThemedText
                                    style={[
                                        styles.stepText,
                                        step.done && {
                                            textDecorationLine: "line-through",
                                            opacity: 0.5,
                                        },
                                    ]}
                                >
                                    {step.text}
                                </ThemedText>
                                <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 10 }}>
                                    {activeTimer?.phaseIndex === phaseIndex && activeTimer?.stepIndex === stepIndex && remainingTime === 0 ? (
                                        <AlarmClockCheck color={BASE_COLORS.ACCENT_PRIMARY} size={20} />
                                    ) : (
                                        <AlarmClock color={BASE_COLORS.ACCENT_PRIMARY} size={20} />
                                    )}
                                    <ThemedText style={{ marginLeft: 5 }}>
                                        {activeTimer?.phaseIndex === phaseIndex && activeTimer?.stepIndex === stepIndex
                                            ? `${remainingTime}s`
                                            : `${step.time}s`}
                                    </ThemedText>
                                </View>
                                {!step.done && stepIndex === phase.steps.findIndex((s) => !s.done) && (
                                    <View style={{ marginLeft: 10 }}>
                                        {activeTimer?.phaseIndex === phaseIndex && activeTimer?.stepIndex === stepIndex ? (
                                            <ThemedText>{`Time remaining: ${remainingTime}s`}</ThemedText>
                                        ) : (
                                            <Button
                                                mode="contained"
                                                onPress={() => startTimer(phaseIndex, stepIndex, step.time)}
                                            >
                                                Start
                                            </Button>
                                        )}
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    title: {
        paddingTop: 25,
        fontSize: 50,
        paddingBottom: 25,
        marginHorizontal: 10,
        fontFamily: FontFamilies.HEADING,
        color: BASE_COLORS.TEXT_DARK,
    },
    title2: {
        fontSize: 25,
        fontFamily: FontFamilies.BODY,
        color: BASE_COLORS.TEXT_DARK,
        marginTop: 10,
    },
    stepText: {
        fontSize: 15,
        //color: BASE_COLORS.TEXT_DARK,
        fontFamily: FontFamilies.BODY_LIGHT,
        marginVertical: 5,
    },

    percentageText: {
        fontSize: 18,
        fontFamily: FontFamilies.BODY,
        color: BASE_COLORS.TEXT_DARK,
        marginHorizontal: 10,
        marginBottom: 5,
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
    },
    phaseTitle: {
        fontSize: 18,
        marginTop: 10,
        marginBottom: 5,
        fontFamily: FontFamilies.BODY,
        color: BASE_COLORS.ACCENT_PRIMARY,
    },
    todoSection: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: BASE_COLORS.WHITE,
    },
});
