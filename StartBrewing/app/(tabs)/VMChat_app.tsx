import React, { useState, useRef } from "react";
import { View, TextInput, Button, Text, Image, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";

type Message = {
  type: "user" | "ai" ;
  content: string;
};

export default function AIChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const API_URL = "http://20.199.11.38:11434/api/generate"; // update naar juiste endpoint

  const scrollToEnd = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  // AI-call met raw debug
  const sendToAI = async (payload: any): Promise<string> => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await response.text();

      // Voeg raw server output toe als debugbericht
      //setMessages(prev => [...prev, { type: "debug", content: `RAW RESPONSE:\n${text}` }]);
      
      try {
        const data = JSON.parse(text);
        return data.response || "Geen antwoord van AI.";
      } catch (err) {
        console.error("JSON parse error:", err, text);
        return "JSON parse error: server stuurde geen geldig JSON.";
      }
    } catch (err) {
      console.error("Error contacting AI:", err);
      return "Er is iets misgegaan bij de AI.";
    }
  };

  // Chunked AI bericht (typing-effect)
  const addAIMessageChunked = async (fullText: string) => {
    const tempMessage: Message = { type: "ai", content: "" };
    setMessages(prev => [...prev, tempMessage]);

    const chunkSize = 30; // karakters per update
    let displayed = "";

    for (let i = 0; i < fullText.length; i += chunkSize) {
      displayed += fullText.slice(i, i + chunkSize);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { type: "ai", content: displayed };
        return newMessages;
      });
      scrollToEnd();
      await new Promise(res => setTimeout(res, 50)); // korte pauze
    }
  };

  const sendText = async () => {
    if (!inputText) return;

    setMessages(prev => [...prev, { type: "user", content: inputText }]);
    setInputText("");
    setLoading(true);

    const aiReply = await sendToAI({ model: "llama2", prompt: inputText, stream: false });
    await addAIMessageChunked(aiReply);

    setLoading(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true });
    if (!result.canceled) setImage(result.assets?.[0].uri || null);
  };

  const sendPhoto = async () => {
    if (!image) return;

    setMessages(prev => [...prev, { type: "user", content: "[Foto gestuurd]" }]);

    try {
      const base64Image = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        quality: 0.7,
      });

      if (!base64Image.canceled) {
        const aiReply = await sendToAI({
          model: "moondream2",
          prompt: "Beschrijf deze foto",
          images: [base64Image.assets![0].base64!],
          stream: false,
        });

        await addAIMessageChunked(aiReply);
        setImage(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <ScrollView
        style={{ flex: 1, marginBottom: 10 }}
        ref={scrollViewRef}
        onContentSizeChange={scrollToEnd}
      >
        {messages.map((msg, idx) => (
          <View key={idx} style={{ marginVertical: 5 }}>
            <Text style={{ color: msg.type === "user" ? "blue" : "green"}}>
              {msg.type === "user" ? "Je: " : "ai" }
              {msg.content}
            </Text>
          </View>
        ))}
        {loading && <Text style={{ fontStyle: "italic" }}>AI is bezig...</Text>}
        {image && <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}
      </ScrollView>

      <TextInput
        placeholder="Typ je vraag..."
        value={inputText}
        onChangeText={setInputText}
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 5 }}
      />

      <Button title="Verstuur tekst" onPress={sendText} />
      <Button title="Selecteer foto" onPress={pickImage} />
      <Button title="Verstuur foto" onPress={sendPhoto} disabled={!image} />
    </View>
  );
}
