import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import Checkbox from "expo-checkbox";

export default function Registration() {
  const [agree, setAgree] = useState(false);

  return (
    <SafeAreaView style={styles.general}>
      <Text style={styles.title}>No account yet? Register here!</Text>

      {/* Name Row */}
      <View style={styles.row}>
        <Text style={[styles.label, { left: 10 }]}>Lastname</Text>
        <TextInput style={[styles.input, { left: 10 }]} />

        <Text style={[styles.label, { left: "50%" }]}>Firstname</Text>
        <TextInput style={[styles.input, { left: "50%" }]} />
      </View>

      {/* Birthday */}
      <View style={styles.row}>
        <Text style={[styles.label, { left: 10 }]}>Day</Text>
        <TextInput style={[styles.inputSmall, { left: 10 }]} />

        <Text style={[styles.label, { left: "33%" }]}>Month</Text>
        <TextInput style={[styles.inputSmall, { left: "33%" }]} />

        <Text style={[styles.label, { left: "66%" }]}>Year</Text>
        <TextInput style={[styles.inputSmall, { left: "66%" }]} />
      </View>

      {/* Email */}
      <Text style={styles.subtitle}>Email</Text>
      <TextInput style={styles.inputFull} />

      {/* Username */}
      <Text style={styles.subtitle}>Username</Text>
      <TextInput style={styles.inputFull} />

      {/* Password */}
      <Text style={styles.subtitle}>Password</Text>
      <TextInput style={styles.inputFull} secureTextEntry />

      <Text style={styles.subtitle}>Confirm Password</Text>
      <TextInput style={styles.inputFull} secureTextEntry />

      {/* Terms Checkbox */}
      <View style={styles.checkboxRow}>
        <Checkbox value={agree} onValueChange={setAgree} color={agree ? BASE_COLORS.TEXT_DARK : undefined} />
        <Text style={styles.checkboxLabel}>I agree to the terms and conditions</Text>
      </View>

      {/* Button */}
      <TouchableOpacity style={styles.knop}>
        <Text style={styles.buttonText}>Create account</Text>
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
