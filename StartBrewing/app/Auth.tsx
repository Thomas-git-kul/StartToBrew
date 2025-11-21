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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
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
        <TextInput label="Email" value={email} onChangeText={setEmail} />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
        />
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
      </View>
    </SafeAreaView>
  );
}

