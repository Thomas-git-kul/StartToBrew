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
  // We'll fetch the top-rated recipes from the DB instead of a hardcoded list

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // fetch top 5 recipes by rating (exclude null ratings)
        const { data, error } = await supabase
          .from("recipes")
          .select("recipe_slug,name,description,rating,review_count")
          .not('rating', 'is', null)
          .order('rating', { ascending: false, nulls: 'last' })
          .order('review_count', { ascending: false, nulls: 'last' })
          .limit(5);

        if (error) {
          console.warn("Supabase recipes(fetch) error:", error.message);
          if (mounted) setBeers([]);
          return;
        }

        const mapped: Beer[] = (data ?? []).map((row: any) => {
          const raw = row?.rating;
          let num = 0;
          if (raw !== undefined && raw !== null) {
            num = Number(raw);
            if (Number.isNaN(num)) num = parseFloat(String(raw)) || 0;
          }
          // clamp between 0 and 5
          num = Math.min(5, Math.max(0, num));
          const ratingRounded = Number(num.toFixed(2));

          return {
            recipe_slug: row.recipe_slug ?? undefined,
            name: row.name ?? "Untitled Recipe",
            rating: ratingRounded,
            reviews: typeof row.review_count === 'number' ? row.review_count : Number(row.review_count ?? 0),
            image: require("@/assets/images/default-beer.png"),
            description: row.description ?? "",
          };
        });

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
            {beers.map((beer, idx) => (
              <BeerCard
                key={idx}
                {...beer}
                onPress={() => router.push(({ pathname: "/SpecificRecipe", params: { slug: beer.recipe_slug } } as any))}
              />
            ))}
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
