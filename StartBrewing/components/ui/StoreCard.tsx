import { View, Image, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

type StoreCardProps = {
  image: any;
  title: string;
  price: string;
};

export default function StoreCard({ image, title, price }: StoreCardProps) {
  return (
    <Card className="rounded-lg shadow-md"
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
      {/* Image container with centered image */}
      <View style={styles.imageContainer}>
        <Image
          source={typeof image === 'string' ? { uri: image } : image}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Content */}
      <View className="p-3">
        <Text className="text-xl"
          style={{
            color: BASE_COLORS.ACCENT_PRIMARY,
            fontFamily: FontFamilies.BODY_BOLD
          }}
        >
          {title}
        </Text>
        <Text className="text-base mt-5"
          style={{
            color: BASE_COLORS.STONE400,
            fontFamily: FontFamilies.BODY
          }}
        >
          {price}
        </Text>
      </View>
    </Card>
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
