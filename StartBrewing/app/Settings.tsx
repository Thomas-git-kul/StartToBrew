import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { TouchableOpacity, Text, Alert, StyleSheet, View, TextInput } from "react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter } from "expo-router"; 

export default function Settings() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.general}>
      <ThemedText style={styles.title}>Settings</ThemedText>
      <ThemedText style={styles.title2}>Profile information</ThemedText>

      {/* Name row */}
      <View style={styles.row}>
        <ThemedText style={[styles.label, { left: 10 }]}>Lastname</ThemedText>
        <TextInput style={[styles.input, { left: 10 }]} />

        <ThemedText style={[styles.label, { left: "50%" }]}>Firstname</ThemedText>
        <TextInput style={[styles.input, { left: "50%" }]} />
      </View>

      {/* Birthday row */}
      <View style={styles.row}>
        <ThemedText style={[styles.label, { left: 10 }]}>Day</ThemedText>
        <TextInput style={[styles.inputSmall, { left: 10 }]} />

        <ThemedText style={[styles.label, { left: "25%" }]}>Month</ThemedText>
        <TextInput style={[styles.inputSmall, { left: "25%" }]} />

        <ThemedText style={[styles.label, { left: "50%" }]}>Year</ThemedText>
        <TextInput style={[styles.inputSmall, { left: "50%" }]} />
      </View>

      <ThemedText style={styles.title3}>Email</ThemedText>
      <TextInput style={styles.inputFull} />

      <ThemedText style={styles.title3}>Username</ThemedText>
      <TextInput style={styles.inputFull} />

      <TouchableOpacity
        style={styles.knop}
        onPress={() => Alert.alert("Button Pressed!")}>
        <Text style={styles.buttonText}>Change information</Text>
      </TouchableOpacity>

      <ThemedText style={styles.text}>Return to profile</ThemedText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  general: {
    flex: 1,
    backgroundColor: BASE_COLORS.WHITE,
  },
  title: {
    paddingTop: 25,
    fontSize: 50,
    fontWeight: "bold",
    marginHorizontal: 10,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
  },
  title2: {
    paddingTop: 20,
    fontSize: 25,
    fontWeight: "bold",
    marginHorizontal: 10,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
  },
  title3: {
    paddingTop: 20,
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 10,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.ACCENT_PRIMARY,
  },
  text: {
    paddingTop: 20,
    fontSize: 15,
    fontWeight: "bold",
    marginHorizontal: 10,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.ACCENT_PRIMARY,
    textDecorationLine: "underline",
  },
  label: {
    position: "absolute",
    top: 0,
    fontSize: 18,
    fontWeight: "bold",
    color: BASE_COLORS.ACCENT_PRIMARY,
  },
  input: {
    position: "absolute",
    top: 25,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    height: 35,
    width: "45%",
    paddingHorizontal: 8,
  },
  inputSmall: {
    position: "absolute",
    top: 25,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    height: 35,
    width: 80,
    paddingHorizontal: 8,
  },
  inputFull: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    height: 35,
    marginHorizontal: 10,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  knop: {
    backgroundColor: BASE_COLORS.ACCENT_PRIMARY,
    height: 40,
    width: "50%",
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  buttonText: {
    color: BASE_COLORS.WHITE,
    textAlign: "center",
    fontWeight: "bold",
  },
  row: {
    position: "relative",
    marginTop: 20, // ruimte zodat de absolute velden niet overlappen
    height: 80, // ruimte voor label + input
  },
});