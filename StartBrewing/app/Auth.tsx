import { useState, useEffect } from "react";
import { Alert, AppState, View, Dimensions } from "react-native";
import { Button } from "react-native-paper";
import { supabase } from "../supabase";
import "../global.css";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { router } from "expo-router";
import { useFonts } from "@/hooks/use-fonts";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import TextInput from "@/components/textInput";
import ErrorChip from "@/components/errorChip";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_SCREEN_WIDTH = 375;
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

export default function Auth() {
  useFonts();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

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
    setLoginError("");

    let loginEmail = identifier;
    let isEmail = /^\S+@\S+\.\S+$/.test(identifier);

    if (!isEmail) {
      // Try to fetch email by username
      const { data, error } = await supabase
        .from("profiles")
        .select("mail")
        .eq("username", identifier)
        .single();

      if (error || !data) {
        setLoginError("Username not linked to an account");
        return;
      }

      loginEmail = data.mail;
    } else {
      // If it's an email, optionally you can check if it exists in the DB
      const { data, error } = await supabase
        .from("profiles")
        .select("mail")
        .eq("mail", loginEmail)
        .single();

      if (error || !data) {
        setLoginError("Email not linked to an account");
        return;
      }
    }

    // Try signing in with email and password
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      setLoginError("Incorrect password");
      return;
    }

    router.push("/(tabs)/HomePage");
  }

  async function signInAsTestUser() {
    const { error } = await supabase.auth.signInWithPassword({
      email: "test@user.com",
      password: "testuser",
    });

    if (error) {
      Alert.alert(error.message);
      return;
    }

    router.push("/(tabs)/HomePage");
  }

  return (
    <SafeAreaView
      className="flex-1 justify-center"
      style={{
        backgroundColor: BASE_COLORS.LIGHT_BG,
      }}
    >
      <View className="mx-5">
        <ThemedText type="titleBlack" className="text-center mb-10">Welcome to StartToBrew!</ThemedText>
        <View className="mb-6">
          <TextInput
            placeholder="Email or Username"
            value={identifier}
            onChangeText={setIdentifier}
            maxLength={50}

          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            maxLength={30}
          />
          {loginError.length > 0 && <ErrorChip text={loginError} />}
        </View>

        <View className="flex-row items-center justify-between">
          <Button
            mode="text"
            onPress={() => router.push("../Registration")}
            labelStyle={{
              fontSize: Math.min(16 * scale, 24),
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.TEXT_DARK,
            }}
          >Sign Up</Button>
          <Button
            mode="contained"
            onPress={signInWithEmail}
            labelStyle={{
              fontSize: Math.min(16 * scale, 24),
              color: BASE_COLORS.WHITE,
              fontFamily: FontFamilies.BODY,
            }}
            style={{
              borderRadius: 30,
              backgroundColor: BASE_COLORS.TEXT_DARK,
            }}
          >Log In</Button>
        </View>

        
      </View>
    </SafeAreaView>
  );
}
