import { useState, useEffect } from "react";
import { ScrollView, View, ActivityIndicator } from "react-native";
import { FAB } from "react-native-paper";
import { useRouter } from "expo-router"; 
import { useFonts } from "@/hooks/use-fonts";
import BeerCard from '@/components/ui/RecipeCard';
import Header from '@/components/header';
import { ThemedText } from "@/components/themed-text";
import { BASE_COLORS } from "@/constants/Colors";
import { Plus } from "lucide-react-native";
import ProgressCard from "@/components/ui/ProgressCard";
import { supabase } from "../../supabase";

interface Beer {
  recipe_slug?: string;
  name: string;
  rating: number;
  reviews: number;
  image: any;
  description: string;
}

export default function HomePage() {
  useFonts();

  const router = useRouter();
  const [beers, setBeers] = useState<Beer[]>([]);
  const [loading, setLoading] = useState(true);

  // names to show in the popular section (in this order)
  const popularNames = [
    "CalIPA - Citra Rye",
    "City of the Sun IPA",
    "Face of Boe - APA #4",
    "West Coast IPA 2023 v2",
    "Black Nitro IPA",
  ];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("recipes")
          .select("recipe_slug,name,description,rating")
          .limit(50);

        if (error) {
          console.warn("Supabase recipes(fetch) error:", error.message);
          if (mounted) setBeers([]);
          return;
        }

        const mapped: Beer[] = (data ?? []).map((row: any) => ({
          recipe_slug: row.recipe_slug ?? undefined,
          name: row.name ?? "Untitled Recipe",
          rating: typeof row.rating === "number" ? row.rating : Number(row.rating ?? 0),
          reviews: 0,
          image: require("@/assets/images/default-beer.png"),
          description: row.description ?? "",
        }));

        if (mounted) setBeers(mapped);
      } catch (e: any) {
        console.warn("Supabase fetch exception:", e?.message ?? e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View className="flex-1">
      <Header
        title="StartToBrew"
      />

      <ScrollView style={{backgroundColor: BASE_COLORS.LIGHT_BG}}>
        <ThemedText type="title">In progress</ThemedText>
        <View>
          <ProgressCard title="Hazy IPA" progress={0.3} onPress={() => router.push("/progress")}/>
          <ProgressCard title="Belgian Tripel" progress={0.65} onPress={() => router.push("/progress")}/>
          <ProgressCard title="American Pale Ale" progress={0.85} onPress={() => router.push("/progress")}/>
        </View>

        <ThemedText type="title">Popular recipes</ThemedText>
        {loading ? (
          <View style={{ height: 200, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        ) : (
          <View>
            {popularNames.map((popularName, idx) => {
              const found = beers.find((b) => b.name === popularName);
              const beer = found ?? {
                recipe_slug: undefined,
                name: popularName,
                description: "",
                rating: 0,
                reviews: 0,
                image: require("@/assets/images/default-beer.png"),
              };

              return (
                <BeerCard
                  key={idx}
                  {...beer}
                  onPress={() =>
                    router.push(({ pathname: "/SpecificRecipe", params: { slug: beer.recipe_slug } } as any))
                  }
                />
              );
            })}
          </View>
        )}
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
          borderRadius: 20
        }}
        color={BASE_COLORS.LIGHT_BG}
        onPress={() => router.push('/Recipes')}
        mode="elevated"
        size="medium"
      />
    </View>
  );
};
