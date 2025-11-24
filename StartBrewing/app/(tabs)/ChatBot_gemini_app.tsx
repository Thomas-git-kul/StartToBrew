import React, { useState } from 'react';
import { View, TextInput, Button, ScrollView, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Gemini from 'gemini-ai';  // let op welke SDK je gebruikt
import Markdown from 'react-native-markdown-display';

const ipadress = 'http://192.168.1.36:3001/api/chat';
const localhost = 'http://localhost:3001/api/chat';

export default function HomeScreen() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hey! Where can I help you with?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input) return;
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(localhost, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage }),
      });
      console.log('Response status:', res.status);
      const data = await res.json();
      setMessages(prev => [...prev, { from: 'bot', text: data.text }]);
      console.log('Data:', data);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { from: 'bot', text: 'Sorry, er ging iets mis.' }]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <ScrollView style={styles.chat}>
        {messages.map((msg, i) => (
          <View key={i} style={msg.from === 'user' ? styles.userMsg : styles.botMsg}>
            <Markdown>{msg.text}</Markdown>
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
