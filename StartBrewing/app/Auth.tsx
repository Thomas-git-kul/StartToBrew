import { useState, useEffect } from "react";
import { Alert, AppState, View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { supabase } from "../supabase";
import "../global.css";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { router } from "expo-router";
import { useFonts } from "@/hooks/use-fonts";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import TextInput from "@/components/textInput";

export default function Auth() {
  useFonts();

  const theme = useTheme();
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
    // Check if identifier is an email
    if (!/^\S+@\S+\.\S+$/.test(identifier)) {
      // Not an email, try to fetch email by username
      const { data, error } = await supabase
        .from("profiles")
        .select("mail")
        .eq("username", identifier)
        .single();
      if (error || !data) {
        setLoginError("Incorrect username/email or password");
        return;
      }
      loginEmail = data.mail;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      setLoginError("Incorrect username/email or password");
      return;
    }

    router.replace("/(tabs)/HomePage");
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

    router.replace("/(tabs)/HomePage");
  }

  return (
    <SafeAreaView
      className="flex-1 justify-center"
      style={{
        backgroundColor: BASE_COLORS.LIGHT_BG,
      }}
    >
      <ThemedText type="titleBlack" className="text-center mb-10">
        Welcome
      </ThemedText>

      <View className="gap-1 mx-5 mb-8">
        <TextInput label="Email or Username" value={identifier} onChangeText={setIdentifier} />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {loginError.length > 0 && (
          <ThemedText style={{ color: 'red', marginTop: 8, textAlign: 'center' }}>
            {loginError}
          </ThemedText>
        )}
      </View>

      <View className="items-center gap-2">
        <Button
          mode="contained"
          onPress={signInWithEmail}
          buttonColor={BASE_COLORS.TEXT_DARK}
          textColor={BASE_COLORS.WHITE}
          contentStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
          labelStyle={{
            fontSize: 16,
            color: BASE_COLORS.WHITE,
            fontFamily: FontFamilies.BODY,
          }}
          style={{
            borderRadius: 20,
            width: "65%",
          }}
        >
          Sign In
        </Button>
        <Button
          mode="contained"
          onPress={() => router.push("../Registration")}
          buttonColor={BASE_COLORS.TEXT_DARK}
          textColor={BASE_COLORS.WHITE}
          contentStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
          labelStyle={{
            fontSize: 16,
            color: BASE_COLORS.WHITE,
            fontFamily: FontFamilies.BODY,
          }}
          style={{
            borderRadius: 20,
            width: "65%",
          }}
        >
          Sign Up
        </Button>
        <Button
          mode="contained"
          onPress={signInAsTestUser}
          buttonColor={BASE_COLORS.STONE400}
          textColor={BASE_COLORS.WHITE}
          contentStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
          labelStyle={{
            fontSize: 16,
            color: BASE_COLORS.WHITE,
            fontFamily: FontFamilies.BODY,
          }}
          style={{
            borderRadius: 20,
            width: "65%",
          }}
        >
          Sign In as Test User
        </Button>
      </View>
    </SafeAreaView>
  );
}
