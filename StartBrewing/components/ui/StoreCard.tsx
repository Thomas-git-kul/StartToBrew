import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

type StoreCardProps = {
  image: any;
  title: string;
  price: string;
  onPress?: () => void;
};

export default function StoreCard({ image, title, price, onPress }: StoreCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card
        className="rounded-lg shadow-md"
        style={{
          backgroundColor: BASE_COLORS.WHITE,
          borderColor: BASE_COLORS.WHITE,
          borderWidth: 1,
          marginBottom: 20,
          minHeight: 260,
          overflow: 'hidden',
          justifyContent: 'space-between',
        }}
      >
        <View style={styles.imageContainer}>
          <Image
            source={typeof image === 'string' ? { uri: image } : image}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View className="p-3">
          <Text
            className="text-xl"
            style={{
              color: BASE_COLORS.ACCENT_PRIMARY,
              fontFamily: FontFamilies.BODY_BOLD,
            }}
          >
            {title}
          </Text>
          <Text
            className="text-base mt-5"
            style={{
              color: BASE_COLORS.STONE400,
              fontFamily: FontFamilies.BODY,
            }}
          >
            {price}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BASE_COLORS.WHITE,
  },
  image: {
    width: '80%',
    height: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
});
