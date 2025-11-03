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


export default function Progress() {
    const router = useRouter();
    const fontsLoaded = useFonts();

    const initialSteps = [
        { text: "Step 1", done: true },
        { text: "Step 2", done: true },
        { text: "Step 3", done: false },
        { text: "Step 4", done: false },
        { text: "Step 5", done: false },
        { text: "Step 6", done: false },
    ];

    const [stepsState, setStepsState] = useState(initialSteps);

    const toggleStep = (index: number) => {
    const newSteps = [...stepsState];
    newSteps[index].done = !newSteps[index].done;
    setStepsState(newSteps);
    };

    const progress = stepsState.filter(step => step.done).length / stepsState.length;
    const progressPercentage = Math.round(progress * 100);

    if (!fontsLoaded) {return null;}


    return (
        <SafeAreaView style={[styles.general]}>
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <ThemedText style={styles.title}>Progress</ThemedText>

                <ThemedText style={styles.percentageText}>{progressPercentage}%</ThemedText>

                <ProgressBar progress={progress} color={BASE_COLORS.ACCENT_PRIMARY}  style={styles.progressBar} />

                <ThemedText style={styles.title2}>To do</ThemedText>
                
                <View>
                {stepsState.map((step, index) => (
                        <TouchableOpacity key={index} onPress={() => toggleStep(index)}>
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
            </ScrollView>
        </SafeAreaView>
        
    );
}

const styles = StyleSheet.create({
    general: {
        flex: 1,
        backgroundColor: BASE_COLORS.WHITE,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
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
        fontSize: 22,
        marginHorizontal: 10,
        fontFamily: FontFamilies.BODY,
        color: BASE_COLORS.TEXT_DARK,
        marginBottom: 5,
    },
    stepText: {
        fontSize: 16,
        color: BASE_COLORS.TEXT_DARK,
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
        marginBottom: 10,
    },

});
