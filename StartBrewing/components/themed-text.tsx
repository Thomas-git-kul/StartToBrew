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
  type?: 'defaultText' | 'title' | 'subTitle' | 'inputSug' | 'accentDark' | 'numbers' | 'titleBlack' | 'tips';
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
        type === 'inputSug' ? styles.inputSug : undefined,
        type === 'accentDark' ? styles.accentDark : undefined,
        type === 'numbers' ? styles.numbers : undefined,
        type === 'titleBlack' ? styles.titleBlack : undefined,
        type === 'tips' ? styles.tips : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: Math.min(18 * scale, 26),
    fontFamily: FontFamilies.BODY_BOLD,
    color: BASE_COLORS.ACCENT_PRIMARY,
  },
  titleBlack: {
    fontSize: Math.min(22 * scale, 30),
    fontFamily: FontFamilies.BODY_BOLD,
    color: BASE_COLORS.STONE700
  },
  subTitle: {
    fontSize: Math.min(14 * scale, 20), 
    fontFamily: FontFamilies.BODY_LIGHT,
    color: BASE_COLORS.STONE700,
  },
  inputSug: {
    fontSize: Math.min(16 * scale, 20), 
    fontFamily: FontFamilies.BODY_LIGHT,
    color: BASE_COLORS.STONE600,
  },
  accentDark: {
    fontSize: Math.min(15 * scale, 22),
    fontFamily: FontFamilies.BODY_BOLD,
    color: BASE_COLORS.STONE600,
  },
  numbers: {
    fontSize: Math.min(22 * scale, 30),
    fontFamily: FontFamilies.BODY,
    color: BASE_COLORS.STONE600
  },
  defaultText: {
    fontSize: Math.min(17 * scale, 26),
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.STONE700,
  },
  tips: {
    fontSize: Math.min(14 * scale, 24),
    fontFamily: FontFamilies.BODY_LIGHT,
    color: BASE_COLORS.ACCENT_LIGHT
  },
});
