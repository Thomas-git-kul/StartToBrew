import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";

export default function NotFound() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        <ThemedText type="titleBlack" style={styles.title}>
          Oops — page not found
        </ThemedText>

        <ThemedText type="subTitle" style={styles.message}>
          The page you are trying to reach doesn&apos;t exist or has been removed.
          Check the URL or go back to the home page.
        </ThemedText>

        <Button
          mode="contained"
          onPress={() => router.replace("/(tabs)/HomePage")}
          style={[styles.button, styles.buttonPrimary]}
          labelStyle={styles.buttonText}
          contentStyle={{ height: 44 }}
        >
          Back to home
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    textAlign: "left",
    width: "100%",
  },
  message: {
    textAlign: "left",
    marginBottom: 8,
    width: "100%",
  },
  button: {
    marginTop: 8,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    width: "100%",
  },
  buttonPrimary: {
    backgroundColor: BASE_COLORS.ACCENT_PRIMARY,
  },
  buttonSecondary: {
    backgroundColor: BASE_COLORS.WHITE,
    borderWidth: 1,
    borderColor: BASE_COLORS.TEXT_DARK || "#ddd",
  },
  buttonText: {
    color: BASE_COLORS.WHITE,
    fontWeight: "bold",
  },
  buttonSecondaryText: {
    color: BASE_COLORS.TEXT_DARK,
    fontWeight: "bold",
  },
});
