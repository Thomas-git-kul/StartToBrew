import React, { useState } from "react";
import { Alert, AppState, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { supabase } from "../supabase";

// Handle Supabase auto-refresh
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Auth() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) Alert.alert(error.message);
    if (!session)
      Alert.alert("Please check your inbox for email verification!");
    setLoading(false);
  }

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold mb-8 text-center text-black">
        Welcome
      </Text>

      <View className="space-y-4">
        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          left={<TextInput.Icon icon="email" />}
          className="mb-4"
        />

        <TextInput
          label="Password"
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          left={<TextInput.Icon icon="lock" />}
          className="mb-4"
        />

        <Button
          mode="contained"
          loading={loading}
          onPress={signInWithEmail}
          className="mb-3 bg-blue-600"
        >
          Sign In
        </Button>

        <Button
          mode="outlined"
          loading={loading}
          onPress={signUpWithEmail}
          textColor={theme.colors.primary}
        >
          Sign Up
        </Button>
      </View>
    </View>
  );
}
