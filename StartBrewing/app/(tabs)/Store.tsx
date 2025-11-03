import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { TextInput, StyleSheet, View } from "react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

export default function StorePage() {
  return (
    <SafeAreaView style={styles.general}>
      <ThemedText style={styles.title}>Store</ThemedText>

      {/* Eerste rij */}
      <View style={styles.row}>
        <TextInput style={[styles.input, { left: 10 }]} />
        <ThemedText style={[styles.label, { left: 10 }]}>Airlock</ThemedText>

        <TextInput style={[styles.input, { left: "50%" }]} />
        <ThemedText style={[styles.label, { left: "50%" }]}>Starter Kit IPA</ThemedText>
      </View>

      <View style={styles.row}>
        <TextInput style={[styles.input, { left: 10 }]} />
        <ThemedText style={[styles.label, { left: 10 }]}>Superior starter kit </ThemedText>

        <TextInput style={[styles.input, { left: "50%" }]} />
        <ThemedText style={[styles.label, { left: "50%" }]}>Tap PVC with back nut </ThemedText>
      </View>
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
    //fontWeight: "bold",
    marginHorizontal: 10,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
  },
  label: {
    position: "absolute",
    top: 65, 
    fontSize: 14,
    marginTop: 55,
    //fontWeight: "bold",
    fontFamily: FontFamilies.BODY,
    color: BASE_COLORS.ACCENT_PRIMARY,
  },
  input: {
    position: "absolute",
    top: 20, 
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    height: 100,
    width: "45%",
    paddingHorizontal: 8,
  },
  row: {
    position: "relative",
    marginTop: 20,
    height: 100,
  },
});
