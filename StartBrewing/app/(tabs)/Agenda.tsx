import { useCallback, useState } from "react";
import { View, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "@/hooks/use-fonts";

import { Calendar } from "react-native-calendars";
import { Checkbox } from "react-native-paper";
import Header from "@/components/header";

import { BASE_COLORS } from "@/constants/Colors";
import { ThemedText } from "@/components/themed-text";

export default function Agenda() {
  useFonts();

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

  return (
    <View className="flex-1"
      style={{
        backgroundColor: BASE_COLORS.LIGHT_BG
      }}
    >
      
      <Header
        title="Agenda"
        iconName="Calendar1"
        onIconPress={() => {
            const today = new Date().toISOString().split("T")[0];
            setCurrentDate(today);
          }}
      />

      {calendarVisible && (
        <View
          className="mx-1 my-1 rounded-2xl overflow-hidden shadow"
          style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
        >
          <Calendar
            current={currentDate}
            markedDates={markedDates}
            onDayPress={(day) => setCurrentDate(day.dateString)}
            theme={{
              todayTextColor: BASE_COLORS.ACCENT_PRIMARY,
              arrowColor: BASE_COLORS.ACCENT_PRIMARY,
              calendarBackground: BASE_COLORS.WHITE
            }}
          />
        </View>
      )}

      <ThemedText type='title' className="ml-1">To do</ThemedText>

      <ScrollView className="ml-1">
        {phases.map((phase, phaseIndex) => {
          const date = phaseDates[phaseIndex];
          if (currentDate !== date) return null;

          return (
            <View key={phaseIndex}>
              <ThemedText type='subTitle'>{phase.title}</ThemedText>

              {phase.steps.map((step, stepIndex) => (
                <View
                  key={stepIndex}
                  className="flex-row items-center"
                >
                  <Checkbox
                    status={step.done ? "checked" : "unchecked"}
                    onPress={() => toggleStep(date, phaseIndex, stepIndex)}
                    color={BASE_COLORS.ACCENT_PRIMARY}
                  />

                  <ThemedText type='defaultText'
                    onPress={() => toggleStep(date, phaseIndex, stepIndex)}
                  >
                    {step.text}
                  </ThemedText>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
