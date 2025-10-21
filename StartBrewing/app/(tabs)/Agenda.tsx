import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { View, StyleSheet } from "react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter } from "expo-router"; 
import Checkbox from "expo-checkbox";
import React, { useState } from "react";
import { Calendar } from "react-native-calendars";

export default function Agenda() {
  const router = useRouter();

  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);

  return (
    <SafeAreaView style={styles.general}>
      <ThemedText style={styles.title}>Agenda</ThemedText>
      <ThemedText style={styles.title3}>Januari</ThemedText>

      {/* Hier voegen we de kalender toe */}
      <Calendar
        // start met de huidige maand
        current={'2025-01-01'}
        // markeer specifieke dagen
        markedDates={{
          '2025-01-10': { marked: true, dotColor: BASE_COLORS.ACCENT_PRIMARY },
          '2025-01-15': { marked: true, dotColor: BASE_COLORS.ACCENT_PRIMARY },
        }}
        theme={{
          todayTextColor: BASE_COLORS.ACCENT_PRIMARY,
          arrowColor: BASE_COLORS.ACCENT_PRIMARY,
        }}
      />

      <ThemedText style={styles.title2}>To do</ThemedText>

      <View style={styles.todoItem}>
        <Checkbox
          value={checked1}
          onValueChange={setChecked1}
          color={checked1 ? BASE_COLORS.ACCENT_PRIMARY : undefined}
        />
        <ThemedText
          style={[
            styles.text,
            checked1 && { textDecorationLine: "line-through", opacity: 0.5 },
          ]}
        >
          Measure the pH of your brew
        </ThemedText>
      </View>

      <View style={styles.todoItem}>
        <Checkbox
          value={checked2}
          onValueChange={setChecked2}
          color={checked2 ? BASE_COLORS.ACCENT_PRIMARY : undefined}
        />
        <ThemedText
          style={[
            styles.text,
            checked2 && { textDecorationLine: "line-through", opacity: 0.5 },
          ]}
        >
          Step 8: add 2 liters of water
        </ThemedText>
      </View>
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
    fontWeight: 'bold',
    marginHorizontal: 10,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
  },
  title2: {
    paddingTop: 10,
    fontSize: 25,
    fontWeight: 'bold',
    marginHorizontal: 10,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
  },
  title3: {
    paddingTop: 10,
    fontSize: 25,
    marginHorizontal: 10,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
  },
  text: {
    fontSize: 15,
    marginHorizontal: 10,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    marginHorizontal: 10,
  },
});
