import { Dialog, Portal, Button } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { Text, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

interface DialogProps {
  title: string;
  text?: String;
  cancelBtn?: String,
  yesBtn?: String,
  onPressCancel?: () => void;
  onPressYes?: () => void;
  visible?: boolean;
  onDismiss?: () => void;
}

export default function DialogCustom({
  title,
  text,
  cancelBtn,
  yesBtn,
  onPressCancel,
  onPressYes,
  visible = false,
  onDismiss
}: DialogProps) {
  return (
    <Portal>
        <Dialog 
          visible={visible} 
          onDismiss={onDismiss}
          style={{ backgroundColor: BASE_COLORS.WHITE }}
        >
          <Dialog.Title
            style={{
              fontSize: Math.min(16 * scale, 24), 
              fontFamily: FontFamilies.BODY_BOLD,
              color: BASE_COLORS.ACCENT_PRIMARY,
            }}
          >{title}</Dialog.Title>
          <Dialog.Content>
            {text && (
              <Text
                style={{
                  fontSize: Math.min(17 * scale, 26),
                  fontFamily: FontFamilies.HEADING,
                  color: BASE_COLORS.STONE700,
                }}
              >
                {text}
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            {onPressCancel && (
              <Button onPress={onPressCancel}>
                <Text 
                  style={{ 
                    fontSize: Math.min(12 * scale, 22),
                    fontFamily: FontFamilies.BODY,
                    color: BASE_COLORS.STONE600,
                  }}
                >
                  {cancelBtn}
                </Text>
              </Button>
            )}
            {onPressYes && (
              <Button onPress={onPressYes} textColor={BASE_COLORS.RED600}>
                <Text 
                  style={{ 
                    fontSize: Math.min(14 * scale, 22),
                    fontFamily: FontFamilies.BODY_BOLD,
                    color: BASE_COLORS.RED600,
                  }}
                >
                  {yesBtn}
                </Text>
              </Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>
  );
}