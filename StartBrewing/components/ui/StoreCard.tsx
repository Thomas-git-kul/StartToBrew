import { Dimensions, View, Image, TouchableOpacity, Text } from "react-native";
import { Card } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

const CARD_WIDTH = (Dimensions.get("window").width - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

type StoreCardProps = {
  image: any;
  title: string;
  price: string;
  onPress?: () => void;
};

export default function StoreCard({ image, title, price, onPress }: StoreCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Card 
        style={{ 
          width: Math.min(CARD_WIDTH, 200),
          height: Math.min(CARD_HEIGHT, 290),
          marginBottom: 18,
          backgroundColor: BASE_COLORS.WHITE,
          borderRadius: 16,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View style={{ flexGrow: 1 }} className="flex-col m-3">
          {/* Image */}
          <Image
            source={typeof image === "string" ? { uri: image } : image}
            style={{
              width: "100%",
              height: Math.min(CARD_HEIGHT * 0.5, 160),
              borderRadius: 16,
              marginBottom: 3,
              borderColor: BASE_COLORS.STONE100,
              borderWidth: 1 
            }}
            resizeMode="cover"
          />

          {/* Title */}
          <Text
            style={{
              fontSize: Math.min(17 * scale, 20),
              fontFamily: FontFamilies.BODY_BOLD,
              color: BASE_COLORS.ACCENT_PRIMARY,
            }}
            numberOfLines={2}
          >{title}</Text>

          {/* Price */}
          <Text
            style={{
              fontSize: Math.min(15 * scale, 18),
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.STONE600
            }}
          >{price}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
