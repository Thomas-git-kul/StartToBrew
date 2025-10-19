import React, { useState, useEffect } from "react";
import { Alert, AppState, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { supabase } from "../../supabase";
import "../../global.css";

export default function Auth() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh?.();
      } else {
        supabase.auth.stopAutoRefresh?.();
      }
    });

    return () => subscription.remove();
  }, []);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { data: { session }, error } = await supabase.auth.signUp({ email, password });

    if (error) Alert.alert(error.message);
    if (!session) Alert.alert("Please check your inbox for email verification!");
    setLoading(false);
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24, backgroundColor: "white" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 32, textAlign: "center", color: "black" }}>
        Welcome
      </Text>

      <View style={{ gap: 16 }}>
        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          label="Password"
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Button mode="contained" loading={loading} onPress={signInWithEmail} style={{ marginBottom: 12 }}>
          Sign In
        </Button>
        <Button mode="outlined" loading={loading} onPress={signUpWithEmail} textColor={theme.colors.primary}>
          Sign Up
        </Button>
      </View>
    </View>
  );
}
