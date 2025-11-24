import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, ScrollView, Text, ActivityIndicator, StyleSheet, Image, Platform, TouchableOpacity, Alert, KeyboardAvoidingView } from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as ImagePicker from 'expo-image-picker';
import { BASE_COLORS } from '@/constants/Colors';
import { FontFamilies } from '@/constants/Fonts';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import Header from '@/components/header';

const ipadress = 'http://192.168.1.36:3001/api/chat';
const localhost = 'http://localhost:3001/api/chat';

type ChatMessage = {
  from: 'bot' | 'user';
  text?: string;
  type?: 'image' | 'text';
  data?: string;
};

export default function HomeScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: 'bot', text: 'Hey! How can I  help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  
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

      const res = await fetch(localhost, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

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
          if (uri.startsWith('data:')) {
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
    className="flex-1"
    style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
  >
    <Header
      title="ChatBot"
      iconName="ArrowRight"
      onIconPress={() => router.push("/progress" as any)}
    />

    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={{ flex: 1 }}>
        
        <ScrollView 
          ref={scrollViewRef} 
          style={styles.chat} 
          contentContainerStyle={{ paddingBottom: 120 }} // extra ruimte voor input
        >
          {messages.map((msg, i) => (
            <View key={i} style={msg.from === 'user' ? styles.userMsg : styles.botMsg}>
              {msg.data && (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${msg.data}` }}
                  style={{ width: 150, height: 150, marginBottom: 4, borderRadius: 8 }}
                />
              )}
              {msg.text && (msg.from === 'user' ? (
                <Markdown style={{ body: { color: BASE_COLORS.WHITE } }}>{msg.text}</Markdown>
              ) : (
                <Markdown>{msg.text}</Markdown>
              ))}
            </View>
          ))}

          {loading && <ActivityIndicator size="large" style={{ marginTop: 10 }} />}
        </ScrollView>

        {image && (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: image.uri }}
              style={{ width: 150, height: 150, borderRadius: 8 }}
            />
          </View>
        )}

        {/* INPUT ROW absoluut onderaan */}
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={[styles.plusButton, { backgroundColor: BASE_COLORS.TEXT_DARK }]}
              onPress={pickOrTakePhoto}
            >
              <Text style={styles.sendButtonText}>+</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
            />

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                onPress={send}
                style={[styles.sendButton, { backgroundColor: BASE_COLORS.TEXT_DARK }]}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
    </KeyboardAvoidingView>
  </View>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BASE_COLORS.LIGHT_BG,
  },
  chat: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  userMsg: {
    alignSelf: 'flex-end',
    backgroundColor: BASE_COLORS.TEXT_DARK,
    marginVertical: 4,
    padding: 10,
    borderRadius: 16,
    maxWidth: '80%',
  },
  botMsg: {
    alignSelf: 'flex-start',
    backgroundColor: BASE_COLORS.WHITE,
    marginVertical: 4,
    padding: 10,
    borderRadius: 16,
    maxWidth: '80%',
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  plusButton: {
    width: 40,
    height: 40,
    backgroundColor: BASE_COLORS.TEXT_DARK,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    backgroundColor: '#fff',
    fontFamily: FontFamilies.BODY_LIGHT,
  },
  buttonGroup: {
    marginLeft: 8,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
    minHeight: 40,
  },
  sendButtonText: {
    color: BASE_COLORS.WHITE,
    fontSize: 16,
    fontFamily: FontFamilies.BODY,
  },
});
