import React, { useState, useRef } from "react";
import { View, TextInput, Button, Text, Image, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";

type Message = {
  type: "user" | "ai";
  content: string;
};

export default function AIChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const API_URL = "http://localhost:11434/api/generate"; // of je publieke URL

  const scrollToEnd = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const sendText = async () => {
    if (!inputText) return;

    const userMessage: Message = { type: "user", content: inputText };
    setMessages(prev => {
      // Voeg eerst je vraag toe
      const newMessages = [...prev, userMessage];
      // Voeg tijdelijk AI-bericht toe en start streaming
      newMessages.push({ type: "ai", content: "" });
      const aiIndex = newMessages.length - 1; // correcte index van tijdelijke AI-bericht
      streamAIResponse(inputText, aiIndex);
      return newMessages;
    });
    setInputText("");
    setLoading(true);
  };

  const streamAIResponse = async (prompt: string, aiIndex: number) => {
    let aiBuffer = "";
    let partial = "";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama2", prompt }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        partial += decoder.decode(value, { stream: true });
        const lines = partial.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              aiBuffer += data.response + " ";
              // update tijdelijke AI-bericht
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[aiIndex] = { type: "ai", content: aiBuffer.trim() };
                return newMessages;
              });
              scrollToEnd();
            }
          } catch {}
        }

        partial = partial.endsWith("\n") ? "" : partial.split("\n").pop()!;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendPhoto = async () => {
    if (!image) return;

    const userMessage: Message = { type: "user", content: "[Foto gestuurd]" };
    setMessages(prev => [...prev, userMessage]);

    try {
      const base64Image = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        quality: 0.7,
      });

      if (!base64Image.canceled) {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "moondream2",
            prompt: "Beschrijf deze foto",
            images: [base64Image.assets![0].base64!],
          }),
        });

        const data = await response.json();
        const aiMessage: Message = { type: "ai", content: data.response };
        setMessages(prev => [...prev, aiMessage]);
        scrollToEnd();
        setImage(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true });
    if (!result.canceled) setImage(result.assets?.[0].uri || null);
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
            {msg.type === "user" ? (
              <Text style={{ color: "blue" }}>Je: {msg.content}</Text>
            ) : (
              <Text style={{ color: "green" }}>AI: {msg.content}</Text>
            )}
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
