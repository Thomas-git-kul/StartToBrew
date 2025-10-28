import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { TouchableOpacity, Text, Alert, StyleSheet } from "react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter } from "expo-router"; 

export default function HomePage() {
  const router = useRouter();
  return (
    <SafeAreaView style={[styles.general]}>
      <ThemedText style={styles.title}>StartToBrew</ThemedText>
      <ThemedText style={styles.title2}>In progress</ThemedText>
      <ThemedText style={styles.title2}>Start a new brew</ThemedText>
      <TouchableOpacity
          style={styles.knop}
          onPress={() => router.push("/Recipes")}      >
      <Text style={styles.buttonText}>Here</Text>
</TouchableOpacity>

      <ThemedText style={styles.title2}>Popular recipes</ThemedText>
    </SafeAreaView>
    
  );
};

const styles = StyleSheet.create({
  general: {
    flex: 1,
    backgroundColor: BASE_COLORS.WHITE,
  },
  title: {
    paddingTop: 25,
    fontSize: 50,
    fontWeight: 'bold',
    marginHorizontal: 10,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
  },
  title2: {
    paddingTop: 20,
    fontSize: 25,
    fontWeight: 'bold',
    marginHorizontal: 10,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
  },
  buttonText: {
  color: BASE_COLORS.WHITE,
  textAlign: "center", // tekst horizontaal centreren
  fontWeight: "bold",
},

knop: {
  backgroundColor: BASE_COLORS.ACCENT_PRIMARY,
  height: 30, 
  width: "50%", 
  marginLeft: 10,
  justifyContent: "center", 
  alignItems: "center", 
  borderRadius: 6, 
},

});
