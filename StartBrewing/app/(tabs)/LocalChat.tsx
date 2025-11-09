import React, { useState, useEffect, useCallback, useRef } from "react";
import { GiftedChat, IMessage } from "react-native-gifted-chat";
import { ActivityIndicator, View, Text } from "react-native";
import * as webllm from "@mlc-ai/web-llm";

export default function LocalChat() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [engine, setEngine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isResponding, setIsResponding] = useState(false);
  const messagesRef = useRef<IMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    async function loadModel() {
      try {
        console.log("Model laden...");
        const chatEngine = await webllm.CreateMLCEngine(
          // Modelnaam dat werkt in de browser + Expo
          "Phi-3-mini-4k-instruct-q4f16_1-MLC",
          {
            initProgressCallback: (report) => {
              if (report.progress) setProgress(report.progress);
              console.log(report.text);
            },
          }
        );
        console.log("Model geladen!");
        setEngine(chatEngine);
      } catch (err) {
        console.error("Fout bij laden van model:", err);
      } finally {
        setLoading(false);
      }
    }

    loadModel();
  }, []);

const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      if (!newMessages || newMessages.length === 0) return;

      // Voeg gebruiker direct toe en update ref
      const userMessage = newMessages[0];
      const appended = GiftedChat.append(messagesRef.current, [userMessage]);
      setMessages(appended);
      messagesRef.current = appended;

      if (!engine) return;
      setIsResponding(true);

      try {
        // Bouw chat-history vanaf de actuele ref
        const chatHistory = messagesRef.current.map((msg) => ({
          role: msg.user._id === 1 ? "user" : "assistant",
          content: msg.text || "",
        }));

        // Zorg dat het nieuwe bericht zeker aanwezig is
        chatHistory.push({ role: "user", content: userMessage.text || "" });

        // timeout om eeuwig wachten te voorkomen
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Chat timeout")), 30000)
        );

        const responsePromise = engine.chat.completions.create({
          messages: chatHistory,
          temperature: 0.7,
          stream: true,
        });

        const response: any = await Promise.race([timeoutPromise, responsePromise]);

        // streaming handling
        let fullResponse = "";
        const botId = `ai-${Date.now()}`;
        const updateInterval = 50; // update elke 50ms
        let lastUpdate = Date.now();

        const pushBot = (text: string) => {
          const botMessage: IMessage = {
            _id: botId,
            text: text.trim(),
            createdAt: new Date(),
            user: { _id: 2, name: "AI" },
          };
          const filtered = messagesRef.current.filter((m) => m._id !== botId);
          const next = GiftedChat.append(filtered, [botMessage]);
          setMessages(next);
          messagesRef.current = next;
        };

        // Check of response een async iterable (stream) is
        if (response && typeof response[Symbol.asyncIterator] === "function") {
          for await (const chunk of response) {
            const content = chunk?.choices?.[0]?.delta?.content || "";
            if (content) fullResponse += content;

            const now = Date.now();
            if (now - lastUpdate >= updateInterval) {
              pushBot(fullResponse);
              lastUpdate = now;
            }
          }
          // finale push
          pushBot(fullResponse);
        } else {
          // geen stream, normale respons
          const text = response?.choices?.[0]?.message?.content || String(response);
          fullResponse = text;
          pushBot(fullResponse);
        }
      } catch (error: any) {
        console.error("Chat error details:", error);

        const isDeviceError = /NDArray|Device removed|DeviceLost|DXGI_ERROR_DEVICE_HUNG/i.test(
          String(error?.message || error)
        );

        const userMsg = isDeviceError
          ? "Model crashte door GPU/geheugen. Probeer een lichtere modelvariant of herlaad de app."
          : "Sorry, er ging iets mis. Probeer het opnieuw.";

        const errorMessage: IMessage = {
          _id: `ai-err-${Date.now()}`,
          text: userMsg,
          createdAt: new Date(),
          user: { _id: 2, name: "AI" },
        };

        const next = GiftedChat.append(messagesRef.current, [errorMessage]);
        setMessages(next);
        messagesRef.current = next;

        // bij device/GPU errors: probeer engine te unloaden zodat gebruiker kan herladen met lichter model
        if (isDeviceError) {
          try {
            if (engine?.dispose) await engine.dispose();
          } catch (e) {
            console.warn("Fout bij dispose engine:", e);
          }
          setEngine(null);
          console.warn("Engine unloaded due to device error. Consider loading a lighter model.");
        }
      } finally {
        setIsResponding(false);
      }
    },
    [engine]
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>
          Model laden... {Math.round(progress * 100)}%
        </Text>
      </View>
    );
  }

  return (
    <GiftedChat
      messages={messages}
      onSend={onSend}
      user={{ _id: 1, name: "Jij" }}
      placeholder="Typ a message..."
      renderLoading={() => isResponding && <ActivityIndicator size="small" />}
      isLoadingEarlier={isResponding}
    />
  );
}
