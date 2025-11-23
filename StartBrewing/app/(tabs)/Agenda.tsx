import { useCallback, useState, useEffect } from "react";
import { View, ScrollView, Dimensions, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "@/hooks/use-fonts";
import { Calendar } from "react-native-calendars";
import { Card, Chip, Button, ActivityIndicator } from "react-native-paper";
import Header from "@/components/header";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { ThemedText } from "@/components/themed-text";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase";

const BASE_SCREEN_WIDTH = 375;
const scale = Dimensions.get("window").width / BASE_SCREEN_WIDTH;
const isJest = typeof jest !== "undefined";

function formatDuration(minutes: number) {
  if (minutes >= 10080) return `${Math.floor(minutes / 10080)} week(s)`;
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)} day(s)`;
  if (minutes >= 60) return `${Math.floor(minutes / 60)} h`;
  return `${minutes} min`;
}

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
  id_brew: number,
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

  async function fetchAgendaData() {
    const user = supabase.auth.getUser();

    const { data: brewsData, error: brewErr } = await supabase
      .from("brews")
      .select(`id_brew, name, start_date, recipe_slug`)
      .eq("user_id", (await user).data.user?.id)
      .in("status_id", [1, 2]);

    if (brewErr) {
      console.error(brewErr);
      return;
    }
    const brews: Brew[] = brewsData as Brew[];

    // console.log("brews fetched: ", brews)

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
            brewEntry = { beer: brew.name, id_brew: brew.id_brew, phases: [] };
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
          style={{
            backgroundColor: BASE_COLORS.LIGHT_BG,
            borderRadius: 20,
            overflow: "hidden",
            shadowColor: BASE_COLORS.STONE700,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            marginBottom: 20
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
              textMonthFontFamily: FontFamilies.BODY,
              textDayHeaderFontFamily: FontFamilies.BODY,
            }}
            renderArrow={(direction) => {
              if (direction === "left") {
                return <ChevronLeft color={BASE_COLORS.ACCENT_PRIMARY} size={24} />;
              } else {
                return <ChevronRight color={BASE_COLORS.ACCENT_PRIMARY} size={24} />;
              }
            }}
          />
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false}>
        {phasesForSelectedDate.length === 0 ? (
          <ThemedText>No tasks for this day.</ThemedText>
        ) : (
          phasesForSelectedDate.map((brew: BrewEntry, brewIndex: number) => (
            <Card
              key={brewIndex}
              style={{
                marginBottom: 5,
                backgroundColor: BASE_COLORS.WHITE,
                borderRadius: 15,
                padding: 10,
                outlineColor: BASE_COLORS.STONE500,
                outlineWidth: 1,
                shadowColor: BASE_COLORS.STONE700,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.07,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text style={{
                  fontSize: Math.min(18 * scale, 22),
                  fontFamily: FontFamilies.BODY_BOLD,
                  color: BASE_COLORS.TEXT_DARK,
                }}
                >{brew.beer}</Text>
                <Button onPress={() => {
                  router.push({ pathname: "/progress", params: { id: brew.id_brew } });
                  // console.log(`Brew ID: ${brew.id_brew}`);
                }}>
                  <Text 
                    style={{ 
                      fontSize: Math.min(16 * scale, 22),
                      fontFamily: FontFamilies.BODY,
                      color: BASE_COLORS.TEXT_DARK,
                    }}
                  >Progress</Text>
                </Button>
              </View>

              {brew.phases.map((phase: PhaseEntry, phaseIndex: number) => (
                <View key={phaseIndex} className="mb-4">
                  <ThemedText type="subTitle">{phase.title}</ThemedText>
                  {phase.steps.map((step, stepIndex) => (
                    <View key={stepIndex} className="flex-row items-center ml-4 mt-1">
                      <ThemedText>
                        • {step.text}
                      </ThemedText>
                      {step.time != null && (
                        <Chip
                          style={{
                            marginLeft: 10,
                            height: Math.min( 21 * scale, 40),
                            alignItems: "center",
                            backgroundColor: BASE_COLORS.STONE100,
                          }}
                          textStyle={{
                            fontSize: Math.min( 12 * scale, 20),
                            color: BASE_COLORS.TEXT_DARK,
                            fontFamily: FontFamilies.BODY,
                          }}
                          icon={() => <Clock size={Math.min( 12 * scale, 20)} color={BASE_COLORS.TEXT_DARK} />}
                        >
                          {formatDuration(step.time)}
                        </Chip>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}
