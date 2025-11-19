import { useCallback, useState, useEffect } from "react";
import { View, ScrollView, Dimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "@/hooks/use-fonts";
import { Calendar } from "react-native-calendars";
import { List } from "react-native-paper";
import Header from "@/components/header";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { ThemedText } from "@/components/themed-text";
import { ChevronDown, ChevronUp } from 'lucide-react-native';

const BASE_SCREEN_WIDTH = 375;
const scale = Dimensions.get('window').width / BASE_SCREEN_WIDTH;

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
    { date: "2025-11-10", 
      beer: "black IPA", 
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
    { date: "2025-11-14", 
      beer: "black IPA", 
      title: "Phase 4: Chill", 
      steps: [
        { text: "Chill to 19°C" },
        { text: "Transfer to fermenter" },
        { text: "Pitch yeast" },
    ]},
    { date: "2025-11-14", 
      beer: "IJ IPA", 
      title: "Phase 5: Ferment", 
      steps: [
        { text: "Primary ferment" },
        { text: "Dry hop (3days)" },
    ]},
    { date: "2025-11-14", 
      beer: "sunny IPA", 
      title: "Phase 6: Package", 
      steps: [
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

  const phasesForSelectedDate = todo.filter(p => p.date === currentDate);
  const markedDates: any = {};

  todo.forEach((item) => {
    markedDates[item.date] = {
      marked: true,
      dotColor: BASE_COLORS.ACCENT_PRIMARY,
    };
  });

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

  const SECTIONS = phasesForSelectedDate.map(phase => ({
    title: phase.beer,
    content: {
      phaseTitle: phase.title,
      steps: phase.steps
    }
  }));

  const [expandedStates, setExpandedStates] = useState(phasesForSelectedDate.map(() => false));

  const toggleAccordion = (index: number) => {
    setExpandedStates((prev) => {
      const newStates = [...prev];
      newStates[index] = !newStates[index];
      return newStates;
    });
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
          style={{
            backgroundColor: BASE_COLORS.LIGHT_BG,
            borderRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
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

      <ScrollView
        className="px-1 mt-3"
        showsVerticalScrollIndicator={false}
        style={{
          backgroundColor: BASE_COLORS.LIGHT_BG,
        }}
      >
        {phasesForSelectedDate.length === 0 ? (
          <ThemedText type="defaultText">No tasks for this day.</ThemedText>
        ) : (
          phasesForSelectedDate.map((phase, index) => (
            <View
              key={index}
              className="p-1 mb-1"
              style={{
                backgroundColor: BASE_COLORS.WHITE,
                borderRadius: 15,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <List.Accordion
                title={phase.beer}
                titleStyle={{ fontFamily: FontFamilies.BODY_BOLD, fontSize: Math.min(18 * scale, 22), color: BASE_COLORS.ACCENT_PRIMARY }}
                style={{ backgroundColor: BASE_COLORS.WHITE }}
                left={undefined}
                expanded={expandedStates[index]}
                onPress={() => toggleAccordion(index)}
                right={(props) => expandedStates[index] ? <ChevronUp {...props} color={BASE_COLORS.TEXT_DARK} /> : <ChevronDown {...props} color={BASE_COLORS.TEXT_DARK} />}
              >
                {/* Phase title */}
                <ThemedText type="defaultText" className="ml-4 mb-1 mt-2">
                  {phase.title}
                </ThemedText>

                {/* Steps */}
                {phase.steps.map((step, stepIndex) => (
                  <View key={stepIndex} className="flex-row items-center mb-1 ml-6">
                    <ThemedText type="defaultText">• {step.text}</ThemedText>
                  </View>
                ))}
              </List.Accordion>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
