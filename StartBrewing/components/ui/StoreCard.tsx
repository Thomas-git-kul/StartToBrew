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
          width: "100%",
          height: Math.min(CARD_HEIGHT, 290),
          backgroundColor: BASE_COLORS.WHITE,
          borderRadius: 12,
          overflow: "hidden",
          shadowColor: BASE_COLORS.STONE700,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.07,
        }}
      >
        <View style={{ flex: 1, paddingBottom: 48, justifyContent: "space-between" }}>
          <Image
            source={typeof image === "string" ? { uri: image } : image}
            style={{
              width: "100%",
              height: Math.min(CARD_HEIGHT * 0.5, 160),
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              marginBottom: 3,
              borderBottomWidth: 1,
              borderColor: BASE_COLORS.STONE200
            }}
            resizeMode="cover"
          />

          <View style={{height: Math.min(CARD_HEIGHT * 0.3, 160),}}>
            <Text
              style={{
                paddingHorizontal: 12,
                fontSize: Math.min(14 * scale, 20),
                fontFamily: FontFamilies.BODY,
                color: BASE_COLORS.STONE700,
              }}
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>

          <Text
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              paddingHorizontal: 12,
              marginBottom: 12,
              fontSize: Math.min(15 * scale, 18),
              fontFamily: FontFamilies.BODY_BOLD,
              color: BASE_COLORS.ACCENT_PRIMARY,
            }}
          >{price}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
