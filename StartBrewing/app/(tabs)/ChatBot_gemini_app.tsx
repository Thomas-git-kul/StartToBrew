import React, { useState } from 'react';
import { View, TextInput, Button, ScrollView, Text, ActivityIndicator, StyleSheet, Image, Platform } from 'react-native';
import Gemini from 'gemini-ai';  // let op welke SDK je gebruikt
import Markdown from 'react-native-markdown-display';
import * as ImagePicker from 'expo-image-picker';
import { TouchableOpacity, Alert } from 'react-native';

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
    { from: 'bot', text: 'Hey! Where can I help you with?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

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
      const body: { prompt: string; image?: string } = { prompt: input };
      if (image && image.base64 != null) {
        body.image = image.base64; // base64 string van de foto
      }

      const res = await fetch(ipadress, {
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

  /*
  const pickOrTakePhoto = async () => {
    Alert.alert(
      "Foto",
      "Kies een optie",
      [
        {
          text: "Upload foto",
          onPress: pickImage
        },
        {
          text: "Neem foto",
          onPress: takePhoto
        },
        {
          text: "Annuleer",
          style: "cancel"
        }
      ]
    );
  };
  */

  const pickImageWeb = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setImage({ uri: reader.result as string, base64: undefined } as any);
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
      <View style={styles.container}>
        <ScrollView style={styles.chat} contentContainerStyle={{ paddingBottom: 10 }}>
          {messages.map((msg, i) => (
            <View key={i} style={msg.from === 'user' ? styles.userMsg : styles.botMsg}>
              {/* Foto tonen als die er is */}
              {msg.data && (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${msg.data}` }}
                  style={{ width: 150, height: 150, marginBottom: 4, borderRadius: 8 }}
                />
              )}
              {/* Tekst altijd tonen als die er is */}
              {msg.text && <Markdown>{msg.text}</Markdown>}
            </View>
          ))}
          {loading && <ActivityIndicator size="large" style={{ marginTop: 10 }} />}
        </ScrollView>

      {image && (
        <View style={styles.previewContainer}>
          <Text style={{ marginBottom: 4 }}>Preview:</Text>
          <Image
            source={{ uri: image.uri }}
            style={{ width: 150, height: 150, borderRadius: 8 }}
          />
        </View>
      )}

  <View style={styles.inputRow}>
    {/* Plus knop */}
    <TouchableOpacity style={styles.plusButton} onPress={pickOrTakePhoto}>
      <Text style={styles.plusText}>+</Text>
    </TouchableOpacity>

    {/* Input veld */}
    <TextInput
      style={styles.input}
      value={input}
      onChangeText={setInput}
      placeholder="Typ een bericht..."
    />
    <View style={styles.buttonGroup}>
      <Button title="Stuur" onPress={send} />
    </View>
  </View>
</View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  chat: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  userMsg: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    marginVertical: 4,
    padding: 10,
    borderRadius: 16,
    maxWidth: '80%',
  },
  botMsg: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  plusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    backgroundColor: '#fff',
  },
  buttonGroup: {
    marginLeft: 8,
  },
});
