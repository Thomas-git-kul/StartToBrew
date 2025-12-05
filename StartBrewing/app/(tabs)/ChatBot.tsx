import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Image, Platform, Alert, KeyboardAvoidingView, Pressable } from 'react-native';
import { Avatar } from "react-native-paper";
import Markdown from 'react-native-markdown-display';
import * as ImagePicker from 'expo-image-picker';
import { BASE_COLORS } from '@/constants/Colors';
import { FontFamilies } from '@/constants/Fonts';
import { useFonts } from "@/hooks/use-fonts";
import { useRouter } from 'expo-router';
import Header from '@/components/header';
import { Button } from 'react-native-paper';
import Spinner from '@/components/spinner';
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import { SendHorizonal, Plus, BotMessageSquare } from "lucide-react-native";

type ChatMessage = {
  from: 'bot' | 'user';
  text?: string;
  type?: 'image' | 'text';
  data?: string;
};

export default function ChatBot() {
  useFonts();

  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: 'bot', text: 'Hey! How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  const { fromProgress } = useLocalSearchParams();
  
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0]); // assets[0] bevat uri en base64
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0]); // assets[0] bevat uri en base64
    }
  };

  const send = async () => {
    if (!input && !image) return;

    const userMessage = input || (image ? "[image]" : "");
    setInput('');
    const userData = image && image.base64 != null ? image.base64 : undefined;
    setMessages(prev => [...prev, { from: 'user', text: input || undefined, data: userData }]);
    setLoading(true);

    try {
      const promptText = input || "[image]";
      const body: { prompt: string; image?: string } = { prompt: promptText };
      if (image?.base64) {
        body.image = image.base64;
      }

      const res = await fetch("https://neeqemudecnuayqlvohk.supabase.co/functions/v1/ChatBot", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
         },
        body: JSON.stringify(body),
      }
      );

      const data = await res.json();
      setMessages(prev => [...prev, { from: 'bot', text: data.text }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { from: 'bot', text: 'Sorry, er ging iets mis.' }]);
    } finally {
      setLoading(false);
      setImage(null); // reset image na verzenden
    }
  };

  const pickImageWeb = () => {
    // Guard for non-browser (jest/node) environments
    if (typeof document === 'undefined') return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          let uri = reader.result as string;
          let base64 = undefined;
          if (typeof uri === 'string' && uri.startsWith('data:')) {
            base64 = uri.split(',')[1]; // strip "data:image/...;base64,"
          }
          setImage({ uri, base64 } as any);
        };
        reader.readAsDataURL(file); // base64 voor web is dataURL
      }
    };
    input.click();
  };

  const pickOrTakePhoto = () => {
    if (Platform.OS === 'web') {
      pickImageWeb();
    } else {
      Alert.alert(
        "Foto",
        "Kies een optie",
        [
          { text: "Upload foto", onPress: pickImage },
          { text: "Neem foto", onPress: takePhoto },
          { text: "Annuleer", style: "cancel" }
        ]
      );
    }
  };

  return (
  <View 
    style={{ flex: 1, backgroundColor: BASE_COLORS.LIGHT_BG }}
  >
    <Header
      title="ChatBot"
      actionTestIDLeft='back-header'
      iconNameLeft='ArrowLeft'
      onIconPressLeft={() => {
        if (fromProgress) {
          router.push(`/progress?id=${fromProgress}`);
        } else {
          router.back();
        }
      }}

    />

    <KeyboardAvoidingView
      style={{ 
        flex: 1, 
        backgroundColor: BASE_COLORS.LIGHT_BG
      }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <SafeAreaView className='flex-1 mx-3'>
        <ScrollView showsVerticalScrollIndicator={false} ref={scrollViewRef}>
          {messages.map((msg, i) => (
            <View key={i}>
              {msg.from === "bot" && (
                <View className="flex-row items-center gap-2">
                  <Avatar.Icon 
                    size={32} 
                    icon={() => <BotMessageSquare size={20} color={BASE_COLORS.STONE700} />} 
                    style={{ backgroundColor: "transparent" }} 
                  />
                  <Text
                    style={{
                      fontFamily: FontFamilies.BODY_BOLD,
                      fontSize: 14,
                      color: BASE_COLORS.STONE700,
                    }}
                  >BeerBot</Text>
                </View>
              )}

              <View
                testID={msg.from === "bot" ? `bot-msg-${i}` : `user-msg-${i}`}
                style={msg.from === "user" ? styles.userMsg : styles.botMsg}
              >
                {msg.text && (
                  <Markdown
                    style={{
                      body: {
                        color:
                          msg.from === "user"
                            ? BASE_COLORS.STONE950
                            : BASE_COLORS.STONE950,
                      },
                    }}
                  >{msg.text}</Markdown>
                )}

                {msg.data && (
                  <Image
                    source={{
                      uri:
                        typeof msg.data === "string" && msg.data.startsWith("data:")
                          ? msg.data
                          : `data:image/jpeg;base64,${msg.data}`,
                    }}
                    style={{
                      width: "100%",
                      height: 200,
                      marginBottom: 12,
                      borderRadius: 8,
                    }}
                  />
                )}
              </View>
            </View>
          ))}

          {loading && 
            <Spinner title="Thinking..." size="large" />
          }
        </ScrollView>

        {/* INPUT ROW absoluut onderaan */}
        <View className="flex flex-row items-center justify-between gap-2 py-2">
          <Pressable
            onPress={pickOrTakePhoto}
          >
            <Plus color={BASE_COLORS.STONE700} strokeWidth={3}/>
          </Pressable>

          <TextInput
            testID="chat-input"
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: BASE_COLORS.STONE200,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: Platform.OS === 'ios' ? 10 : 8,
              backgroundColor: BASE_COLORS.WHITE,
              fontFamily: FontFamilies.BODY_LIGHT,
            }}
          />
            <Button
              testID="send-button"
              onPress={send}
              style={{
                backgroundColor: BASE_COLORS.TEXT_DARK,
                borderRadius: 45,
              }}
            >
              <SendHorizonal color={BASE_COLORS.WHITE}/>
            </Button>
        </View>

        {image && (
          <View className="items-start pb-2">
            <Image
              source={{ uri: image.uri }}
              style={{ width: 150, height: 150, borderRadius: 8 }}
            />
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  </View>
);
};

const styles = StyleSheet.create({
  userMsg: {
    alignSelf: 'flex-end',
    backgroundColor: BASE_COLORS.STONE200,
    marginBottom: 4,
    paddingInline: 16,
    borderRadius: 24,
    maxWidth: '90%',
  },
  botMsg: {
    alignSelf: 'flex-start',
    marginBottom: 4,
    paddingInline: 16,
    maxWidth: '90%',
  },
});
