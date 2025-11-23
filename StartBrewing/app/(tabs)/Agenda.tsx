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
import { ChevronDown, ChevronUp, ArrowBigRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase";

const BASE_SCREEN_WIDTH = 375;
const scale = Dimensions.get("window").width / BASE_SCREEN_WIDTH;
const isJest = typeof jest !== "undefined";

interface Brew {
  id_brew: number;
  user_id: string;
  name: string;
  recipe_slug: string | null;
  start_date: string;
  status: number;
  last_step_id: Text;
}

interface Phase {
  phase_id: number;
  recipe_slug: string;
  name: string;
  position: number;
}

interface Step {
  step_id: string;
  phase_id: number;
  title: string;
  start_offset_min: number | null;
  duration_min: number | null;
}

interface PhaseEntry {
  title: string;
  steps: { text: string; time?: number | null }[];
}

interface BrewEntry {
  beer: string;
  phases: PhaseEntry[];
}

export default function Agenda() {
  useFonts();
  const router = useRouter();

  const [phasesByDate, setPhasesByDate] = useState<Record<string, any[]>>({});
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [calendarVisible, setCalendarVisible] = useState(true);

  // -----------------------------------------------------
  // 🔥 1. Supabase data ophalen
  // -----------------------------------------------------
  async function fetchAgendaData() {
    const user = supabase.auth.getUser();

    const { data: brewsData, error: brewErr } = await supabase
      .from("brews")
      .select(`id_brew, name, start_date, recipe_slug`)
      .eq("user_id", (await user).data.user?.id)
      .in("status_id", [1, 2]); // Alleen actieve brews

    if (brewErr) {
      console.error(brewErr);
      return;
    }
    const brews: Brew[] = brewsData as Brew[];

    const { data: phasesData, error: phaseErr } = await supabase
      .from("phases")
      .select("*");

    const phases: Phase[] = phasesData as Phase[];

    const { data: stepsData, error: stepErr } = await supabase
      .from("steps")
      .select('step_id, phase_id, title,start_offset_min, duration_min')
      .order('phase_id', { ascending: true });

    if (phaseErr || stepErr) {
      console.error(phaseErr || stepErr);
      return;
    }
    const steps: Step[] = stepsData as Step[];

    // -----------------------------------------------------
    // 🔥 2. Bouw een volledige agenda structuur op datum
    // -----------------------------------------------------
    const agenda: Record<string, any[]> = {};

    brews.forEach((brew) => {
    const brewPhases = phases.filter((p) => p.recipe_slug === brew.recipe_slug);

    // Startdatum in lokale tijd
    let currentStepTime = new Date(brew.start_date);
    currentStepTime.setHours(0, 0, 0, 0);

    // Bereken alle stappen van deze brew
    brewPhases.forEach((phase) => {
      const phaseSteps = steps.filter((s) => s.phase_id === phase.phase_id).sort((a, b) => a.step_id.localeCompare(b.step_id, undefined, { numeric: true }));

      phaseSteps.forEach((step) => {
        let stepDurationDays = 0;
        if (step.duration_min && step.duration_min > 0) {
          const durationHours = step.duration_min / 60;
          if (durationHours >= 24) {
            stepDurationDays = Math.floor(durationHours / 24);
          }
        }

        const stepDate = new Date(currentStepTime);
        if (stepDurationDays > 0) {
          stepDate.setDate(stepDate.getDate() + stepDurationDays);
        }

        // Bereken dag string
        const dayStr = `${stepDate.getFullYear()}-${(stepDate.getMonth()+1).toString().padStart(2,'0')}-${stepDate.getDate().toString().padStart(2,'0')}`;

      
          if (!agenda[dayStr]) agenda[dayStr] = [];

          // Vind of er al een entry voor deze brew bestaat op deze dag
          let brewEntry = agenda[dayStr].find((b) => b.beer === brew.name);
          if (!brewEntry) {
            brewEntry = { beer: brew.name, phases: [] };
            agenda[dayStr].push(brewEntry);
          }

          // Voeg fase + stap toe
          let phaseEntry = brewEntry.phases.find((p: PhaseEntry) => p.title === phase.name);
          if (!phaseEntry) {
            phaseEntry = { title: phase.name, steps: [] };
            brewEntry.phases.push(phaseEntry);
          }

          // Voeg stap toe
          phaseEntry.steps.push({
            text: step.title,
            time: step.duration_min,
          });
          if (stepDurationDays > 0) {
            currentStepTime.setDate(currentStepTime.getDate() + stepDurationDays);
          }
      });
    });
  });

    setPhasesByDate(agenda);
    await AsyncStorage.setItem("phasesByDate", JSON.stringify(agenda));
  }

  // refresh when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (!isJest && fetchAgendaData) {
        fetchAgendaData();
      }
    }, [])
  );

  useEffect(() => {
    if (!isJest) {
      setCalendarVisible(false);
      requestAnimationFrame(() => setCalendarVisible(true));
    }
  }, [currentDate]);

  const phasesForSelectedDate = phasesByDate[currentDate] || [];

  // -----------------------------------------------------
  // 🔥 Kalender markeringen
  // -----------------------------------------------------
  const markedDates: any = {};

  Object.keys(phasesByDate).forEach((date) => {
    markedDates[date] = {
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

  const [expandedStates, setExpandedStates] = useState<boolean[]>([]);

  useEffect(() => {
    setExpandedStates(phasesForSelectedDate.map(() => false));
  }, [phasesForSelectedDate]);

  const toggleAccordion = (index: number) => {
    setExpandedStates((prev) => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
  };

  // -----------------------------------------------------
  // 🔥 UI
  // -----------------------------------------------------
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
          }}
        >
          <Calendar
            key={currentDate}
            current={currentDate}
            markedDates={markedDates}
            markingType="custom"
            onDayPress={(day) => setCurrentDate(day.dateString)}
          />
        </View>
      )}

      <ScrollView className="px-1 mt-3" showsVerticalScrollIndicator={false}>
        {phasesForSelectedDate.length === 0 ? (
          <ThemedText>No tasks for this day.</ThemedText>
        ) : (
          phasesForSelectedDate.map((brew: BrewEntry, brewIndex: number) => (
            <View
              key={brewIndex}
              className="p-1 mb-1"
              style={{
                backgroundColor: BASE_COLORS.WHITE,
                borderRadius: 15,
                elevation: 3,
              }}
            >
              <List.Accordion
                title={brew.beer}
                expanded={expandedStates[brewIndex]}
                onPress={() => toggleAccordion(brewIndex)}
                titleStyle={{
                  fontFamily: FontFamilies.BODY_BOLD,
                  fontSize: Math.min(18 * scale, 22),
                  color: BASE_COLORS.ACCENT_PRIMARY,
                }}
                right={(props) =>
                  expandedStates[brewIndex] ? (
                    <ChevronUp color={BASE_COLORS.ACCENT_PRIMARY} />
                  ) : (
                    <ChevronDown color={BASE_COLORS.ACCENT_PRIMARY} />
                  )
                }
              >
                {brew.phases.map((phase: PhaseEntry, phaseIndex: number) => (
                  <View key={phaseIndex} className="ml-4 mb-1">
                    <ThemedText type="subTitle">{phase.title}</ThemedText>
                    {phase.steps.map((step, stepIndex) => (
                      <View key={stepIndex} className="flex-row items-center ml-6">
                        <ThemedText>
                          • {step.text}
                          {step.time ? ` (${step.time} min)` : ""}
                        </ThemedText>
                      </View>
                    ))}
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
