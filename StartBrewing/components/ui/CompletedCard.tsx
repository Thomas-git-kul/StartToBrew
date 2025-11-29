import { Dimensions, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Card } from 'react-native-paper';
import { BASE_COLORS } from '@/constants/Colors';
import { FontFamilies } from '@/constants/Fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

type CompletedCardProps = {
  title: string;
  date?: string;
  image?: any;
  onPress?: () => void;
};

export default function CompletedCard({ title, date, image, onPress }: CompletedCardProps) {
  return (
    <Card
      mode="contained"
      onPress={onPress}
      style={{
        backgroundColor: BASE_COLORS.WHITE,
        borderRadius: 12,
        overflow: "hidden",
        paddingBottom: 6,
        // shadowColor: BASE_COLORS.STONE700,
        // shadowOffset: { width: 0, height: 1 },
        // shadowOpacity: 0.07,
        borderWidth: 1,
        borderColor: BASE_COLORS.STONE300,
      }}
    >
      <View style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        {image && (
          <Image
            source={image}
            style={{
              width: "100%",
              aspectRatio: 1,
            }}
          />
        )}
        {date ? (
          <Text 
            numberOfLines={1} 
            style={{
              fontFamily: FontFamilies.BODY_LIGHT,
              fontSize: Math.min(10 * scale, 26),
              color: BASE_COLORS.STONE600,
              paddingInline: 8,
              marginTop: 4,
              marginBottom: -4,
              alignSelf: 'flex-start'
            }}
          >{date}</Text>
        ) : null}
        <Text
          numberOfLines={2}
          style={{
            fontFamily: FontFamilies.BODY,
            fontSize: Math.min(13 * scale, 20),
            color: BASE_COLORS.STONE600,
            paddingInline: 8,
          }}
        >{title}</Text>
      </View>
    </Card>
  );
};