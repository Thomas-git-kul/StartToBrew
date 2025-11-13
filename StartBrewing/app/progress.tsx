import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter } from "expo-router"; 
import { useFonts } from "@/hooks/use-fonts";
import { ProgressBar } from "react-native-paper";
import { useState } from "react";
import { ScrollView } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

export default function Progress() {
    const router = useRouter();
    const fontsLoaded = useFonts();

    const initialPhases = [
        {
            title: "Phase 1: Mash",
            steps: [
            { text: "Heat strike water", done: true },
            { text: "Mash in", done: true },
            { text: "Saccharification rest", done: true },
            { text: "Mash out", done: true },
            ],
        },
        {
            title: "Phase 2: Boil",
            steps: [
            { text: "Bring to boil", done: false },
            { text: "30-min cascade", done: false },
            { text: "10-min cascade", done: false },
            ],
        },
        {
            title: "Phase 3: Whirlpool",
            steps: [
            { text: "Cool to 80°C", done: false },
            { text: "Whirlpool cascade + cascade", done: false },
            ],
        },
        {
            title: "Phase 4: Chill",
            steps: [
            { text: "Chill to 19°C", done: false },
            { text: "Transfer to fermenter", done: false },
            { text: "Pitch yeast", done: false },
            ],
        },
        {
            title: "Phase 5: ferment",
            steps: [
            { text: "Primary ferment", done: false },
            { text: "Dry hop (3days)", done: false },
            ],
        },
        {
            title: "Phase 6: package",
            steps: [
            { text: "package (bottle/keg)", done: false },
            ],
        },
    ];

    const [phases, setPhases] = useState(initialPhases);

    const toggleStep = (phaseIndex: number, stepIndex: number) => {
        const newPhases = [...phases];
        newPhases[phaseIndex].steps[stepIndex].done =
            !newPhases[phaseIndex].steps[stepIndex].done;
        setPhases(newPhases);
    };

    const totalSteps = phases.reduce((sum, p) => sum + p.steps.length, 0);
    const doneSteps = phases.reduce(
        (sum, p) => sum + p.steps.filter(s => s.done).length, 0);
    const progress = doneSteps / totalSteps;
    const progressPercentage = Math.round(progress * 100);


    if (!fontsLoaded) {return null;}

    return (
        <SafeAreaView style={styles.general}>
            <View style={styles.headerSection}>
                <ThemedText style={styles.title}>Progress</ThemedText>
                <ThemedText style={styles.percentageText}>{progressPercentage}%</ThemedText>
                <ProgressBar progress={progress} color={BASE_COLORS.ACCENT_PRIMARY}  style={styles.progressBar} testID="progress-bar" accessible={true}/>
            </View>
            
            <View style={styles.todoSection}>
                <ThemedText style={styles.title2}>To do</ThemedText>
            </View>
                
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {phases.map((phase, phaseIndex) => (
                    <View key={phaseIndex} style={{ marginBottom: 20 }}>
                        <ThemedText style={styles.phaseTitle}>{phase.title}</ThemedText>
                        {phase.steps.map((step, stepIndex) => (
                            <TouchableOpacity
                                key={stepIndex}
                                onPress={() => toggleStep(phaseIndex, stepIndex)}
                            >
                                <ThemedText
                                    style={[
                                        styles.stepText,
                                        step.done && { textDecorationLine: "line-through", opacity: 0.5 },
                                    ]}
                                >
                                    {step.text}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
        
    );
}

const styles = StyleSheet.create({
    general: {
        flex: 1,
        backgroundColor: BASE_COLORS.WHITE,
    },
    headerSection: {        
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 5,
        backgroundColor: BASE_COLORS.WHITE,
        elevation: 3,        // 👈 subtiele schaduw (Android)
        shadowColor: "#000", // 👈 subtiele schaduw (iOS)
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
    },
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
