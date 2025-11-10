import { ScrollView, View } from "react-native";
import { FAB } from "react-native-paper";

import { useRouter } from "expo-router"; 
import { useFonts } from "@/hooks/use-fonts";
import BeerCard from '@/components/ui/RecipeCard';
import Header from '@/components/header';
import { ThemedText } from "@/components/themed-text";
import { BASE_COLORS } from "@/constants/Colors";

import { Plus } from "lucide-react-native";

interface Beer {
  name: string;
  rating: number;
  reviews: number;
  image: any; // for require("...") format
  description: string;
}

export default function HomePage() {
  const router = useRouter();

  useFonts();

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
          <Plus size={props.size} color={props.color} />
        )}
        testID="fab"
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
};
