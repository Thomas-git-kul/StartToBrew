import React from "react";
import { View, Text } from "react-native";
import { Card } from "react-native-paper";
import { Star } from "lucide-react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { ThemedText } from "../themed-text";

type Review = {
  rating: number;
  review_text: string | null;
  created_at?: string | null;
  username?: string | null;
};

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const d = review.created_at ? new Date(review.created_at) : null;
  const dateStr = d ? d.toLocaleDateString() : null;

  const formatRating = (r: number) => {
    if (r == null || Number.isNaN(r)) return "";
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  };

  return (
    <View style={{ marginBottom: 10 }}>
      <Card
        style={{
          borderRadius: 12,
          backgroundColor: BASE_COLORS.WHITE,
          padding: 12,
          shadowColor: BASE_COLORS.STONE700,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Star
              size={16}
              color={BASE_COLORS.ACCENT_LIGHT}
              fill={BASE_COLORS.ACCENT_LIGHT}
              style={{ marginRight: 8 }}
            />
            <Text style={{
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.STONE700,
              fontSize: 14,
            }}>
              {formatRating(review.rating)}/5
            </Text>
            {review.username && (
              <Text style={{
                fontFamily: FontFamilies.BODY_LIGHT,
                color: BASE_COLORS.STONE700,
                fontSize: 12,
                marginLeft: 8,
              }}>{`@${review.username}`}</Text>
            )}
          </View>
          {dateStr && (
            <Text style={{
              fontFamily: FontFamilies.BODY_LIGHT,
              color: BASE_COLORS.STONE500,
              fontSize: 12,
              marginLeft: 8,
            }}>{dateStr}</Text>
          )}
        </View>

        {review.review_text ? (
          <ThemedText type="defaultText">{review.review_text}</ThemedText>
        ) : (
          <ThemedText type="defaultText">No comment</ThemedText>
        )}
      </Card>
    </View>
  );
};

export default ReviewCard;
