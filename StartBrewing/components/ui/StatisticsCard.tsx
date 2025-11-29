import { Dimensions, Text } from 'react-native';
import { Card } from 'react-native-paper';
import { BASE_COLORS } from '@/constants/Colors';
import { FontFamilies } from '@/constants/Fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

type StatisticsCardProps = {
  title: String;
  value: any;
  hint: String;
};

export default function OrderCard({ 
  title, value, hint,  
}: StatisticsCardProps) {
  const CARD_HEIGHT = Math.min(110 * scale, 140);

  return (
    <Card
      style={{
        backgroundColor: BASE_COLORS.WHITE,
        borderRadius: 12,
        padding: 12,
        shadowColor: BASE_COLORS.STONE700,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        flex: 1,
        minWidth: 0,
        height: CARD_HEIGHT,
        justifyContent: 'center',
        borderWidth: 1,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          fontFamily: FontFamilies.BODY,
          fontSize: Math.min(14 * scale, 18),
          color: BASE_COLORS.STONE950,
          marginBottom: 4
        }}
      >{title}</Text>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: FontFamilies.BODY_BOLD,
          fontSize: Math.min(22 * scale, 30),
          color: BASE_COLORS.ACCENT_PRIMARY,
          marginBottom: 4
        }}
      >{value}</Text>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: FontFamilies.HEADING,
          fontSize: Math.min(12 * scale, 18),
          color: BASE_COLORS.STONE600,
        }}
      >{hint}</Text>
    </Card>
  );
};