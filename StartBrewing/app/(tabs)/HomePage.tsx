import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { TouchableOpacity, Text, StyleSheet, ScrollView, View } from "react-native";
import { FAB } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter } from "expo-router"; 
import { useFonts } from "@/hooks/use-fonts";
import BeerCard from '@/components/ui/IPAcomponent';
import Header from '@/components/header';
import { MaterialIcons } from "@expo/vector-icons";

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
        <ThemedText type="title">In progress</ThemedText>
        <ThemedText type="title">Popular recipes</ThemedText>

        <View>
          {beers.map((beer, index) => (
            <BeerCard key={index} {...beer} />
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon={(props) => (
          <MaterialIcons name="add" size={props.size} color={props.color} />
        )}
        style={{
          position: 'absolute',
          right: 10,
          bottom: 25,
          backgroundColor: BASE_COLORS.TEXT_DARK,
        }}
        color={BASE_COLORS.LIGHT_BG}
        onPress={() => router.push('/Recipes')}
        mode="elevated"
        size="medium"
      />
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
  right: 20,
  bottom: 75, // 5px above bottom tab bar ( ~70px tall )
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: BASE_COLORS.TEXT_DARK,
  justifyContent: "center",
  alignItems: "center",

  // Shadow / elevation
  elevation: 5,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
},
fabText: {
  fontSize: 32,
  color: BASE_COLORS.LIGHT_BG,
},
});
