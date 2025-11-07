// app/Registration.tsx

import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import Checkbox from "expo-checkbox";
import { supabase } from "@/supabase";
import { router } from "expo-router";
import { ScrollView } from "react-native-reanimated/lib/typescript/Animated";

export default function Registration() {
  const [lastname, setLastname] = useState("");
  const [firstname, setFirstname] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    if (!agree) {
      Alert.alert("Please accept the terms and conditions.");
      return;
    }

    if (!email || !password) {
      Alert.alert("Email and password are required.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          first_name: firstname,
          last_name: lastname,
          birthdate: `${year}-${month}-${day}`,
        },
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert(error.message);
      return;
    }

    if (!session) {
      // supabase verwacht email verification
      Alert.alert("Check your inbox to verify your email.");
      // terug naar login
      router.replace("/Auth");
      return;
    }

    // als direct sessie bestaat: naar HomePage
    router.replace("/(tabs)/HomePage");
  }

  return (
    <SafeAreaView style={styles.general}>
      <Text style={styles.title}>No account yet? Register here!</Text>

      {/* Name Row */}
      <View style={styles.row}>
        <Text style={[styles.label, { left: 10 }]}>Lastname</Text>
        <TextInput
          style={[styles.input, { left: 10 }]}
          value={lastname}
          onChangeText={setLastname}
        />

        <Text style={[styles.label, { left: "50%" }]}>Firstname</Text>
        <TextInput
          style={[styles.input, { left: "50%" }]}
          value={firstname}
          onChangeText={setFirstname}
        />
      </View>

      {/* Birthday */}
      <View style={styles.row}>
        <Text style={[styles.label, { left: 10 }]}>Day</Text>
        <TextInput
          style={[styles.inputSmall, { left: 10 }]}
          value={day}
          onChangeText={setDay}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { left: "33%" }]}>Month</Text>
        <TextInput
          style={[styles.inputSmall, { left: "33%" }]}
          value={month}
          onChangeText={setMonth}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { left: "66%" }]}>Year</Text>
        <TextInput
          style={[styles.inputSmall, { left: "66%" }]}
          value={year}
          onChangeText={setYear}
          keyboardType="numeric"
        />
      </View>

      {/* Email */}
      <Text style={styles.subtitle}>Email</Text>
      <TextInput
        style={styles.inputFull}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {/* Username */}
      <Text style={styles.subtitle}>Username</Text>
      <TextInput
        style={styles.inputFull}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      {/* Password */}
      <Text style={styles.subtitle}>Password</Text>
      <TextInput
        style={styles.inputFull}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.subtitle}>Confirm Password</Text>
      <TextInput
        style={styles.inputFull}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {/* Terms Checkbox */}
      <View className="checkbox-row" style={styles.checkboxRow}>
        <Checkbox
          value={agree}
          onValueChange={setAgree}
          color={agree ? BASE_COLORS.TEXT_DARK : undefined}
        />
        <Text style={styles.checkboxLabel}>
          I agree to the terms and conditions
        </Text>
      </View>

      {/* Button */}
      <TouchableOpacity
        style={styles.knop}
        onPress={signUpWithEmail}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Creating account..." : "Create account"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  general: {
    flex: 1,
    backgroundColor: BASE_COLORS.LIGHT_BG,
  },
  title: {
    fontSize: 40,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
    textAlign: "left",
    marginBottom: 16,
    marginHorizontal: 10,
  },
  subtitle: {
    paddingTop: 20,
    fontSize: 18,
    fontFamily: FontFamilies.BODY,
    color: BASE_COLORS.ACCENT_PRIMARY,
    marginHorizontal: 10,
  },
  label: {
    position: "absolute",
    top: 0,
    fontSize: 18,
    fontFamily: FontFamilies.BODY,
    color: BASE_COLORS.ACCENT_PRIMARY,
  },
  row: {
    position: "relative",
    marginTop: 20,
    height: 80,
  },
  input: {
    position: "absolute",
    top: 25,
    borderWidth: 1,
    borderColor: BASE_COLORS.STONE_DARK,
    borderRadius: 6,
    height: 35,
    width: "45%",
    paddingHorizontal: 8,
    backgroundColor: BASE_COLORS.WHITE,
  },
  inputSmall: {
    position: "absolute",
    top: 25,
    borderWidth: 1,
    borderColor: BASE_COLORS.STONE_DARK,
    borderRadius: 6,
    height: 35,
    width: 80,
    paddingHorizontal: 8,
    backgroundColor: BASE_COLORS.WHITE,
  },
  inputFull: {
    borderWidth: 1,
    borderColor: BASE_COLORS.STONE_DARK,
    borderRadius: 6,
    height: 40,
    marginHorizontal: 10,
    paddingHorizontal: 8,
    backgroundColor: BASE_COLORS.WHITE,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginTop: 10,
    gap: 10,
  },
  checkboxLabel: {
    fontFamily: FontFamilies.BODY,
    fontSize: 16,
    color: BASE_COLORS.TEXT_BODY,
  },
  knop: {
    backgroundColor: BASE_COLORS.TEXT_DARK,
    height: 45,
    width: "60%",
    marginLeft: 10,
    marginTop: 25,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  buttonText: {
    color: BASE_COLORS.WHITE,
    fontFamily: FontFamilies.BODY_BOLD,
    fontSize: 16,
  },
});
