import React, { useState } from "react";
import { Image, View, Dimensions, Pressable, Text } from "react-native";
import { Card, TouchableRipple } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { Star, Heart, HeartPlus } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

const IMAGE_WIDTH = Math.min(120, SCREEN_WIDTH * 0.20);
const IMAGE_HEIGHT = IMAGE_WIDTH * 1.5;

interface BeerCardProps {
  image: any; // require or uri
  name: string;
  rating: number;
  reviews: number;
  description: string;
  onPress?: () => void;
  onToggleFavorite?: (isFavorite: boolean) => void;
}

const BeerCard: React.FC<BeerCardProps> = ({
  image,
  name,
  rating,
  reviews,
  description,
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
    <TouchableRipple
      onPress={onPress}
      rippleColor="rgba(0,0,0,0.08)"
      className="mb-3 rounded-xl overflow-hidden"
    >
      <Card
        mode="elevated"
        style={{ 
          borderRadius: 12,
          backgroundColor: BASE_COLORS.WHITE,
          marginBlock: 3,
          marginInline: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
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
                borderRadius: 12,
              }}
              resizeMode="cover"
            />
          </View>

          {/* Text container */}
          <View className="flex-1 mx-3 my-2">
            {/* Title + Favorite button row */}
            <View className="flex-row justify-between items-start">
              <Text
                style={{
                  fontSize: Math.min(12 * scale, 18),
                  fontFamily: FontFamilies.BODY,
                  color: BASE_COLORS.STONE950,
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
                  <HeartPlus
                    size={20}
                    stroke={BASE_COLORS.STONE300}
                  />
                )}
              </Pressable>
            </View>

            <View className="flex-row my-1">
              <Star 
                color={BASE_COLORS.ACCENT_LIGHT}
                fill={BASE_COLORS.ACCENT_LIGHT}
                size={14}
                style={{
                  marginRight: 5
                }}
              />
              <Text
                style={{
                  fontSize: Math.min(10 * scale, 14),
                  fontFamily: FontFamilies.BODY_LIGHT,
                  color: BASE_COLORS.STONE500,
                }}
              >{`${Number(rating).toFixed(2)}/5 rating (${reviews} reviews)`}</Text>
            </View>

            <Text 
              numberOfLines={3}
              style={{
                fontSize: Math.min(12 * scale, 18),
                fontFamily: FontFamilies.HEADING,
                color: BASE_COLORS.STONE700,
              }}
            >{description}</Text>
          </View>
        </View>
      </Card>
    </TouchableRipple>
  );
};

export default BeerCard;
