import React, { useState, useEffect } from "react";
import { Alert, AppState, View, StyleSheet } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { supabase } from "../supabase";
import "../global.css";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { router, useRouter } from "expo-router";

export default function Auth() {
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

    // succesvolle login -> ga direct naar HomePage tab
    router.replace("/(tabs)/HomePage");
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        backgroundColor: BASE_COLORS.LIGHT_BG,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontFamily: FontFamilies.HEADING,
          marginBottom: 32,
          textAlign: "center",
          color: BASE_COLORS.STONE_DARK,
        }}
      >
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
          outlineColor={BASE_COLORS.STONE_DARK}
          activeOutlineColor={BASE_COLORS.TEXT_DARK}
          style={styles.input}
        />
        <TextInput
          label="Password"
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          outlineColor={BASE_COLORS.STONE_DARK}
          activeOutlineColor={BASE_COLORS.TEXT_DARK}
          style={styles.input}
        />
        <Button
          mode="contained"
          onPress={signInWithEmail}
          labelStyle={styles.buttonLabel}
          buttonColor={BASE_COLORS.TEXT_DARK}
          textColor={BASE_COLORS.WHITE}
          style={styles.buttonPrimary}
        >
          Sign In
        </Button>
        <Button
          mode="outlined"
          onPress={() => router.push("../Registration")}
          textColor={BASE_COLORS.WHITE}
          style={styles.buttonSecondary}
          labelStyle={styles.buttonLabelSecondary}
          buttonColor={BASE_COLORS.TEXT_DARK}
        >
          Sign Up
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: BASE_COLORS.WHITE,
    fontFamily: FontFamilies.BODY,
  },
  buttonPrimary: {
    paddingVertical: 8,
    borderRadius: 12,
  },
  buttonSecondary: {
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonLabel: {
    fontFamily: FontFamilies.BODY_BOLD,
    fontSize: 16,
  },
  buttonLabelSecondary: {
    fontFamily: FontFamilies.BODY_BOLD,
    fontSize: 16,
  },
});
