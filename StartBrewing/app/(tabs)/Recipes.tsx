import React from "react";
import { View, ScrollView } from "react-native";
import { Searchbar} from "react-native-paper";
import { Search, X } from "lucide-react-native";
import BeerCard from '@/components/ui/RecipeCard';
import { BASE_COLORS } from "@/constants/Colors";
import { useRouter } from "expo-router";
import Header from '@/components/header';
import { useFonts } from "@/hooks/use-fonts";

interface Beer {
  name: string;
  rating: number;
  reviews: number;
  image: string;
  description: string;
}

export default function Recipes() {
  useFonts();

  const [searchQuery, setSearchQuery] = React.useState("");

  // helper to check whether an item matches the query
  const filterMatches = (item: Beer, q: string) => {
    if (!q) return true;
    const lower = q.toLowerCase();
    return (
      item.name.toLowerCase().includes(lower)
    );
  };

  const router = useRouter();

  const recipes: Beer[] = [
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
    <View className="flex-1"
      style={{
          backgroundColor: BASE_COLORS.LIGHT_BG,
      }}
    >
      <Header
        title="Recipes"
      />

      {/* Searchbar */}
      <Searchbar
        placeholder="Search"
        value={searchQuery}
        onChangeText={setSearchQuery}
        inputStyle={{ color: BASE_COLORS.STONE700 }}
        icon={() => (
          <Search size={20} color={BASE_COLORS.STONE300} />
        )}
          clearIcon={searchQuery ? () => (
            <X size={18} color={BASE_COLORS.STONE500} />
          ) : undefined}
          onClearIconPress={() => setSearchQuery("")}
        style={{
          backgroundColor: BASE_COLORS.WHITE,
          borderColor: BASE_COLORS.STONE300,
          borderWidth: 1,
          marginBottom: 15
        }}
      />

      {/* Recipes */}
      <ScrollView>
      {!searchQuery ? ( 
        <View>
          {recipes.map((beer, index) => (
            <BeerCard
              key={index} 
              {...beer}
              onPress={() => router.push("/SpecificRecipe")}
            />
          ))}
        </View>
      ) : (
        <View>
          {recipes
            .filter((b) => filterMatches(b, searchQuery))
            .map((beer, index) => (
              <BeerCard key={index} {...beer} />
            ))}
        </View>
      )}
      </ScrollView>
    </View>
  );
}
