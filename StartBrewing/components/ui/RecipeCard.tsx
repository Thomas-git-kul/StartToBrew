import React, { useState } from "react";
import { Image, View, Dimensions, Pressable } from "react-native";
import { Card, TouchableRipple } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { ThemedText } from "../themed-text";
import { Star, Heart, HeartPlus } from "lucide-react-native";

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

  const { width: screenWidth } = Dimensions.get("window");
  const imageWidth = Math.min(120, screenWidth * 0.20); // max 120px or 25% of screen
  const imageHeight = imageWidth * 1.5;

  return (
    <TouchableRipple
      onPress={onPress}
      rippleColor="rgba(0,0,0,0.08)"
      className="mb-3 rounded-xl overflow-hidden"
    >
      <Card
        mode="elevated"
        elevation={1}
        style={{ 
          borderRadius: 12,
          backgroundColor: BASE_COLORS.WHITE,
          marginBlock: 3,
          marginInline: 2
        }}
      >
        <View className="flex-row h-fit">
          {/* Image */}
          <View>
            <Image
              source={image}
              style={{
                width: imageWidth,
                height: imageHeight,
                borderRadius: 12,
              }}
              resizeMode="cover"
            />
          </View>

          {/* Text container */}
          <View className="flex-1 mx-3 my-2">
            {/* Title + Favorite button row */}
            <View className="flex-row justify-between items-start">
              <ThemedText type="subTitle">{name}</ThemedText>

              <Pressable
                onPress={handleToggleFavorite}
                hitSlop={8}
                accessibilityLabel={`favorite-${name}`}
              >
                {isFavorite ? (
                  <Heart
                    size={20}
                    stroke={BASE_COLORS.ACCENT_PRIMARY}
                    fill={BASE_COLORS.ACCENT_PRIMARY}  // ✅ fills the heart
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
              <ThemedText type='smallText'>
                {rating}/5 rating ({reviews} reviews)
              </ThemedText>
            </View>

            <ThemedText type='defaultText' numberOfLines={3}>
              {description}
            </ThemedText>
          </View>
        </View>
      </Card>
    </TouchableRipple>
  );
};

export default BeerCard;
