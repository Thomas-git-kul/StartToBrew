import { StyleSheet, Text, type TextProps, Dimensions } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'defaultText' | 'title' | 'subTitle' | 'accentPrimary' | 'accentDark' | 'numbers' | 'titleBlack';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'defaultText',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'defaultText' ? styles.defaultText : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'subTitle' ? styles.subTitle : undefined,
        type === 'accentPrimary' ? styles.accentPrimary : undefined,
        type === 'accentDark' ? styles.accentDark : undefined,
        type === 'numbers' ? styles.numbers : undefined,
        type === 'titleBlack' ? styles.titleBlack : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: Math.min(18 * scale, 22),
    fontFamily: FontFamilies.BODY_BOLD,
    color: BASE_COLORS.ACCENT_PRIMARY,
  },
  titleBlack: {
    fontSize: Math.min(18 * scale, 22),
    fontFamily: FontFamilies.BODY_BOLD,
    color: BASE_COLORS.STONE600
  },
  subTitle: {
    fontSize: Math.min(12 * scale, 16), 
    fontFamily: FontFamilies.BODY,
    color: BASE_COLORS.STONE950,
  },
  accentPrimary: {
    fontSize: Math.min(10 * scale, 14), 
    fontFamily: FontFamilies.BODY_LIGHT,
    color: BASE_COLORS.STONE500,
  },
  accentDark: {
    fontSize: Math.min(17 * scale, 22),
    fontFamily: FontFamilies.BODY_BLACK,
    color: BASE_COLORS.TEXT_DARK,
  },
  numbers: {
    fontSize: Math.min(15 * scale, 18),
    fontFamily: FontFamilies.BODY,
    color: BASE_COLORS.STONE600
  },
    defaultText: {
    fontSize: Math.min(17 * scale, 20),
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.STONE700,
  },
});
