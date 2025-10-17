import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const React = require("react") as typeof import("react");

export default function HomepageScreen() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  return (
    <ThemedView
      style={[styles.container, { paddingTop: (insets.top ?? 0) + 12 }]}
    >
      <ThemedText type="title">Hello world</ThemedText>
      <ThemedText>some random words</ThemedText>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Text message"
        style={styles.input}
        accessibilityLabel="first-input"
      />

      {/* Existing button */}
      <Link href="/popUpWindow" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Go to popUpWindow</Text>
        </Pressable>
      </Link>

      {/* authorization page*/}
      <Link href="../Auth" asChild>
        <Pressable style={[styles.button, styles.authButton]}>
          <Text style={styles.buttonText}>Go to Auth Page</Text>
        </Pressable>
      </Link>

      {submitted !== null && (
        <ThemedText style={styles.result}>
          You submitted: {submitted}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  authButton: {
    backgroundColor: "#34C759", // Apple-style green for Auth
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  result: {
    marginTop: 12,
  },
});
