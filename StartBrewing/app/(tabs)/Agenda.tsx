import { useCallback, useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "@/hooks/use-fonts";

import { Calendar } from "react-native-calendars";
import Header from "@/components/header";
import { BASE_COLORS } from "@/constants/Colors";
import { ThemedText } from "@/components/themed-text";

export default function Agenda() {
  useFonts();

  const [phasesByDate, setPhasesByDate] = useState<{ [date: string]: typeof todo }>({});
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0]);
  const [calendarVisible, setCalendarVisible] = useState(true);

  const todo = [
    { date: "2025-11-10", 
      beer: "IJ IPA", 
      title: "Phase 1: Mash", 
      steps: [
        { text: "Heat strike water" },
        { text: "Mash in" },
        { text: "Saccharification rest" },
        { text: "Mash out" },
    ]},
    { date: "2025-11-11", 
      beer: "IJ IPA", 
      title: "Phase 2: Boil", 
      steps: [
        { text: "Bring to boil" },
        { text: "30-min cascade" },
        { text: "10-min cascade" },
    ]},
    { date: "2025-11-12", beer: "IJ IPA", title: "Phase 3: Whirlpool", steps: [
      { text: "Cool to 80°C" },
      { text: "Whirlpool cascade + cascade" },
    ]},
    { date: "2025-11-13", beer: "IJ IPA", title: "Phase 4: Chill", steps: [
      { text: "Chill to 19°C" },
      { text: "Transfer to fermenter" },
      { text: "Pitch yeast" },
    ]},
    { date: "2025-11-14", beer: "IJ IPA", title: "Phase 5: Ferment", steps: [
      { text: "Primary ferment" },
      { text: "Dry hop (3days)" },
    ]},
    { date: "2025-11-15", beer: "IJ IPA", title: "Phase 6: Package", steps: [
      { text: "Package (bottle/keg)" },
    ]},
  ];

  useFocusEffect(
    useCallback(() => {
      const loadPhases = async () => {
        const saved = await AsyncStorage.getItem("phasesByDate");
        if (saved) {
          setPhasesByDate(JSON.parse(saved));
        } else {
          setPhasesByDate({});
        }
      };
      loadPhases();
    }, [])
  );

  useEffect(() => {
    setCalendarVisible(false);
    requestAnimationFrame(() => setCalendarVisible(true));
  }, [currentDate]);

  // ⬇️ NEW: Find the todo for selected date
  const phasesForSelectedDate = todo.filter(p => p.date === currentDate);

  // ---- NEW: Marked Dates ----
  const markedDates: any = {};

  // Mark todo dates with a dot
  todo.forEach((item) => {
    markedDates[item.date] = {
      marked: true,
      dotColor: BASE_COLORS.ACCENT_PRIMARY,
    };
  });

  // Add selected date highlight (full circle with white text)
  markedDates[currentDate] = {
    ...(markedDates[currentDate] || {}),
    selected: true,
    selectedColor: BASE_COLORS.ACCENT_PRIMARY,
    customStyles: {
      container: {
        backgroundColor: BASE_COLORS.ACCENT_PRIMARY,
        height: 33,
        width: 33,
        alignSelf: "center",
      },
      text: {
        color: BASE_COLORS.WHITE,
      },
    },
  };

  return (
    <View className="flex-1" style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
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
            key={currentDate}
            current={currentDate}
            markedDates={markedDates}
            markingType="custom"
            onDayPress={(day) => setCurrentDate(day.dateString)}
            theme={{
              todayTextColor: BASE_COLORS.ACCENT_PRIMARY,
              arrowColor: BASE_COLORS.ACCENT_PRIMARY,
              calendarBackground: BASE_COLORS.WHITE,
            }}
          />
        </View>
      )}

      <ThemedText type="title" className="ml-1 mt-1">To do</ThemedText>

      <ScrollView className="ml-1 mb-8">
        {phasesForSelectedDate.length === 0 && (
          <ThemedText type="defaultText">No tasks for this day.</ThemedText>
        )}

        {phasesForSelectedDate.map((phase, index) => (
          <View key={index} className="mb-4">
            <ThemedText type="subTitle">{phase.title}</ThemedText>

            {phase.steps.map((step, stepIndex) => (
              <View key={stepIndex} className="flex-row items-center mb-1 ml-2">
                <ThemedText type="defaultText">• {step.text}</ThemedText>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
