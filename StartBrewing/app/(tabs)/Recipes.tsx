import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { View, StyleSheet } from "react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter } from "expo-router"; 
import Checkbox from "expo-checkbox";
import React, { useState } from "react";

export default function Recipes() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.general}>
      <ThemedText style={styles.title}>Recipes</ThemedText>
      <ThemedText style={styles.title2}>Popular Recipes</ThemedText>
      <ThemedText style={styles.title2}>Recipes</ThemedText>
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
});
