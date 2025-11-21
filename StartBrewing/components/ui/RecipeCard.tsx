import React, { useState } from "react";
import { Image, View, Dimensions, Pressable, Text } from "react-native";
import { Card, Chip } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { Star, Heart, HeartPlus } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_SCREEN_WIDTH = 375;
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

const IMAGE_WIDTH = Math.min(120, SCREEN_WIDTH * 0.23);
const IMAGE_HEIGHT = IMAGE_WIDTH * 1.3;

interface BeerCardProps {
  recipe_slug: string;
  name: string;
  rating: number;
  reviews: number;
  image: any;
  description: string | null;
  batch_size_l?: number | null;
  abv_target?: number | null;
  ibu_target?: number | null;
  srm_target?: number | null;
  difficulty?: number | null;
  haze_level?: number | null;
  style: string | null;
  onPress: () => void;
  onToggleFavorite?: (isFavorite: boolean) => void;
}

const BeerCard: React.FC<BeerCardProps> = ({
  image,
  name,
  rating,
  reviews,
  style,
  onPress,
  onToggleFavorite,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const handleToggleFavorite = () => {
    const newState = !isFavorite;
    setIsFavorite(newState);
    onToggleFavorite?.(newState);
  };

  return (
    <Card
      mode="elevated"
      style={{
        borderRadius: 12,
        backgroundColor: BASE_COLORS.WHITE,
        marginBlock: 3,
        marginInline: 2,
        shadowColor: BASE_COLORS.STONE700,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
      }}
    >
      <View className="flex-row h-fit">
        {/* Image */}
        <View>
          <Image
            source={image}
            style={{
              width: Math.min(IMAGE_WIDTH, 150),
              height: Math.min(IMAGE_HEIGHT, 225),
              borderBottomLeftRadius: 12,
              borderTopLeftRadius: 12,
            }}
            resizeMode="cover"
          />
        </View>

        {/* Text container */}
        <View className="flex-1 mx-3 my-2">
          {/* Title + Favorite button row */}
          <View className="flex-row justify-between items-start">
            <Text
              numberOfLines={1}
              style={{
                fontSize: Math.min(13 * scale, 18),
                fontFamily: FontFamilies.BODY,
                color: BASE_COLORS.STONE950,
                marginRight: 10
              }}
            >{name}</Text>
            <Pressable
              onPress={handleToggleFavorite}
              hitSlop={8}
              accessibilityLabel={`favorite-${name}`}
            >
              {isFavorite ? (
                <Heart
                  size={20}
                  stroke={BASE_COLORS.ACCENT_PRIMARY}
                  fill={BASE_COLORS.ACCENT_PRIMARY}
                />
              ) : (
                <HeartPlus size={20} stroke={BASE_COLORS.STONE300} />
              )}
            </Pressable>
          </View>

          <View className="flex-row my-1 items-center">
            <Star
              color={BASE_COLORS.ACCENT_LIGHT}
              fill={BASE_COLORS.ACCENT_LIGHT}
              size={Math.min(15 * scale, 22)}
              style={{
                marginRight: 5,
              }}
            />
            <Text
              style={{
                fontSize: Math.min(12 * scale, 14),
                fontFamily: FontFamilies.BODY_LIGHT,
                color: BASE_COLORS.STONE500,
              }}
            >
              {rating.toFixed(2)}/5 rating ({reviews} reviews)
            </Text>
          </View>

          {(style ? style.split(",") : ["Unknown Style"]).map((label, index) => (
          <View>
            <Chip
              key={index}
              mode="flat"
              compact
              style={{
                backgroundColor: BASE_COLORS.STONE100,
                borderWidth: 0,
                marginRight: 8,
                marginTop: 8,
                alignSelf: "flex-start",
                justifyContent: "center",
              }}
              textStyle={{
                fontFamily: FontFamilies.BODY,
                fontSize: Math.min(10 * scale, 18),
                color: BASE_COLORS.TEXT_DARK,
              }}
            >{label.trim()}</Chip>
          </View>
          ))}
        </View>
      </View>
    </Card>
  );
};

export default BeerCard;
