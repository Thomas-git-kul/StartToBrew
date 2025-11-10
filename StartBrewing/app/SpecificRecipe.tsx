import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet} from "react-native";
import { FAB } from "react-native-paper";
import { useRouter } from "expo-router";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/header";
import { useFonts } from "@/hooks/use-fonts";
import { Star } from "lucide-react-native";
import { ThemedText } from "@/components/themed-text";

export default function SpecificRecipe() {
  useFonts()

  const router = useRouter();

  const ingredients = [
    "6.5 lb (2.95 kg) Pilsner malt",
    "2.25 lb (1 kg) wheat malt",
    "23 oz (652 g) white unmalted wheat flakes",
    "5 ml lactic acid",
    "0.75 oz (21 g) Bravo pellets, 15% a.a. (60 min)",
    "5 oz (141 g) dextrose (30 min)",
    "Kettle Finings (30 min)",
    "0.12 oz (3 g) fresh ground coriander (5 min)",
    "0.34 oz (10 g) fresh ground bitter orange peel (5 min)",
    "1.0 oz (28 g) Citra pellets (knockout)",
    "1.0 oz (28 g) Centennial pellets (knockout)",
    "0.5 oz (14 g) Cascade pellets (knockout)",
    "Yeast nutrient (optional)",
    "Wyeast 3787 Trappist High Gravity ale yeast",
  ];

  return (
    <SafeAreaView
      className="flex-1"
      style={{backgroundColor: BASE_COLORS.LIGHT_BG}}
    >
      <Header
        title='IJ IPA'
        iconName="ArrowRight"
        onIconPress={() => router.push("/Recipes" as any)}
        actionTestID="cart-button"
      />
      <ScrollView className="flex-1 mx-3"
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        <View className="items-center mb-5">
          <Image
            source={require("@/assets/images/default-beer.png")}
            style={{
              width: "100%",
              borderRadius: 16,
            }}
            resizeMode="cover"
          />
        </View>

        {/* Rating */}
        <View className="flex-row items-center justify-center mb-4 gap-2">
          <Star 
            size={22} 
            color={BASE_COLORS.ACCENT_LIGHT} 
            fill={BASE_COLORS.ACCENT_LIGHT}/>
          <ThemedText type="subTitle">4.8/5 </ThemedText>
          <ThemedText type="smallText">(265 reviews)</ThemedText>
        </View>

        {/* Brew Info */}
        <ThemedText type="defaultText" className="mb-3">
          It features an assertive bitterness that dominates the palate,
          accompanied by strong aromatic notes that often recall citrus zest,
          pine, or tropical fruit ...
        </ThemedText>

        {/* Ingredients */}
        <ThemedText type="subTitle">Ingredients:</ThemedText>
        {ingredients.map((item, index) => (
          <View key={index} className="flex-row items-start mt-2 gap-3">
            <ThemedText type="defaultText">•</ThemedText>
            <ThemedText type="defaultText">{item}</ThemedText>
          </View>
        ))}
      </ScrollView>

      <View
        style={{
          position: "absolute",
          bottom: 10,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <FAB
          mode="elevated"
          label="Start Brewing"
          color={BASE_COLORS.WHITE}
          onPress={() => router.push("../progress")}
          style={{
            backgroundColor: BASE_COLORS.TEXT_DARK,
          }}
          theme={{
            fonts: {
              labelLarge: {
                fontSize: 14,
                fontFamily: FontFamilies.BODY,
              },
            },
          }}
        />
      </View>
    </SafeAreaView>
  );
};
