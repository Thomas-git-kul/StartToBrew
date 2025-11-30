import { Dimensions, Text, Pressable, View } from "react-native";
import { ProgressBar, TouchableRipple, Card } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { Trash, Trash2 } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

interface ProgressCardProps {
  title: string;
  progress: number;
  onPress?: () => void;
  onDelete?: () => void;
}

export default function ProgressCard({ title, progress, onPress, onDelete }: ProgressCardProps) {
const percentage = Math.round(progress * 100);


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
        shadowColor: BASE_COLORS.STONE700,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
      }}
    >
      <View className="flex-row items-center justify-between pl-4 pr-2">
        <Text 
          numberOfLines={1}
          style={{
            fontSize: Math.min(16 * scale, 24),
            fontFamily: FontFamilies.BODY,
            color: BASE_COLORS.STONE700,
            marginVertical: 8,
            marginRight: 16,
          }}
        >{title}</Text>
        <Pressable onPress={onDelete} accessibilityLabel="delete-brew">
          <Trash2 color={BASE_COLORS.STONE300} size={20} />
        </Pressable>
      </View>
      <View className="px-4 pb-5">
        <Text 
          style={{
            fontSize: Math.min(14 * scale, 18),
            fontFamily: FontFamilies.BODY_BOLD,
            color: BASE_COLORS.ACCENT_PRIMARY,
          }}
        >{percentage}%</Text>
        <ProgressBar
            progress={progress}
            color={BASE_COLORS.ACCENT_PRIMARY}
            fillStyle={{
              borderRadius: 6,
            }}
            style={{
              height: Math.min(10 * scale, 12),
              borderRadius: 6,
              backgroundColor: BASE_COLORS.STONE100
            }}
        />
      </View>
    </Card>
    </TouchableRipple>
  );
}
