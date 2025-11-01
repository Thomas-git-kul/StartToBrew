import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { View, StyleSheet } from "react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter } from "expo-router"; 
import Checkbox from "expo-checkbox";
import React, { useCallback, useState } from "react";
import { Calendar } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage'
import { TouchableOpacity } from "react-native";

export default function Agenda() {
  const router = useRouter();

  const [checkedTodos, setCheckedTodos] = useState<{ [date: string]: boolean[] }>({});
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [calendarVisible, setCalendarVisible] = useState(true);

  const todosByDate: { [key: string]: { text: string }[] } = {
    '2025-11-10': [
      { text: "Measure the pH of your brew" },
      { text: "Step 8: add 2 liters of water" },
    ],
    '2025-11-15': [
      { text: "Check fermentation temp" },
    ],
    '2025-11-20': [
      { text: "Measure the pH of your brew" },
      { text: "Step 9: add 0.5 liters of water" },
    ],
  };

  useFocusEffect(
    useCallback(() => {
      const today = new Date().toISOString().split("T")[0];
      setCurrentDate(today);

      const loadCheckedTodos = async () => {
        const saved = await AsyncStorage.getItem('checkedTodos');
        if (saved) {
          setCheckedTodos(JSON.parse(saved));
        } else {
          const initialChecked: { [date: string]: boolean[] } = {};
          for (const date in todosByDate) {
            initialChecked[date] = todosByDate[date].map(() => false);
          }
          setCheckedTodos(initialChecked);
        }
      };

      loadCheckedTodos();

      setCalendarVisible(false);
      requestAnimationFrame(() => setCalendarVisible(true));
    }, [])
  );

  const onDayPress = (day: any) => {
    setCurrentDate(day.dateString);
  };

  const toggleTodo = async (date: string, index: number) => {
    setCheckedTodos(prev => {
      const dayChecked = prev[date] ? [...prev[date]] : [];
      dayChecked[index] = !dayChecked[index];
      const newState = { ...prev, [date]: dayChecked};
      AsyncStorage.setItem('checkedTodos', JSON.stringify(newState));
      return { ...prev, [date]: dayChecked };
    });
  };

  const markedDates: { [key: string]: any } = {};
  for (const date in todosByDate) {
    markedDates[date] = { marked: true, dotColor: BASE_COLORS.ACCENT_PRIMARY };
  }

  markedDates[currentDate] = {
    ...(markedDates[currentDate] || {}),
    selected: true,
    selectedColor: BASE_COLORS.ACCENT_PRIMARY,
  };

  const todos = todosByDate[currentDate] || [];
  const checked = checkedTodos[currentDate] || todos.map(() => false);

  const goToToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setCurrentDate(today);
    setCalendarVisible(false);
    requestAnimationFrame(() => setCalendarVisible(true));
  };

  return (
    <SafeAreaView style={styles.general}>
      <ThemedText style={styles.title}>Agenda</ThemedText>

      <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
        <ThemedText style={styles.todayButtonText}>Today</ThemedText>
      </TouchableOpacity>

      {calendarVisible && (
      <Calendar
        current={currentDate}
        markedDates={markedDates}
        onDayPress={onDayPress}
        theme={{
          todayTextColor: BASE_COLORS.ACCENT_PRIMARY,
          arrowColor: BASE_COLORS.ACCENT_PRIMARY,
        }}
      />
      )}

      <ThemedText style={styles.title2}>To do</ThemedText>

      {todos.map((todo, index) => (
        <View key={index} style={styles.todoItem}>
          <Checkbox
            value={checked[index]}
            onValueChange={() => toggleTodo(currentDate, index)}
            color={checked[index] ? BASE_COLORS.ACCENT_PRIMARY : undefined}
          />
          <ThemedText
            style={[
              styles.text,
              checked[index] && { textDecorationLine: "line-through", opacity: 0.5 },
            ]}
          >
            {todo.text}
          </ThemedText>
        </View>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  general: {
    flex: 1,
    backgroundColor: BASE_COLORS.WHITE,
  },
  title: {
    paddingTop: 25,
    fontSize: 50,
    marginHorizontal: 10,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
  },
  title2: {
    paddingTop: 10,
    fontSize: 22,
    marginHorizontal: 10,
    fontFamily: FontFamilies.BODY,
    color: BASE_COLORS.TEXT_DARK,
  },
  title3: {
    paddingTop: 10,
    fontSize: 25,
    marginHorizontal: 10,
    fontFamily: FontFamilies.BODY,
    color: BASE_COLORS.TEXT_DARK,
  },
  text: {
    fontSize: 15,
    marginHorizontal: 10,
    fontFamily: FontFamilies.BODY_LIGHT,
    color: BASE_COLORS.TEXT_DARK,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    marginHorizontal: 10,
  },

  todayButton: {
  backgroundColor: BASE_COLORS.ACCENT_PRIMARY,
  paddingVertical: 6,
  paddingHorizontal: 15,
  borderRadius: 8,
  alignSelf: "flex-start",
  marginHorizontal: 10,
  marginTop: 10,
  marginBottom: 10,
},
todayButtonText: {
  color: BASE_COLORS.WHITE,
  fontFamily: FontFamilies.BODY,
  fontSize: 16,
},
});
