// components/BadgeEarnedModal.tsx
import { ThemedText } from "@/components/themed-text";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { Image } from "react-native";
import { Button, Modal, Portal } from "react-native-paper";

type Props = {
  visible: boolean;
  badgeName?: string | null;
  iconUrl?: string | null;
  onClose: () => void;
};

export function BadgeEarnedModal({
  visible,
  badgeName,
  iconUrl: badgeImageUrl,
  onClose,
}: Props) {
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
          alignItems: "center",
        }}
      >
        <ThemedText type="title" className="mb-2 text-center">
          New badge unlocked!
        </ThemedText>

        <ThemedText type="defaultText" className="mb-4 text-center">
          {badgeName
            ? `You've earned the "${badgeName}" badge.`
            : "You've earned a new badge!"}
        </ThemedText>

        {badgeImageUrl ? (
          <Image
            source={{ uri: badgeImageUrl }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              marginBottom: 24,
            }}
            resizeMode="contain"
          />
        ) : null}

        <Button
          mode="contained"
          onPress={onClose}
          style={{
            borderRadius: 20,
            backgroundColor: BASE_COLORS.TEXT_DARK,
          }}
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
