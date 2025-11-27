// components/LevelUpModal.tsx
import { View } from "react-native";
import { Modal, Portal, Button } from "react-native-paper";
import { ThemedText } from "@/components/themed-text";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

type Props = {
  visible: boolean;
  from: number;
  to: number;
  onClose: () => void;
};

export function LevelUpModal({ visible, from, to, onClose }: Props) {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={{
          marginHorizontal: 24,
          padding: 20,
          borderRadius: 16,
          backgroundColor: BASE_COLORS.LIGHT_BG,
        }}
      >
        <ThemedText type="title" className="mb-2 text-center">
          Level up!
        </ThemedText>
        <ThemedText type="defaultText" className="mb-4 text-center">
          You went from level {from} to level {to}.
        </ThemedText>

        <Button
          mode="contained"
          onPress={onClose}
          style={{ borderRadius: 20, backgroundColor: BASE_COLORS.TEXT_DARK }}
          labelStyle={{
            color: BASE_COLORS.WHITE,
            fontFamily: FontFamilies.BODY,
          }}
        >
          Nice!
        </Button>
      </Modal>
    </Portal>
  );
}
