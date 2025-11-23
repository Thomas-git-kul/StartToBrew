import { Appbar } from "react-native-paper";
import * as Icons from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

const iconMap: Record<string, LucideIcon> = {
  ShoppingCart: Icons.ShoppingCart,
  Calendar1: Icons.Calendar1,
  ArrowRight: Icons.ArrowRight,
  House: Icons.House,
  HeartPlus: Icons.HeartPlus,
  Heart: Icons.Heart,
};

interface HeaderBarProps {
  title: string;
  iconName?: keyof typeof iconMap;
  filled?: boolean;
  onIconPress?: () => void;
  actionTestID?: string;
}

export default function HeaderBar({
  title,
  iconName,
  onIconPress,
  actionTestID,
  filled=false,
}: HeaderBarProps) {
  const IconComponent = iconName ? iconMap[iconName] : undefined;

  return (
    <Appbar.Header style={{ backgroundColor: BASE_COLORS.LIGHT_BG }} mode="center-aligned">
      <Appbar.Content
        title={title}
        titleStyle={{ fontFamily: FontFamilies.BODY_BOLD, color: BASE_COLORS.TEXT_DARK }}
      />

      {IconComponent && onIconPress && (
        <Appbar.Action
          icon={() => (
            <IconComponent
              size={28}
              stroke={filled ? BASE_COLORS.ACCENT_PRIMARY : BASE_COLORS.TEXT_DARK}
              strokeWidth={2}
              fill={filled ? BASE_COLORS.ACCENT_PRIMARY : "transparent"}
            />
          )}
          onPress={onIconPress}
          testID={actionTestID}
        />
      )}
    </Appbar.Header>
  );
}
