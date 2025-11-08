import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter } from "expo-router";
import Checkbox from "expo-checkbox";
import React, { useCallback, useState } from "react";
import { Calendar } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HeaderBar from "@/components/header";

export default function Agenda() {
  const router = useRouter();

  const initialPhases = [
    {
      title: "Phase 1: Mash",
      steps: [
        { text: "Heat strike water", done: false },
        { text: "Mash in", done: false },
        { text: "Saccharification rest", done: false },
        { text: "Mash out", done: false },
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
      title: "Phase 5: Ferment",
      steps: [
        { text: "Primary ferment", done: false },
        { text: "Dry hop (3days)", done: false },
      ],
    },
    {
      title: "Phase 6: Package",
      steps: [{ text: "Package (bottle/keg)", done: false }],
    },
  ];

  const phaseDates: { [phaseIndex: number]: string } = {
    0: "2025-11-10",
    1: "2025-11-11",
    2: "2025-11-12",
    3: "2025-11-13",
    4: "2025-11-14",
    5: "2025-11-15",
  };

  const [phasesByDate, setPhasesByDate] = useState<{ [date: string]: typeof initialPhases }>({});
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0]);
  const [calendarVisible, setCalendarVisible] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadPhases = async () => {
        const saved = await AsyncStorage.getItem("phasesByDate");
        if (saved) {
          setPhasesByDate(JSON.parse(saved));
        } else {
          setPhasesByDate({ [currentDate]: initialPhases });
        }
      };
      loadPhases();

      setCalendarVisible(false);
      requestAnimationFrame(() => setCalendarVisible(true));
    }, [currentDate])
  );

  const onDayPress = (day: any) => {
    setCurrentDate(day.dateString);
  };

  const toggleStep = async (date: string, phaseIndex: number, stepIndex: number) => {
    setPhasesByDate((prev) => {
      const datePhases = prev[date] ? [...prev[date]] : JSON.parse(JSON.stringify(initialPhases));
      datePhases[phaseIndex].steps[stepIndex].done = !datePhases[phaseIndex].steps[stepIndex].done;
      const newState = { ...prev, [date]: datePhases };
      AsyncStorage.setItem("phasesByDate", JSON.stringify(newState));
      return newState;
    });
  };

  const markedDates: { [key: string]: any } = {};
  for (const date of Object.values(phaseDates)) {
    markedDates[date] = { marked: true, dotColor: BASE_COLORS.ACCENT_PRIMARY };
  }

  markedDates[currentDate] = {
    ...(markedDates[currentDate] || {}),
    selected: true,
    selectedColor: BASE_COLORS.ACCENT_PRIMARY,
  };

  const phases = phasesByDate[currentDate] || initialPhases;

  const goToToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setCurrentDate(today);
    setCalendarVisible(false);
    requestAnimationFrame(() => setCalendarVisible(true));
  };

  return (
    <SafeAreaView style={styles.general}>
      
    <HeaderBar
      title="Agenda"
      iconName="today" // icon is dynamic
      onIconPress={goToToday} // handler defined in Agenda.tsx
    />
      <ThemedText style={styles.title}>Agenda</ThemedText>

      {/* Header Row with Today and Progress Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
          <ThemedText style={styles.todayButtonText}>Today</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.todayButton} onPress={() => router.push("../progress")}>
          <ThemedText style={styles.todayButtonText}>Progress</ThemedText>
        </TouchableOpacity>
      </View>

      {calendarVisible && (
        <Calendar
          current={currentDate}
          markedDates={markedDates}
          onDayPress={(day) => setCurrentDate(day.dateString)}
          theme={{
            todayTextColor: BASE_COLORS.ACCENT_PRIMARY,
            arrowColor: BASE_COLORS.ACCENT_PRIMARY,
          }}
        />
      )}

      <ThemedText style={styles.title2}>To do</ThemedText>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {phases.map((phase, phaseIndex) => {
          const date = phaseDates[phaseIndex];

          if (currentDate !== date) return null;

          return (
            <View key={phaseIndex} style={{ marginBottom: 20 }}>
              <ThemedText style={styles.phaseTitle}>{phase.title}</ThemedText>
              {phase.steps.map((step, stepIndex) => (
                <View key={stepIndex} style={styles.todoItem}>
                  <Checkbox
                    value={step.done}
                    onValueChange={() => toggleStep(date, phaseIndex, stepIndex)}
                    color={step.done ? BASE_COLORS.ACCENT_PRIMARY : undefined}
                  />
                  <TouchableOpacity onPress={() => toggleStep(date, phaseIndex, stepIndex)}>
                    <ThemedText
                      style={[
                        styles.stepText,
                        step.done && { textDecorationLine: "line-through", opacity: 0.5 },
                      ]}
                    >
                      {step.text}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  general: { flex: 1, backgroundColor: BASE_COLORS.WHITE },
  title: { paddingTop: 25, fontSize: 50, marginHorizontal: 10, fontFamily: FontFamilies.HEADING, color: BASE_COLORS.TEXT_DARK },
  title2: { paddingTop: 10, fontSize: 22, marginHorizontal: 10, fontFamily: FontFamilies.BODY, color: BASE_COLORS.TEXT_DARK },
  todoItem: { flexDirection: "row", alignItems: "center", marginVertical: 5, marginHorizontal: 10 },
  todayButton: { backgroundColor: BASE_COLORS.ACCENT_PRIMARY, paddingVertical: 6, paddingHorizontal: 15, borderRadius: 8, alignSelf: "flex-start", marginHorizontal: 10, marginTop: 10, marginBottom: 10 },
  todayButtonText: { color: BASE_COLORS.WHITE, fontFamily: FontFamilies.BODY, fontSize: 16 },
  buttonRow: { flexDirection: "row", justifyContent: "flex-start", gap: 10, marginHorizontal: 10, marginTop: 10, marginBottom: 10 },
  stepText: { fontSize: 15, fontFamily: FontFamilies.BODY_LIGHT, marginLeft: 10 },
  phaseTitle: { fontSize: 18, marginTop: 10, marginBottom: 5, fontFamily: FontFamilies.BODY, color: BASE_COLORS.ACCENT_PRIMARY, marginHorizontal: 0 },
  scrollContent: { paddingHorizontal: 10, paddingBottom: 20 },
});
