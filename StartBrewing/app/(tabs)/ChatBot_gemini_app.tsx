import React, { useState } from 'react';
import { View, TextInput, Button, ScrollView, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import Gemini from 'gemini-ai';  // let op welke SDK je gebruikt
import Markdown from 'react-native-markdown-display';
import * as ImagePicker from 'expo-image-picker';

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

  const send = async () => {
    if (!input && !image) return;

    const userMessage = input || (image ? "[image]" : "");
    setInput('');
    const userData = image && image.base64 != null ? image.base64 : undefined;
    setMessages(prev => [...prev, { from: 'user', type: image ? 'image' : 'text', text: userMessage, data: userData }]);
    setLoading(true);

    try {
      const body: { prompt: string; image?: string } = { prompt: input };
      if (image && image.base64 != null) {
        body.image = image.base64; // base64 string van de foto
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.chat}>
        {messages.map((msg, i) => (
          <View key={i} style={msg.from === 'user' ? styles.userMsg : styles.botMsg}>
            {msg.type === 'image' && msg.data ? (
              <Image source={{ uri: `data:image/jpeg;base64,${msg.data}` }} style={{ width: 100, height: 100 }} />
            ) : (
              <Markdown>{msg.text || ""}</Markdown>
            )}
          </View>
        ))}
        {loading && <ActivityIndicator size="large" />}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Typ een bericht..."
        />
        <Button title="Foto" onPress={pickImage} />
        <Button title="Stuur" onPress={send} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  chat: { flex: 1, marginBottom: 10 },
  userMsg: { alignSelf: 'flex-end', backgroundColor: '#DCF8C6', margin: 4, padding: 8, borderRadius: 5 },
  botMsg: { alignSelf: 'flex-start', backgroundColor: '#FFF', margin: 4, padding: 8, borderRadius: 5 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderColor: '#ccc', borderWidth: 1, borderRadius: 5, padding: 8, marginRight: 8 },
});
