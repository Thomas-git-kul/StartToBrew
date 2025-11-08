import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { TouchableOpacity, Text, StyleSheet, ScrollView, View } from "react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter } from "expo-router"; 
import { useFonts } from "@/hooks/use-fonts";
import BeerCard from '@/components/ui/IPAcomponent';
import Header from '@/components/header';

interface Beer {
  name: string;
  rating: number;
  reviews: number;
  image: any; // for require("...") format
  description: string;
}

export default function HomePage() {
  const router = useRouter();
  const fontsLoaded = useFonts();

  if (!fontsLoaded) return null;

  const beers: Beer[] = [
    {
      name: "IJ IPA",
      rating: 4.8,
      reviews: 256,
      image: require("@/assets/images/default-beer.png"),
      description: "An assertive bitterness that dominates the palate, with citrus and pine notes."
    },
    {
      name: "Voodoo Ranger",
      rating: 4.5,
      reviews: 98,
      image: require("@/assets/images/default-beer.png"),
      description: "A crystal-clear IPA dominated by citrus and resin hop profile.",
    },
    {
      name: "Two Hearted IPA",
      rating: 4.9,
      reviews: 322,
      image: require("@/assets/images/default-beer.png"),
      description: "A slightly hazy gold color with tropical flavors like mango and orange.",
    },
  ];

  return (
    <View className="flex-1">
      <Header
        title="StartToBrew"
      />

      <ScrollView style={{backgroundColor: BASE_COLORS.LIGHT_BG}}>
        <ThemedText style={styles.title2}>In progress</ThemedText>

        <ThemedText style={styles.title2}>Start a new brew</ThemedText>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/Recipes")}
        >
          <Text style={styles.buttonText}>Here</Text>
        </TouchableOpacity>

        <ThemedText style={styles.title2}>Popular recipes</ThemedText>

        <View style={{ paddingHorizontal: 10, paddingBottom: 20 }}>
          {beers.map((beer, index) => (
            <BeerCard key={index} {...beer} />
          ))}
        </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/Recipes")}
        activeOpacity={0.8}
      >
        {/* <Plus color="white" size={24} /> Optioneel icoon */}
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  general: {
    flex: 1,
  },
  title: {
    paddingTop: 25,
    fontSize: 50,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
  },
  title2: {
    paddingTop: 20,
    fontSize: 25,
    marginHorizontal: 10,
    fontFamily: FontFamilies.BODY,
    color: BASE_COLORS.TEXT_DARK,
  },
  buttonText: {
    color: BASE_COLORS.WHITE,
    textAlign: "center",
    fontFamily: FontFamilies.BODY_BOLD,
  },
  button: {
    backgroundColor: BASE_COLORS.ACCENT_PRIMARY,
    height: 30,
    width: "50%",
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: BASE_COLORS.ACCENT_PRIMARY,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5, // schaduw voor Android
    shadowColor: "#000", // schaduw voor iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabText: {
    color: BASE_COLORS.WHITE,
    fontSize: 32,
    marginTop: -3,
  },
});
