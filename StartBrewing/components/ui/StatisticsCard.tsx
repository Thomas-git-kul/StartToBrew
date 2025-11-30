import { Dimensions, Text, View } from 'react-native';
import { Card } from 'react-native-paper';
import { BASE_COLORS } from '@/constants/Colors';
import { FontFamilies } from '@/constants/Fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

type StatisticsCardProps = {
  title?: String;
  value?: any;
};

export default function StatisticsCard({ 
  title, value,  
}: StatisticsCardProps) {
  return (
    <Card
      mode="contained"
      style={{
        backgroundColor: "transparent",
        borderRadius: 12,
        paddingBlock: 8,
        paddingInline: 12,
        // shadowColor: BASE_COLORS.STONE700,
        // shadowOffset: { width: 0, height: 1 },
        // shadowOpacity: 0.07,
        flex: 1,
        justifyContent: 'center',
        // borderWidth: 1,
        // borderColor: BASE_COLORS.STONE300,
      }}
    >
      <View className="flex-col items-center">
        <Text
          numberOfLines={1}
          style={{
            fontFamily: FontFamilies.BODY,
            fontSize: Math.min(14 * scale, 26),
            color: BASE_COLORS.STONE900,
            marginBottom: 4
          }}
        >{title}</Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: FontFamilies.BODY_BOLD,
            fontSize: Math.min(22 * scale, 36),
            color: BASE_COLORS.STONE700,
          }}
        >{value}</Text>
      </View>
    </Card>
  );
};